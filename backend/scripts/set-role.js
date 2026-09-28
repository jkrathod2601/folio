/**
 * Grants or revokes a role for an account.
 *
 *   npm run set-role -- <email> admin
 *   npm run set-role -- <email> reader
 *   npm run set-role -- <email> admin --create   # make the account if new
 *
 * `admin` is the only elevated role. The email must already exist unless
 * --create is passed, because inventing an account here would create a user
 * that can never sign in (there is no googleSub for it).
 */
import { connect, disconnect } from '../src/db/index.js'
import { User, ROLES, DEFAULT_ROLE } from '../src/models/User.js'

const args = process.argv.slice(2)
const shouldCreate = args.includes('--create')
const [emailArg, roleArg] = args.filter((a) => !a.startsWith('--'))

if (!emailArg || !roleArg) {
  console.error('usage: npm run set-role -- <email> <reader|admin> [--create]')
  process.exit(1)
}

const email = emailArg.toLowerCase().trim()
const role = roleArg.toLowerCase().trim()

if (!ROLES.includes(role)) {
  console.error(`unknown role "${roleArg}" — expected one of: ${ROLES.join(', ')}`)
  process.exit(1)
}

await connect()

const user = await User.findOne({ email })

if (!user) {
  if (!shouldCreate) {
    console.error(`no account for ${email}. Pass --create to make one.`)
    await disconnect()
    process.exit(1)
  }

  const created = await User.create({
    email,
    // A placeholder: this account can only sign in once it completes Google
    // OAuth, which is what fills in googleSub for real.
    googleSub: `pending-${email}`,
    name: email.split('@')[0],
    role,
  })
  console.log(`created ${email} as ${role} (complete a Google sign-in to activate)`)
  await disconnect()
  process.exit(0)
}

if (role === DEFAULT_ROLE && user.role === DEFAULT_ROLE) {
  console.log(`${email} is already a ${role}`)
  await disconnect()
  process.exit(0)
}

user.role = role
await user.save()

console.log(`${email} (${user.username ?? 'no username'}) is now ${role}`)
await disconnect()
process.exit(0)
