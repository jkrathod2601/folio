import Joi from 'joi'
import Boom from '@hapi/boom'
import { Book, sameAuthorId } from '../models/Book.js'
import { BookCharacter, CHARACTER_ROLES, MAX_PORTRAIT_BYTES } from '../models/BookCharacter.js'
import { BookPlace, PLACE_KINDS } from '../models/BookPlace.js'
import { BookSection, SECTION_KINDS } from '../models/BookSection.js'
import { ENTITY_TAGS_MAX, MAX_ENTITY_KEY_LENGTH } from '../models/storyEntity.js'
import { readImageUpload, rawImagePayload } from './imageUpload.js'
import { detailedFailAction } from './detailedFailAction.js'

/**
 * Story-bible routes: characters, places, sections.
 *
 * One factory, three registrations, because these three collections differ only
 * in their own fields. Everything that is easy to get subtly wrong — loading the
 * book first, checking the caller owns it, never taking `book` from the body,
 * matching a full-array sync by client key, stripping image bytes on the way out
 * — is written once here instead of three times.
 *
 * Everything below is **author-only, reads included**. These are working notes
 * on a draft: a cast list sitting behind a public book would leak the shape of a
 * story before anyone has read it. That can be relaxed deliberately later, and
 * it will be an obvious change, rather than being an accident of which routes
 * happened to remember a visibility check.
 */

/** A book id plus the sub-resource id, for the per-entity routes. */
const entityParams = Joi.object({
  id: Joi.string().hex().length(24).required(),
  entityId: Joi.string().hex().length(24).required(),
})

const bookParams = Joi.object({ id: Joi.string().hex().length(24).required() })

const tags = Joi.array().items(Joi.string().trim().min(1).max(60)).max(ENTITY_TAGS_MAX)
const clientKey = Joi.string().trim().min(1).max(MAX_ENTITY_KEY_LENGTH)

/** Payload fields shared by POST, PATCH and the sync item. */
const shared = { key: clientKey, tags, order: Joi.number().integer().min(0) }

/**
 * `strict()` is deliberately off but unknown keys are still rejected by Joi's
 * default. That is what stops a client setting `book` on an entry and moving a
 * character's cast list to another author's book.
 */
const itemSchema = (fields) => Joi.object({ ...shared, ...fields })

export const CHARACTER_FIELDS = {
  name: Joi.string().trim().min(1).max(120),
  aliases: Joi.array().items(Joi.string().trim().min(1).max(60)).max(8),
  role: Joi.string().valid(...CHARACTER_ROLES),
  description: Joi.string().trim().max(2000).allow(''),
  age: Joi.string().trim().max(60).allow(''),
  firstAppearance: Joi.string().trim().max(120).allow(''),
}

export const PLACE_FIELDS = {
  name: Joi.string().trim().min(1).max(120),
  kind: Joi.string().valid(...PLACE_KINDS),
  description: Joi.string().trim().max(2000).allow(''),
}

export const SECTION_FIELDS = {
  title: Joi.string().trim().min(1).max(200),
  kind: Joi.string().valid(...SECTION_KINDS),
  summary: Joi.string().trim().max(2000).allow(''),
}

/**
 * Entry schemas, built once and shared.
 *
 * `POST /api/books` accepts these arrays inline so the create form can save a
 * title, a cast list and a chapter outline in one submit, and it validates them
 * with these exact schemas — otherwise the create path and the per-collection
 * path would disagree about what a valid character is.
 */
export const characterItem = itemSchema(CHARACTER_FIELDS).fork(['name'], (s) => s.required())
export const placeItem = itemSchema(PLACE_FIELDS).fork(['name'], (s) => s.required())
export const sectionItem = itemSchema(SECTION_FIELDS).fork(['title'], (s) => s.required())

/** Field names this collection owns, for the generic assignment below. */
const OWN = {
  character: ['name', 'aliases', 'role', 'description', 'age', 'firstAppearance'],
  place: ['name', 'kind', 'description'],
  section: ['title', 'kind', 'summary'],
}

/** Copy the collection's own fields plus the shared editable ones. */
function applyFields(entity, item, ownFields) {
  for (const field of ownFields) {
    if (item[field] !== undefined) entity[field] = item[field]
  }
  for (const field of ['key', 'tags', 'order']) {
    if (item[field] !== undefined) entity[field] = item[field]
  }
}

/**
 * Load a book and require that the caller wrote it.
 *
 * Returns the book, not the entity, so a caller cannot use a valid entity id
 * from someone else's book to pass an ownership check.
 *
 * Exported because every sub-resource of a book (story bible, pages) needs the
 * same check, and a second copy is a second chance to get it wrong.
 */
export async function requireOwnedBook(id, user) {
  // The page counters ride along because the pages routes update them on every
  // write; without them `pageCount + 1` is NaN and the create dies with a cast
  // error rather than a message the author could act on.
  const book = await Book.findById(id).select('_id author title visibility pageCount currentPage')
  if (!book) throw Boom.notFound('No such book')
  if (!sameAuthorId(book.author, user._id)) {
    throw Boom.forbidden('Only the author can change this book')
  }
  return book
}

/**
 * Reconcile a full array from the book form.
 *
 * Matching is by the client `key`, not by array position or by `_id`, because
 * the form reorders and edits freely between saves. Anything the payload omits
 * is removed — but **only if it has a `key`**. A record created outside the form
 * has no key, and a form save must not silently delete it along with the
 * portrait someone uploaded to it; those are removed by id instead.
 *
 * `order` is rewritten from the array position, so the author's arrangement is
 * the truth rather than a field they have to keep in sync by hand.
 *
 * Exported because `POST /api/books` and `PATCH /api/books/:id` accept these
 * arrays inline, and duplicating the reconcile here and there is how the two
 * start disagreeing about what a missing entry means.
 *
 * @returns {Promise<Array>} the reconciled entries, in payload order
 */
export async function syncStoryEntities({ model, bookId, items, ownFields, session }) {
  const incoming = items ?? []
  const existing = await model.find({ book: bookId }, null, { session })
  const byKey = new Map()
  for (const entry of existing) {
    if (entry.key) byKey.set(entry.key, entry)
  }

  const keptKeys = []
  const result = []

  for (const [index, item] of incoming.entries()) {
    const found = item.key ? byKey.get(item.key) : null

    if (found) {
      applyFields(found, item, ownFields)
      found.order = index
      await (session ? found.save({ session }) : found.save())
      result.push(found)
    } else {
      const created = new model({ ...pick(item, ownFields), book: bookId, order: index })
      for (const field of ['key', 'tags']) {
        if (item[field] !== undefined) created[field] = item[field]
      }
      await (session ? created.save({ session }) : created.save())
      result.push(created)
    }

    // Both branches, or the delete below treats everything just created as
    // absent from the payload and removes it in the same request.
    if (item.key) keptKeys.push(item.key)
  }

  await model.deleteMany(
    { book: bookId, key: { $exists: true, $nin: keptKeys } },
    { session },
  )

  return result
}

/** Copy only the keys that exist on the target, so a payload cannot set `book`. */
function pick(item, ownFields) {
  const out = {}
  for (const field of ownFields) if (item[field] !== undefined) out[field] = item[field]
  return out
}

/**
 * Register the full route set for one story-bible collection.
 *
 * @param {object}  opts
 * @param {string}  opts.path        URL segment, e.g. `characters`
 * @param {object}  opts.model       Mongoose model
 * @param {string}  opts.label       singular noun for messages
 * @param {object}  opts.itemJoi     Joi schema for one entry
 * @param {string[]} opts.ownFields  this collection's field names
 * @param {number} [opts.maxBytes]   portrait cap; omit for collections without one
 */
function registerStoryEntityRoutes(server, opts) {
  const { path, model, label, itemJoi, ownFields, maxBytes } = opts
  const plural = `${label}s`
  const base = `/{id}/${path}`

  server.route({
    method: 'GET',
    path: base,
    options: {
      description: `A book's ${plural}, in author order. Author only.`,
      validate: { params: bookParams, failAction: detailedFailAction },
    },
    handler: async (request) => {
      await requireOwnedBook(request.params.id, request.auth.artifacts.user)
      const entries = await model.find({ book: request.params.id }).sort({ order: 1, createdAt: 1 })
      return { [path]: entries }
    },
  })

  server.route({
    method: 'POST',
    path: base,
    options: {
      description: `Add one ${label} to a book. Author only.`,
      validate: { params: bookParams, payload: itemJoi, failAction: detailedFailAction },
    },
    handler: async (request, h) => {
      const book = await requireOwnedBook(request.params.id, request.auth.artifacts.user)
      const entry = await model.create({ ...pick(request.payload, ownFields), book: book._id })
      for (const field of ['key', 'tags', 'order']) {
        if (request.payload[field] !== undefined) {
          entry[field] = request.payload[field]
        }
      }
      await entry.save()
      return h.response({ [label]: entry }).code(201)
    },
  })

  server.route({
    method: 'PUT',
    path: base,
    options: {
      description:
        `Replace a book's ${plural} with this array, matched by client key. Author only.`,
      validate: {
        params: bookParams,
        payload: Joi.object({ items: Joi.array().items(itemJoi).max(200) }),
        failAction: detailedFailAction,
      },
    },
    handler: async (request) => {
      const book = await requireOwnedBook(request.params.id, request.auth.artifacts.user)
      const entries = await syncStoryEntities({
        model,
        bookId: book._id,
        items: request.payload.items,
        ownFields,
      })
      return { [path]: entries }
    },
  })

  server.route({
    method: 'PATCH',
    path: `${base}/{entityId}`,
    options: {
      description: `Edit one ${label}. Author only.`,
      validate: { params: entityParams, payload: itemJoi, failAction: detailedFailAction },
    },
    handler: async (request) => {
      const book = await requireOwnedBook(request.params.id, request.auth.artifacts.user)
      const entry = await model.findOne({ _id: request.params.entityId, book: book._id })
      if (!entry) throw Boom.notFound(`No such ${label}`)

      applyFields(entry, request.payload, ownFields)
      await entry.save()
      return { [label]: entry }
    },
  })

  server.route({
    method: 'DELETE',
    path: `${base}/{entityId}`,
    options: {
      description: `Remove one ${label}. Author only.`,
      validate: { params: entityParams, failAction: detailedFailAction },
    },
    handler: async (request) => {
      const book = await requireOwnedBook(request.params.id, request.auth.artifacts.user)
      const result = await model.deleteOne({ _id: request.params.entityId, book: book._id })
      if (!result.deletedCount) throw Boom.notFound(`No such ${label}`)
      return { deleted: true }
    },
  })

  if (!maxBytes) return

  const portraitLabel = `${label} portrait`

  server.route({
    method: 'PUT',
    path: `${base}/{entityId}/portrait`,
    options: {
      description: `Upload or replace a ${portraitLabel}. Author only. Raw bytes.`,
        payload: rawImagePayload(maxBytes),
        validate: { params: entityParams, failAction: detailedFailAction },
    },
    handler: async (request) => {
      const book = await requireOwnedBook(request.params.id, request.auth.artifacts.user)
      const entry = await model.findOne({ _id: request.params.entityId, book: book._id })
      if (!entry) throw Boom.notFound(`No such ${label}`)

      entry.portrait = readImageUpload(request.payload, request.headers['content-type'], {
        maxBytes,
        label: portraitLabel[0].toUpperCase() + portraitLabel.slice(1),
      })
      await entry.save()

      return { [label]: entry }
    },
  })

  server.route({
    method: 'GET',
    path: `${base}/{entityId}/portrait`,
    options: {
        description: `The ${portraitLabel} bytes`,
        validate: { params: entityParams, failAction: detailedFailAction },
      response: { schema: null },
    },
    handler: async (request, h) => {
      const book = await requireOwnedBook(request.params.id, request.auth.artifacts.user)
      const entry = await model.findOne({ _id: request.params.entityId, book: book._id })
      if (!entry) throw Boom.notFound(`No such ${label}`)
      if (!entry.portrait?.data) throw Boom.notFound(`This ${label} has no portrait`)

      return h
        .response(entry.portrait.data)
        .type(entry.portrait.contentType)
        .header('content-length', String(entry.portrait.data.length))
        .header('cache-control', 'private, max-age=31536000, immutable')
    },
  })

  server.route({
    method: 'DELETE',
    path: `${base}/{entityId}/portrait`,
    options: {
        description: `Remove a ${portraitLabel}. Author only.`,
        validate: { params: entityParams, failAction: detailedFailAction },
    },
    handler: async (request) => {
      const book = await requireOwnedBook(request.params.id, request.auth.artifacts.user)
      const entry = await model.findOne({ _id: request.params.entityId, book: book._id })
      if (!entry) throw Boom.notFound(`No such ${label}`)

      if (entry.portrait) entry.portrait = undefined
      await entry.save()
      return { deleted: true }
    },
  })
}

export const storyEntityRoutes = {
  name: 'book-entity-routes',
  version: '1.0.0',
  register(server) {
    // Mounted under the same `/api/books` prefix as the book routes, so these
    // paths read `/api/books/:id/characters`.
    registerStoryEntityRoutes(server, {
      path: 'characters',
      model: BookCharacter,
      label: 'character',
      itemJoi: characterItem,
      ownFields: OWN.character,
      maxBytes: MAX_PORTRAIT_BYTES,
    })

    registerStoryEntityRoutes(server, {
      path: 'places',
      model: BookPlace,
      label: 'place',
      itemJoi: placeItem,
      ownFields: OWN.place,
    })

    registerStoryEntityRoutes(server, {
      path: 'sections',
      model: BookSection,
      label: 'section',
      itemJoi: sectionItem,
      ownFields: OWN.section,
    })
  },
}
