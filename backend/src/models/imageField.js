import mongoose from 'mongoose'

const { Schema } = mongoose

/**
 * Inline image subdocuments.
 *
 * Book covers and character portraits have byte-for-byte the same requirements:
 * a small cap, a browser-paintable content-type allowlist, a declared `size`,
 * and — the part that is easy to get wrong — bytes that must never appear in a
 * JSON response. So the schema is built once here and both call sites get it,
 * rather than the second one re-deriving it and quietly losing the `toJSON`
 * strip that the first one depends on.
 *
 * **Why inline at all.** A cap this low is what makes a binary field
 * defensible: Mongo's BSON document limit is 16 MB, so a 1 MB image per
 * document is comfortable. It is still the wrong shape for a library of images
 * — move to GridFS or object storage the moment these get numerous or
 * CDN-served. Revisit before that, not after.
 */

/** Only formats a browser can paint into an <img> without a codec shim. */
export const IMAGE_CONTENT_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']

/** Default ceiling. Covers pass their own; portraits use a tighter one. */
export const MAX_IMAGE_BYTES = 1024 * 1024

/**
 * Build an inline image subdocument schema.
 *
 * @param {object}  opts
 * @param {number}  opts.maxBytes  hard ceiling for this field
 * @param {string}  opts.label     noun used in validation messages
 */
export function imageFieldSchema({ maxBytes = MAX_IMAGE_BYTES, label = 'Image' } = {}) {
  const schema = new Schema(
    {
      data: { type: Buffer, required: true },
      contentType: { type: String, enum: IMAGE_CONTENT_TYPES, required: true },
      size: { type: Number, required: true, min: 1, max: maxBytes },
      updatedAt: { type: Date, default: Date.now },
    },
    { _id: false },
  )

  // The cap is enforced on the upload route by Hapi's `payload.maxBytes`, but a
  // route is not the only writer. A migration, a script, or a future import path
  // can all set this field directly, and `size` is metadata someone can simply
  // lie about — a 5 MB buffer paired with `size: 100` would pass a check on
  // `size` while quietly blowing past the limit the cap exists to enforce.
  //
  // So the byte count is validated against the buffer itself, and the declared
  // size has to agree with it. Cheap, and it makes the limit a property of the
  // data rather than a promise about who calls the API.
  //
  // Mongoose 9: this hook is async and takes no `next` argument. Passing one
  // throws `next is not a function`.
  schema.pre('validate', async function validateImageBytes() {
    if (!Buffer.isBuffer(this.data)) return

    if (this.data.length > maxBytes) {
      throw new Error(
        `${label} is ${this.data.length} bytes, over the ${maxBytes} byte limit`,
      )
    }

    if (this.size !== this.data.length) {
      throw new Error(`${label} size must equal the stored byte count (${this.data.length})`)
    }
  })

  return schema
}

/**
 * Replace an image subdocument with its metadata-only form, in place, for
 * `toJSON`.
 *
 * Without this every book in a list response carries its image's bytes inline,
 * and a shelf of forty books moves tens of megabytes to render forty
 * thumbnails. Clients treat the *presence* of the returned object as "there is
 * an image" and read the bytes from the dedicated endpoint.
 */
export function stripImageField(target, field) {
  if (!target?.[field]) return target
  target[field] = {
    contentType: target[field].contentType,
    size: target[field].size,
    updatedAt: target[field].updatedAt,
  }
  return target
}
