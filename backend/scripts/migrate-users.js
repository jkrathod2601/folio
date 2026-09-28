/**
 * One-off data migration for the `users` collection.
 *
 * The `users` table was narrowed to auth + basic profile, and the denormalized
 * counters (followers, following, words, streak) were dropped:
 *
 *   - those numbers were never correct — they were seeded defaults that nothing
 *     incremented, so they were decorative rather than real data
 *   - counting followers and followers-of is a query against `follows` (and a
 *     counter to increment on write), not a column the client can drift
 *   - `words` belongs to a book's author, aggregated at read time
 *
 * Nothing here is destructive to a value we cannot recompute: bio, location,
 * joined, portrait, verified and username are all preserved, and `role` is
 * backfilled to `reader` for every existing account.
 *
 * Idempotent: running it twice is a no-op. Safe to run on a populated database.
 */
import { connect, disconnect } from '../src/db/index.js'
import { User, ROLES, DEFAULT_ROLE } from '../src/models/User.js'

const DROPPED = ['followers', 'following', 'words', 'streak']

await connect()

const users = await User.find({})
console.log(`\nuser migration · ${users.length} account(s)\n`)

let stripped = 0
let roleAdded = 0

for (const user of users) {
  // `strict` schemas silently ignore writes to unknown paths, so `save()` alone
  // would leave the old fields in place without reporting anything. The raw
  // collection is the only way to actually remove them.
  const unset = Object.fromEntries(DROPPED.map((f) => [f, '']))

  // Read the raw document rather than the hydrated one: after the schema
  // narrowed, `user.followers` reads as undefined even on a row that still has
  // it, so counting from the model would report zero work done.
  const stored = await User.collection.findOne({ _id: user._id })
  if (stored?.role == null) roleAdded += 1
  if (DROPPED.some((f) => stored?.[f] !== undefined)) stripped += 1

  await User.collection.updateOne(
    { _id: user._id },
    {
      $unset: unset,
      $set: { role: ROLES.includes(stored?.role) ? stored.role : DEFAULT_ROLE },
    },
  )
}

const remaining = await User.collection
  .find({ $or: DROPPED.map((f) => ({ [f]: { $exists: true } })) })
  .toArray()

const withoutRole = await User.collection.find({ role: { $exists: false } }).toArray()

console.log(`  dropped counters from ${stripped} account(s)`)
console.log(`  backfilled role on  ${roleAdded} account(s) as ${DEFAULT_ROLE}`)
console.log(`  accounts still holding a dropped field: ${remaining.length}`)
console.log(`  accounts with no role:                 ${withoutRole.length}\n`)

if (remaining.length || withoutRole.length) {
  console.error('migration did not fully apply')
  await disconnect()
  process.exit(1)
}

console.log('migration ok\n')
await disconnect()
process.exit(0)
