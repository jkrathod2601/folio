import Joi from 'joi'
import Boom from '@hapi/boom'
import {
  Book,
  LAYOUTS,
  BOOK_STATUS,
  VISIBILITIES,
  AGE_RATINGS,
  COVER_RIGHTS,
  MAX_COVER_BYTES,
  sameAuthorId,
} from '../models/Book.js'
import { BookCharacter } from '../models/BookCharacter.js'
import { BookPlace } from '../models/BookPlace.js'
import { BookSection } from '../models/BookSection.js'
import { readImageUpload, rawImagePayload } from './imageUpload.js'
import { syncStoryEntities, characterItem, placeItem, sectionItem } from './bookEntities.js'
import { detailedFailAction } from './detailedFailAction.js'


/**
 * Book endpoints.
 *
 * Every route here requires a bearer token — the default auth mode is
 * `required`, so unlike the public auth routes there is no `auth` option to
 * forget. `request.auth.artifacts.user` is the already-verified account, which
 * is why the author id is never read from the body.
 *
 * Ownership is checked per route rather than with a scope, because the rule is
 * not binary: a public book is readable by anyone and writable by exactly one
 * person. A scope cannot express that.
 */

const hex = Joi.string().pattern(/^#[0-9a-fA-F]{6}$/)

const idParam = Joi.object({
  id: Joi.string().hex().length(24).required(),
})

/** Design block. Every field optional, so a partial patch is a partial patch. */
const designPayload = Joi.object({
  coverColor: hex,
  textColor: hex,
  accentColor: hex,
  layout: Joi.string().valid(...LAYOUTS),
  titleScale: Joi.string().valid('small', 'medium', 'large'),
  ornament: Joi.string().valid('none', 'rule', 'frame', 'double-rule'),
  showBlurb: Joi.boolean(),
})

/** A bounded free-text list, matching the schema's `tagList` caps. */
const tagList = (max, noun) =>
  Joi.array().items(Joi.string().trim().min(1).max(60)).max(max)

/**
 * Descriptive metadata. All optional, all defaulting to empty.
 *
 * These are the fields that help while writing rather than fields a publisher
 * demands, so nothing here is required and there is no combination of them that
 * a half-written draft fails.
 */
const metadataPayload = {
  language: Joi.string().trim().max(60).allow(''),
  originalLanguage: Joi.string().trim().max(60).allow(''),
  series: Joi.string().trim().max(120).allow(''),
  seriesIndex: Joi.number().integer().min(1).allow(null),
  themes: tagList(12, 'themes'),
  moods: tagList(12, 'moods'),
  motifs: tagList(12, 'motifs'),
  contentWarnings: tagList(20, 'content warnings'),
  ageRating: Joi.string().valid(...AGE_RATINGS),
  coverCredit: Joi.string().trim().max(200).allow(''),
  coverRights: Joi.string().valid(...COVER_RIGHTS),
  publisher: Joi.string().trim().max(120).allow(''),
  publishedAt: Joi.date().allow(null),
  isbn: Joi.string().trim().max(20).allow(''),
  edition: Joi.string().trim().max(40).allow(''),
}

/**
 * Story-bible arrays, accepted inline so the create form saves a title, a cast
 * list and an outline in one submit rather than three round trips.
 *
 * Reconciled by the same `syncStoryEntities` the per-collection routes use, so
 * "what a missing entry means" cannot differ between the two paths.
 */
const storyArrays = {
  characters: Joi.array().items(characterItem).max(100),
  places: Joi.array().items(placeItem).max(100),
  sections: Joi.array().items(sectionItem).max(200),
}

const STORY_TARGETS = {
  characters: { model: BookCharacter, ownFields: ['name', 'aliases', 'role', 'description', 'age', 'firstAppearance'] },
  places: { model: BookPlace, ownFields: ['name', 'kind', 'description'] },
  sections: { model: BookSection, ownFields: ['title', 'kind', 'summary'] },
}

/**
 * Create payload.
 *
 * `pageCount` and `currentPage` are deliberately absent. Joi rejects unknown
 * keys outright, so a client that sends them gets a 400 naming the field —
 * those counters move as pages are written and read, never as a form value.
 */
const createPayload = Joi.object({
  title: Joi.string().trim().min(1).max(200).required(),
  subtitle: Joi.string().trim().max(300).allow('').default(''),
  blurb: Joi.string().trim().max(2000).allow('').default(''),
  genres: Joi.array().items(Joi.string().trim().min(1).max(60)).max(8).default([]),
  mark: Joi.string().trim().max(40).allow('').default(''),
  visibility: Joi.string().valid(...VISIBILITIES).default('unlisted'),
  status: Joi.string().valid(...BOOK_STATUS).default('draft'),
  design: designPayload.default({}),
  ...metadataPayload,
  ...storyArrays,
})

/**
 * Patch payload: the same fields, all optional.
 *
 * `status` is editable here, which means an author can publish and unpublish
 * their own book. That is intended, and the author-only check below is what
 * makes it safe.
 *
 * The story arrays are optional *and* absent-means-untouched: a client that
 * patches a title must not silently delete the author's cast list. Sending the
 * key is what says "reconcile these".
 */
const patchPayload = Joi.object({
  title: Joi.string().trim().min(1).max(200),
  subtitle: Joi.string().trim().max(300).allow(''),
  blurb: Joi.string().trim().max(2000).allow(''),
  genres: Joi.array().items(Joi.string().trim().min(1).max(60)).max(8),
  mark: Joi.string().trim().max(40).allow(''),
  visibility: Joi.string().valid(...VISIBILITIES),
  status: Joi.string().valid(...BOOK_STATUS),
  design: designPayload,
  ...metadataPayload,
  ...storyArrays,
})


/** Just enough to render a byline; the whole user document is never needed. */
const AUTHOR_FIELDS = 'name username portraitUrl'

/** 404 for a missing book, 403 for one this account may not open. */
async function findVisible(id, user) {
  const book = await Book.findById(id).populate('author', AUTHOR_FIELDS)
  if (!book) throw Boom.notFound('No such book')
  if (!book.isVisibleTo(user)) throw Boom.forbidden('This book is private')
  return book
}

/**
 * Editing and deleting are author-only. Visibility deliberately not consulted.
 *
 * Goes through `sameAuthorId` because this is reachable from a populated book
 * in some call paths and a raw ObjectId in others; a plain `toString()`
 * comparison passes in one and silently fails in the other.
 */
function assertOwner(book, user) {
  if (!sameAuthorId(book.author, user._id)) {
    throw Boom.forbidden('Only the author can change this book')
  }
}

export default {
  name: 'book-routes',
  version: '1.0.0',
  register(server) {
    server.route({
      method: 'POST',
      path: '/',
      options: {
        description: "Create a book in the signed-in author's shelf",
        validate: { payload: createPayload, failAction: detailedFailAction },
      },
      handler: async (request, h) => {
        const { user } = request.auth.artifacts
        const { characters, places, sections, ...bookFields } = request.payload
        const book = await Book.create({ ...bookFields, author: user._id })

        // Story-bible entries are written after the book exists because they
        // need its id. A failure here leaves the book saved but empty of them,
        // which the author can fix by saving again — the alternative, rolling
        // the book back too, throws away a title they already typed.
        for (const [field, items] of Object.entries({ characters, places, sections })) {
          if (!items?.length) continue
          const { model, ownFields } = STORY_TARGETS[field]
          await syncStoryEntities({ model, bookId: book._id, items, ownFields })
        }

        return h.response({ book }).code(201)
      },
    })

    server.route({
      method: 'GET',
      path: '/discover',
      options: {
        description: 'The public catalog: published, public books, newest first.',
        // Public by design. A book an author has published and made public is
        // meant to be found; this is a read-only listing of its metadata, and
        // the { status, visibility, createdAt } index exists for exactly this
        // query. Static segment, so it wins over /:bookId without relying on
        // registration order.
        auth: false,
        validate: {
          query: Joi.object({
            limit: Joi.number().integer().min(1).max(100).default(50),
          }),
          failAction: detailedFailAction,
        },
      },
      handler: async (request) => {
        const { limit } = request.query
        const books = await Book.find({ status: 'published', visibility: 'public' })
          .populate('author', AUTHOR_FIELDS)
          .sort({ createdAt: -1 })
          .limit(limit)
        return { books }
      },
    })

    server.route({
      method: 'GET',
      path: '/',
      options: {
        description: "The signed-in author's books, newest first",
        // Bounded for the same reason /admin/users is: an unbounded list is a
        // denial-of-service surface once a shelf gets large.
        validate: {
          query: Joi.object({
            status: Joi.string().valid(...BOOK_STATUS),
            limit: Joi.number().integer().min(1).max(100).default(50),
          }),
          failAction: detailedFailAction,
        },
      },
      handler: async (request) => {
        const { status, limit } = request.query
        const filter = { author: request.auth.artifacts.user._id }
        if (status) filter.status = status

        return { books: await Book.find(filter).sort({ createdAt: -1 }).limit(limit) }
      },
    })

    server.route({
      method: 'GET',
      path: '/{id}',
      options: { description: 'A single book', validate: { params: idParam, failAction: detailedFailAction } },
      handler: async (request) => ({
        book: await findVisible(request.params.id, request.auth.artifacts.user),
      }),
    })

    server.route({
      method: 'PATCH',
      path: '/{id}',
      options: {
        description: 'Edit a book. Author only.',
        validate: { params: idParam, payload: patchPayload, failAction: detailedFailAction },
      },
      handler: async (request) => {
        const user = request.auth.artifacts.user
        const book = await Book.findById(request.params.id)
        if (!book) throw Boom.notFound('No such book')
        assertOwner(book, user)

        // Field by field rather than Object.assign(book, payload), so `design`
        // merges into the existing subdocument. A blind assign would replace the
        // whole design block and blank every colour the author did not resend.
        const { design, characters, places, sections, ...fields } = request.payload
        Object.assign(book, fields)
        if (design) Object.assign(book.design, design)

        await book.save()

        // Only reconcile an array the client actually sent. An absent key means
        // "leave the cast list alone", so patching a title cannot delete it.
        for (const [field, items] of Object.entries({ characters, places, sections })) {
          if (items === undefined) continue
          const { model, ownFields } = STORY_TARGETS[field]
          await syncStoryEntities({ model, bookId: book._id, items, ownFields })
        }

        return { book }
      },
    })

    server.route({
      method: 'PUT',
      path: '/{id}/cover',
      options: {
        description: 'Upload or replace the cover image. Author only. Raw bytes, max 1 MB.',
        // Raw body, not JSON. base64 would inflate every cover by a third and
        // force a 1.4 MB allowance to honour a 1 MB cap; sending the file as the
        // request body means MAX_COVER_BYTES is literally the wire limit.
        payload: rawImagePayload(MAX_COVER_BYTES),
        validate: { params: idParam, failAction: detailedFailAction },
      },
      handler: async (request, h) => {
        const user = request.auth.artifacts.user
        const book = await Book.findById(request.params.id)
        if (!book) throw Boom.notFound('No such book')
        assertOwner(book, user)

        // `maxBytes` guards the declared length, but a chunked request can lie
        // about (or omit) content-length, so the buffered length is re-checked
        // before anything is written.
        book.cover = readImageUpload(request.payload, request.headers['content-type'], {
          maxBytes: MAX_COVER_BYTES,
          label: 'Cover',
        })
        await book.save()

        // The 201 body carries metadata only — `toJSON` already stripped the
        // bytes, so this is a few dozen bytes.
        return h.response({ book }).code(201)
      },
    })

    server.route({
      method: 'GET',
      path: '/{id}/cover',
      options: {
        description: 'The cover image bytes',
        validate: { params: idParam, failAction: detailedFailAction },
        // Bytes, not JSON, so the browser can paint it directly.
        response: { schema: null },
      },
      handler: async (request, h) => {
        const book = await Book.findById(request.params.id).select('cover')
        if (!book) throw Boom.notFound('No such book')
        if (!book.cover?.data) throw Boom.notFound('This book has no uploaded cover')

        return h
          .response(book.cover.data)
          .type(book.cover.contentType)
          .header('content-length', String(book.cover.data.length))
          // The bytes are immutable per upload id, so they can be cached hard.
          .header(
            'cache-control',
            'private, max-age=31536000, immutable',
          )
      },
    })

    server.route({
      method: 'DELETE',
      path: '/{id}/cover',
      options: {
        description: 'Remove the cover image, reverting to the generated design.',
        validate: { params: idParam, failAction: detailedFailAction },
      },
      handler: async (request) => {
        const user = request.auth.artifacts.user
        const book = await Book.findById(request.params.id)
        if (!book) throw Boom.notFound('No such book')
        assertOwner(book, user)

        if (book.cover) book.cover = undefined
        await book.save()

        return { deleted: true }
      },
    })

    server.route({
      method: 'DELETE',
      path: '/{id}',
      options: {
        description: 'Delete a book. Author only.',
        validate: { params: idParam, failAction: detailedFailAction },
      },
      handler: async (request) => {
        const user = request.auth.artifacts.user
        const book = await Book.findById(request.params.id)
        if (!book) throw Boom.notFound('No such book')

        // Admins may delete as well as authors, but not readers. Checked here
        // rather than through assertOwner, which is author-only.
        if (!sameAuthorId(book.author, user._id) && user.role !== 'admin') {
          throw Boom.forbidden('Only the author can delete this book')
        }

        // Pages are not deleted here. They arrive with the pages model, and
        // removing a book must not leave orphaned rows behind.
        await book.deleteOne()
        return { deleted: true }
      },
    })
  },
}
