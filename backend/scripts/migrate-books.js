/**
 * One-off data migration for the `books` collection: drop the `shape` field.
 *
 * Books stored a `shape` (`book`/`page`/`pen`/`note`/`quote`/`landmark`/`brain`)
 * chosen from an icon set, and the cover rendered that icon's glyph. It is
 * replaced by `design.layout`, which only positions type and never implies what
 * kind of book something is.
 *
 * Nothing is lost that mattered: a shape was one of seven values an author
 * picked from a list, and the replacement is derivable — every old shape maps to
 * the same `bottom-left` default the model now uses, so an existing cover keeps
 * its title block where the author last saw it.
 *
 * `design.glyphPlacement` goes with it, since it positioned a glyph that no
 * longer exists. `design.layout` and `design.titleScale` are backfilled so a
 * cover rendered from a migrated document matches one rendered from a new book.
 *
 * Idempotent: running it twice is a no-op. Safe on a populated database.
 */
import { connect, disconnect } from '../src/db/index.js'
import { Book } from '../src/models/Book.js'

const DEFAULT_LAYOUT = 'bottom-left'
const DEFAULT_TITLE_SCALE = 'large'

await connect()

const books = await Book.find({})
console.log(`\nbook migration · ${books.length} book(s)\n`)

let shapeStripped = 0
let placementStripped = 0
let designBackfilled = 0

for (const book of books) {
  // Read the raw document. After the schema narrowed, `book.shape` reads as
  // undefined even on a row that still stores it, so counting from the hydrated
  // model would report zero work done.
  const stored = await Book.collection.findOne({ _id: book._id })
  if (!stored) continue

  const unset = {}
  if (stored.shape !== undefined) {
    unset.shape = ''
    shapeStripped += 1
  }
  if (stored.design?.glyphPlacement !== undefined) {
    unset['design.glyphPlacement'] = ''
    placementStripped += 1
  }

  // `$set` alongside `$unset` on design.* paths is safe: mongo updates
  // individual subdocument fields rather than replacing `design` wholesale.
  await Book.collection.updateOne(
    { _id: book._id },
    {
      ...(Object.keys(unset).length ? { $unset: unset } : {}),
      $set: {
        'design.layout': DEFAULT_LAYOUT,
        'design.titleScale': DEFAULT_TITLE_SCALE,
      },
    },
  )
  designBackfilled += 1
}

const withShape = await Book.collection.find({ shape: { $exists: true } }).toArray()
const withPlacement = await Book.collection
  .find({ 'design.glyphPlacement': { $exists: true } })
  .toArray()
const withoutLayout = await Book.collection
  .find({ 'design.layout': { $exists: false } })
  .toArray()

console.log(`  removed shape from              ${shapeStripped} book(s)`)
console.log(`  removed design.glyphPlacement   ${placementStripped} book(s)`)
console.log(`  set design.layout on            ${designBackfilled} book(s)`)
console.log(`  books still holding shape:      ${withShape.length}`)
console.log(`  books still holding placement:  ${withPlacement.length}`)
console.log(`  books with no design.layout:    ${withoutLayout.length}\n`)

if (withShape.length || withPlacement.length || withoutLayout.length) {
  console.error('migration did not fully apply')
  await disconnect()
  process.exit(1)
}

console.log('migration ok\n')
await disconnect()
process.exit(0)
