import mongoose from 'mongoose'
import { storyEntitySchema } from './storyEntity.js'
import { imageFieldSchema } from './imageField.js'

/**
 * A character in a book — the "character card".
 *
 * Exists to be referred back to while writing, which is why it is a first-class
 * record rather than a note: chapter nine needs the protagonist's age, the
 * spelling of an alias, and who they are related to, and none of that should
 * have to be re-derived from the prose.
 *
 * `role` is deliberately a short fixed list. Unlike `tags`, this is the one
 * field a UI genuinely wants to group and filter by, and a closed list is what
 * makes that possible. Everything else here is free text.
 */
export const CHARACTER_ROLES = [
  'protagonist',
  'antagonist',
  'narrator',
  'supporting',
  'minor',
]

/**
 * Portraits get a tighter cap than covers: they render in a small circle on a
 * character card, so 512 KB is already far more resolution than the slot uses.
 * The saving is per character, and a long series has a lot of characters.
 */
export const MAX_PORTRAIT_BYTES = 512 * 1024

const characterSchema = storyEntitySchema({
  label: 'character',
  imageField: 'portrait',
  fields: {
    name: { type: String, required: true, trim: true, maxlength: 120 },

    // Other names the same person goes by in the text. Bounded, because a cast
    // list with unbounded aliases is a cast list nobody scans.
    aliases: {
      type: [String],
      default: [],
      validate: {
        validator: (list) => list.length <= 8,
        message: 'A character can carry at most 8 aliases',
      },
    },

    role: { type: String, enum: CHARACTER_ROLES, default: 'supporting' },

    description: { type: String, trim: true, maxlength: 2000, default: '' },

    // Free text on purpose. "late thirties", "ageless", "a cat" are all real
    // answers, and a numeric age field would reject two of them.
    age: { type: String, trim: true, maxlength: 60, default: '' },

    // Where they turn up first. Free text rather than a page foreign key
    // because pages are not modelled yet, and a dangling ObjectId would be worse
    // than a sentence the author wrote.
    firstAppearance: { type: String, trim: true, maxlength: 120, default: '' },

    // Absent means "no portrait", which is the normal case and renders a
    // monogram. Same contract as a book cover.
    portrait: {
      type: imageFieldSchema({ maxBytes: MAX_PORTRAIT_BYTES, label: 'Character portrait' }),
      default: undefined,
    },
  },
})

export const BookCharacter =
  mongoose.models.BookCharacter || mongoose.model('BookCharacter', characterSchema)
