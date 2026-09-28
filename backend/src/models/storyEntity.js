import mongoose from 'mongoose'
import { stripImageField } from './imageField.js'

const { Schema } = mongoose

/**
 * Shared scaffolding for a book's story bible — characters, places, sections.
 *
 * These are three collections with different fields and one shape, and the one
 * shape matters more than the differences: every one of them hangs off a book,
 * is ordered by the author, carries free-text tags, and is synced from the book
 * form by a client-generated `key`. Building that once here is what stops the
 * third collection from quietly getting a different ownership rule or a
 * different `toJSON` that forgets to strip its image bytes.
 *
 * They are separate collections rather than arrays on the book document because
 * they grow without bound. A cast list is a handful of entries today and a
 * hundred in a long series, and the book document is already carrying a 1 MB
 * cover — the 16 MB BSON limit is not somewhere to spend a design decision.
 */

/** Client sync key. Optional: entities created outside the form leave it absent. */
export const MAX_ENTITY_KEY_LENGTH = 40

export const ENTITY_TAGS_MAX = 12

/**
 * @param {object}  opts
 * @param {string}  opts.label        singular noun, for error messages
 * @param {object}  opts.fields       this collection's own paths
 * @param {string} [opts.imageField]  name of an inline image subdocument to strip
 * @param {number} [opts.tagsMax]
 */
export function storyEntitySchema({ label, fields, imageField = null, tagsMax = ENTITY_TAGS_MAX }) {
  const schema = new Schema(
    {
      book: { type: Schema.Types.ObjectId, ref: 'Book', required: true, index: true },

      /**
       * Stable client-side identity, used to reconcile a full-array PUT from the
       * book form: the server matches on `key` to update in place and treats
       * anything absent from the payload as deleted. No default on purpose — an
       * empty-string default would collide in the unique index below for every
       * entity created outside the form.
       */
      key: { type: String, trim: true, maxlength: MAX_ENTITY_KEY_LENGTH },

      // Author-controlled. Not derived from `createdAt`: reordering a cast list
      // to put the protagonist first is an edit, not a re-creation.
      order: { type: Number, default: 0, min: 0 },

      tags: {
        type: [String],
        default: [],
        validate: {
          validator: (list) => list.length <= tagsMax,
          message: `A ${label} can carry at most ${tagsMax} tags`,
        },
      },

      ...fields,
    },
    { timestamps: true },
  )

  // The listing order every collection is read in.
  schema.index({ book: 1, order: 1 })

  // Sparse, because an absent `key` is the normal case for entities the book
  // form did not create. A non-sparse unique index would reject the second
  // book in the database, since every missing key sorts as one null.
  schema.index({ book: 1, key: 1 }, { unique: true, sparse: true })

  schema.set('toJSON', {
    virtuals: true,
    transform(_doc, ret) {
      ret.id = ret._id?.toString()
      delete ret._id
      delete ret.__v
      if (imageField) stripImageField(ret, imageField)
      return ret
    },
  })

  return schema
}
