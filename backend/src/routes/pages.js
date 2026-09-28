import Joi from 'joi'
import Boom from '@hapi/boom'
import { Page, PAGE_STATUS } from '../models/Page.js'
import { Book, sameAuthorId } from '../models/Book.js'
import { requireOwnedBook } from './bookEntities.js'
import { detailedFailAction } from './detailedFailAction.js'

/**
 * Page endpoints — the writing surface.
 *
 * Mounted under the same `/api/books` prefix as the books and story-bible
 * routes, so these resolve to /api/books/:bookId/pages and the ownership check
 * is the same one: the author only. A manuscript is the most private thing
 * the platform holds, so unlike a book itself there is no public read here —
 * the reading endpoints arrive with the reader side.
 *
 * `ordinal` is server-owned. The client sends it nowhere: a new page appends
 * at `pageCount + 1`, and a delete rewinds every later page by one, so the
 * stack the author sees is always gapless.
 */

const pageParams = Joi.object({
  bookId: Joi.string().hex().length(24).required(),
  pageId: Joi.string().hex().length(24).required(),
})

const bookParams = Joi.object({
  bookId: Joi.string().hex().length(24).required(),
})

const pageFields = {
  title: Joi.string().trim().min(1).max(200),
  body: Joi.string().trim().max(50000).allow(''),
  mood: Joi.string().trim().max(20).allow(''),
  status: Joi.string().valid(...PAGE_STATUS),
}

const createPayload = Joi.object({
  ...pageFields,
  title: pageFields.title.required(),
})

const patchPayload = Joi.object(pageFields)

/** The editor's word-count readout, so reading time never disagrees with it. */
const countWords = (text) => (text ?? '').trim().split(/\s+/).filter(Boolean).length

export default {
  name: 'page-routes',
  version: '1.0.0',
  register(server) {
    server.route({
      method: 'GET',
      path: '/{bookId}/pages',
      options: {
        description:
          "A book's pages, in ordinal order. A public book's published pages are world-readable; anything else is author-only, drafts included.",
        // Optional, not required: a public book's published pages are the
        // book's public content, readable without an account — the same
        // contract the library catalog is built on. Drafts of a public book,
        // and every page of an unlisted or private one, stay behind the
        // author check below.
        auth: { mode: 'optional' },
        validate: { params: bookParams, failAction: detailedFailAction },
      },
      handler: async (request) => {
        const { bookId } = request.params
        const book = await Book.findById(bookId).select('_id author visibility')
        if (!book) throw Boom.notFound('No such book')

        const user = request.auth.artifacts?.user
        const isOwner = Boolean(user) && sameAuthorId(book.author, user._id)

        // A reader sees only what the author published — the book's public
        // face, the same contract the library catalog is built on.
        if (book.visibility === 'public' && !isOwner) {
          const pages = await Page.find({ book: bookId, status: 'published' }).sort({ ordinal: 1 })
          return { pages }
        }

        // The author always sees their whole manuscript, drafts included —
        // the studio is where a draft is managed, so hiding it here would
        // make a public book's drafts uneditable. A non-author asking for a
        // non-public book is refused.
        if (!isOwner) throw Boom.forbidden('This book is not public')
        const pages = await Page.find({ book: bookId }).sort({ ordinal: 1 })
        return { pages }
      },
    })

    server.route({
      method: 'POST',
      path: '/{bookId}/pages',
      options: {
        description: 'Append a page to the end of the book. Author only.',
        validate: { params: bookParams, payload: createPayload, failAction: detailedFailAction },
      },
      handler: async (request, h) => {
        const user = request.auth.artifacts.user
        const book = await requireOwnedBook(request.params.bookId, user)

        // Appending at pageCount + 1 is what keeps ordinals gapless without a
        // read-modify-write race the author can trigger by saving twice.
        const ordinal = book.pageCount + 1
        const page = await Page.create({
          book: book._id,
          ordinal,
          title: request.payload.title,
          body: request.payload.body ?? '',
          mood: request.payload.mood ?? '',
          status: request.payload.status ?? 'draft',
        })

        book.pageCount += 1
        book.currentPage = ordinal
        await book.save()

        return h.response({ page }).code(201)
      },
    })

    server.route({
      method: 'GET',
      path: '/{bookId}/pages/{pageId}',
      options: {
        description: 'One page. Author only.',
        validate: { params: pageParams, failAction: detailedFailAction },
      },
      handler: async (request) => {
        await requireOwnedBook(request.params.bookId, request.auth.artifacts.user)
        const page = await Page.findOne({ _id: request.params.pageId, book: request.params.bookId })
        if (!page) throw Boom.notFound('No such page')
        return { page }
      },
    })

    server.route({
      method: 'PATCH',
      path: '/{bookId}/pages/{pageId}',
      options: {
        description: 'Edit a page, or publish/unpublish it. Author only.',
        validate: { params: pageParams, payload: patchPayload, failAction: detailedFailAction },
      },
      handler: async (request) => {
        const book = await requireOwnedBook(request.params.bookId, request.auth.artifacts.user)
        const page = await Page.findOne({ _id: request.params.pageId, book: book._id })
        if (!page) throw Boom.notFound('No such page')

        const { title, body, mood, status } = request.payload
        if (title !== undefined) page.title = title
        if (body !== undefined) page.body = body
        if (mood !== undefined) page.mood = mood
        if (status !== undefined) page.status = status

        await page.save()

        // Editing moves the author's position in the manuscript to the page
        // they were just on; `currentPage` is a projection of that, not a
        // setting a form submits.
        book.currentPage = Math.min(page.ordinal, book.pageCount)
        await book.save()

        return { page, words: countWords(page.body) }
      },
    })

    server.route({
      method: 'DELETE',
      path: '/{bookId}/pages/{pageId}',
      options: {
        description: 'Delete a page. Author only.',
        validate: { params: pageParams, failAction: detailedFailAction },
      },
      handler: async (request) => {
        const user = request.auth.artifacts.user
        const book = await requireOwnedBook(request.params.bookId, user)
        const page = await Page.findOne({ _id: request.params.pageId, book: book._id })
        if (!page) throw Boom.notFound('No such page')

        await page.deleteOne()

        // Rewind every page after the deleted one so the ordinal stack stays
        // gapless, then drop the count to match.
        await Page.updateMany(
          { book: book._id, ordinal: { $gt: page.ordinal } },
          { $inc: { ordinal: -1 } },
        )

        book.pageCount = Math.max(0, book.pageCount - 1)
        book.currentPage = Math.min(book.currentPage, book.pageCount || 1)
        await book.save()

        return { deleted: true, pageCount: book.pageCount }
      },
    })
  },
}
