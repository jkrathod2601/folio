import mongoose from 'mongoose'
import { storyEntitySchema } from './storyEntity.js'

/**
 * A place in a book — city, building, region, anything the prose is set in.
 *
 * The same shape as a character because it earns the same place in a working
 * draft: consistency of a name across forty pages is exactly the thing that
 * drifts, and a single record stops it drifting.
 */
export const PLACE_KINDS = [
  'city',
  'town',
  'village',
  'country',
  'region',
  'building',
  'landmark',
  'other',
]

const placeSchema = storyEntitySchema({
  label: 'place',
  fields: {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    kind: { type: String, enum: PLACE_KINDS, default: 'other' },
    description: { type: String, trim: true, maxlength: 2000, default: '' },
  },
})

export const BookPlace = mongoose.models.BookPlace || mongoose.model('BookPlace', placeSchema)
