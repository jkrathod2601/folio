import mongoose from 'mongoose'

const { Schema } = mongoose

/**
 * A page — the atomic unit of writing on Folio.
 *
 * A book is an ordered stack of pages. `ordinal` is that order, 1-based and
 * unique per book; it is assigned by the server (never the client) from the
 * book's `pageCount`, and rewritten down when a page is deleted so the stack
 * stays gapless.
 *
 * Pages are author-only until the reading endpoints land: a draft cast list
 * already sits behind the same rule, and a half-written manuscript is the most
 * private thing the platform holds.
 *
 * `mood` is free text rather than a closed list. The mock catalog used emoji,
 * the product spec shows emoji, and a dropdown would push an author to the
 * nearest wrong feeling.
 */
export const PAGE_STATUS = ['draft', 'published']

/** Words per minute, matching the reading-time estimate the editor shows. */
export const WORDS_PER_MINUTE = 200

const pageSchema = new Schema(
  {
    book: { type: Schema.Types.ObjectId, ref: 'Book', required: true, index: true },

    ordinal: { type: Number, required: true, min: 1 },

    title: { type: String, required: true, trim: true, maxlength: 200 },

    body: { type: String, trim: true, maxlength: 50000, default: '' },

    mood: { type: String, trim: true, maxlength: 20, default: '' },

    status: { type: String, enum: PAGE_STATUS, default: 'draft', index: true },
  },
  { timestamps: true },
)

// What makes per-book page ids safe: two pages in one book cannot share an
// ordinal, however the create request arrives.
pageSchema.index({ book: 1, ordinal: 1 }, { unique: true })
pageSchema.index({ book: 1, status: 1, ordinal: 1 })

pageSchema.set('toJSON', {
  virtuals: true,
  transform(_doc, ret) {
    ret.id = ret._id?.toString()
    delete ret._id
    delete ret.__v
    return ret
  },
})

/** Reading time in whole minutes, floored at 1 so a stub page still has one. */
pageSchema.virtual('readMinutes').get(function readMinutes() {
  const words = (this.body ?? '').trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE))
})

export const Page = mongoose.models.Page || mongoose.model('Page', pageSchema)
