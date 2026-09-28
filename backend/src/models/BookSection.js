import mongoose from 'mongoose'
import { storyEntitySchema } from './storyEntity.js'

/**
 * A structural division of a book: prologue, part, chapter, epilogue.
 *
 * Pages are a flat ordered list, and a flat list of two hundred pages is hard to
 * write against — "put this in chapter four" has no meaning when the only
 * ordering is an integer. A section gives the draft a spine without changing how
 * pages are stored: sections carry an order and a title, and page-to-section
 * assignment lands with the pages model rather than being faked here.
 */
export const SECTION_KINDS = [
  'prologue',
  'part',
  'chapter',
  'section',
  'epilogue',
  'afterword',
]

const sectionSchema = storyEntitySchema({
  label: 'section',
  fields: {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    kind: { type: String, enum: SECTION_KINDS, default: 'chapter' },
    summary: { type: String, trim: true, maxlength: 2000, default: '' },
  },
})

export const BookSection =
  mongoose.models.BookSection || mongoose.model('BookSection', sectionSchema)
