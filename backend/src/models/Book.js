import mongoose from 'mongoose'
import { imageFieldSchema, stripImageField, MAX_IMAGE_BYTES, IMAGE_CONTENT_TYPES } from './imageField.js'

const { Schema } = mongoose

/**
 * Cover layouts.
 *
 * These replaced the old per-book `shape` (a `book`/`pen`/`note` glyph the
 * author picked from an icon set). A glyph on a cover says *what kind of book
 * this is* before the reader has read the title, and a book called "Letters to
 * my father" should not be stamped as a notebook. These say only where the type
 * sits, which is a decision about the cover rather than about the writing.
 *
 * Deliberately a short, plain list. Every entry here is rendered by
 * `BookCover.jsx`, so a value with no renderer silently falls back.
 */
export const LAYOUTS = [
  'centered',
  'bottom-left',
  'bottom-center',
  'top-left',
  'top-center',
  'mark-only',
]

/** Publication state. `draft` is the default: a new book is nobody's until said otherwise. */
export const BOOK_STATUS = ['draft', 'published', 'archived']

/**
 * Who may open a book.
 *
 * This is about discovery, not security — the API checks ownership separately.
 * `unlisted` means "reachable by link", `private` means "only the author".
 */
export const VISIBILITIES = ['public', 'unlisted', 'private']

/** Reader-facing age guidance. `''` is "not assessed", not "everyone". */
export const AGE_RATINGS = ['', 'everyone', 'teen', 'mature', 'adult']

/** What the author is entitled to publish as a cover. */
export const COVER_RIGHTS = ['', 'owned', 'licensed', 'public-domain', 'permission', 'unknown']

/**
 * A bounded free-text list.
 *
 * Bounded because these are search facets, not a notes field: a themes list of
 * forty entries is a list nobody reads, and an unbounded array on the book
 * document is one more way for a single document to approach the 16 MB BSON
 * limit.
 */
const tagList = (max, noun) => ({
  type: [String],
  default: [],
  validate: {
    validator: (list) => list.length <= max,
    message: `A book can carry at most ${max} ${noun}`,
  },
})


/**
 * Cover design.
 *
 * Colors are stored as authored hex, not as Tailwind class names. A class name
 * would couple a stored document to the theme bundle: renaming a zinc step, or
 * dark mode inverting it, would silently repaint books the author already
 * designed. Hex is what the author picked, so hex is what gets kept.
 *
 * Defaults are the monochrome ink-on-paper the rest of the app uses, so a book
 * created without touching this section looks like it belongs.
 */
const designSchema = new Schema(
  {
    // Cover background. Defaults to the near-black used for dark bands.
    coverColor: { type: String, default: '#09090b', match: /^#[0-9a-fA-F]{6}$/ },
    // Cover text, including the subtitle and any rule lines.
    textColor: { type: String, default: '#ffffff', match: /^#[0-9a-fA-F]{6}$/ },
    // Rules, the mark, and other small marks. Falls back to textColor in the
    // renderer when unset so a two-color cover still looks deliberate.
    accentColor: { type: String, match: /^#[0-9a-fA-F]{6}$/ },

    // Where the type sits on the cover. Replaces the old `glyphPlacement`; see
    // LAYOUTS above for why the glyph is gone.
    layout: { type: String, enum: LAYOUTS, default: 'bottom-left' },

    // Front-page ornament. `rule` draws a short line above the title, `frame`
    // draws an inset border, `none` leaves the cover plain.
    ornament: { type: String, enum: ['none', 'rule', 'double-rule', 'frame'], default: 'rule' },

    // Title size on the cover. A long title on a large setting overflows, which
    // is why this is bounded rather than a free font-size.
    titleScale: { type: String, enum: ['small', 'medium', 'large'], default: 'large' },

    // Whether the blurb appears on the cover itself, or only in the book detail
    // view. Some titles look better with just a name on them.
    showBlurb: { type: Boolean, default: false },
  },
  { _id: false },
)

/**
 * Cover image limits.
 *
 * 1 MB is a hard ceiling, enforced in three places: `maxBytes` on the upload
 * route (which rejects at the socket before the body is buffered), the
 * `validate` on the subdocument (which protects a document written by a
 * script), and `maxlength` on the route's content-type allowlist.
 */
export const MAX_COVER_BYTES = MAX_IMAGE_BYTES

/** Re-exported so the cover route keeps its existing import site. */
export const COVER_CONTENT_TYPES = IMAGE_CONTENT_TYPES

const coverSchema = imageFieldSchema({ maxBytes: MAX_COVER_BYTES, label: 'Cover image' })

const bookSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    subtitle: { type: String, trim: true, maxlength: 300, default: '' },
    blurb: { type: String, trim: true, maxlength: 2000, default: '' },

    // Free text, not an enum. The frontend offers suggestions from the catalog
    // but the author can always type their own — "Hindi / Urdu Literature" and
    // "Adhunik Kavita" are both legitimate and a closed list would reject one.
    genres: {
      type: [String],
      default: [],
      validate: {
        validator: (list) => list.length <= 8,
        message: 'A book can carry at most 8 genres',
      },
    },

    // Short spine/cover label, e.g. "CHAP. IV" or "VOL. I". Purely cosmetic,
    // and the `mark-only` layout renders nothing else — which is the whole
    // point of that layout.
    mark: { type: String, trim: true, maxlength: 40, default: '' },

    /**
     * Optional descriptive metadata. Every field here is optional and every one
     * defaults to empty, because the overwhelmingly common case is a book the
     * author is still writing and has not decided any of this yet. A required
     * field would be filled with a placeholder nobody means.
     *
     * These exist to be *useful while writing* — a themes/moods list is
     * scaffolding for deciding what a book is about, and a cast list is the
     * thing you refer back to in chapter nine. Discovery is a side effect.
     */
    language: { type: String, trim: true, maxlength: 60, default: '' },

    // The language the work was written in, when that differs from the language
    // of this edition. Empty means "same as `language`".
    originalLanguage: { type: String, trim: true, maxlength: 60, default: '' },

    series: { type: String, trim: true, maxlength: 120, default: '' },

    // `null` rather than 0: "book one of a series" and "not in a series" are
    // different answers, and 0 is not a book number anyone writes.
    seriesIndex: { type: Number, min: 1, default: null },

    themes: tagList(12, 'themes'),
    moods: tagList(12, 'moods'),
    motifs: tagList(12, 'motifs'),

    // Reader-facing warnings. Kept as free text for the same reason `genres`
    // is: a closed list of trigger categories is somebody else's taxonomy and
    // will always be missing the one that matters for this book.
    contentWarnings: tagList(20, 'content warnings'),

    // '' means unrated, which is different from "everyone": a book nobody has
    // assessed should not claim to be safe for all ages.
    ageRating: { type: String, enum: ['', 'everyone', 'teen', 'mature', 'adult'], default: '' },

    // Cover attribution. Separate from the image itself because a book may be
    // published with a photograph the author does not own, and the credit line
    // has to travel with it.
    coverCredit: { type: String, trim: true, maxlength: 200, default: '' },
    coverRights: {
      type: String,
      enum: ['', 'owned', 'licensed', 'public-domain', 'permission', 'unknown'],
      default: '',
    },

    // Publishing metadata. Empty until there is a publisher, which for most
    // books here is never.
    publisher: { type: String, trim: true, maxlength: 120, default: '' },
    publishedAt: { type: Date, default: null },
    isbn: { type: String, trim: true, maxlength: 20, default: '' },
    edition: { type: String, trim: true, maxlength: 40, default: '' },

    author: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    status: { type: String, enum: BOOK_STATUS, default: 'draft', index: true },
    visibility: { type: String, enum: VISIBILITIES, default: 'unlisted' },

    // Absent means "no uploaded cover", which is a meaningful state: the
    // frontend renders the generated design cover instead.
    cover: { type: coverSchema, default: undefined },

    design: { type: designSchema, default: () => ({}) },

    // Page count and read position are counters the client must never be able
    // to set directly — they move as pages are added and read, not as a field
    // a form submits. Kept here as a projection cache of the pages collection.
    pageCount: { type: Number, default: 0, min: 0 },
    currentPage: { type: Number, default: 1, min: 1 },
  },
  { timestamps: true },
)

bookSchema.index({ author: 1, createdAt: -1 })
// Backs the public shelf query: published + public, newest first.
bookSchema.index({ status: 1, visibility: 1, createdAt: -1 })

/**
 * Compare two author/user references, populated or not.
 *
 * Mongoose leaves `author` as an ObjectId until someone calls `.populate()`,
 * after which it is a full User document. `String(populatedDoc)` is the whole
 * object, not its id, so a naive `a.toString() === b.toString()` silently fails
 * on every populated book — which reads as "the author does not own their own
 * book" rather than as a type error. Both shapes are handled here so callers
 * never have to think about which query they got.
 */
export function sameAuthorId(ref, userId) {
  const id = ref?._id ?? ref
  return Boolean(id) && Boolean(userId) && id.toString() === userId.toString()
}

/** True when `user` may open this book. Admins may always. */
bookSchema.methods.isVisibleTo = function isVisibleTo(user) {
  if (this.visibility === 'public') return true
  if (!user) return false
  if (sameAuthorId(this.author, user._id)) return true
  return user.role === 'admin'
}

/** True when `user` is this book's author. Admins are *not* automatically authors. */
bookSchema.methods.isAuthoredBy = function isAuthoredBy(user) {
  return Boolean(user) && sameAuthorId(this.author, user._id)
}

bookSchema.set('toJSON', {
  virtuals: true,
  transform(_doc, ret) {
    ret.id = ret._id?.toString()
    delete ret._id
    delete ret.__v

    // The single most important line in this file. Without it every book in a
    // list response would carry its cover's bytes inline, and a 40-book shelf
    // would move tens of megabytes to render a list of thumbnails.
    stripImageField(ret, 'cover')

    return ret
  },
})

export const Book = mongoose.models.Book || mongoose.model('Book', bookSchema)
