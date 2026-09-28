/**
 * Mints a real session for a real user and writes it as JSON, so the Playwright
 * auth check can boot a signed-in browser without going through Google.
 *
 * The result goes to a file rather than stdout: src/db logs its lifecycle lines
 * to stdout too, which would corrupt the JSON.
 *
 * Usage: node scripts/mint-session.js [email] [outfile]
 */
import { connect, disconnect } from '../src/db/index.js'
import { User } from '../src/models/User.js'
import { Session } from '../src/models/Session.js'
import { issueSession, signAccessToken } from '../src/auth/tokens.js'
import { writeFileSync } from 'node:fs'

const email = process.argv[2] || 'reader@folio.test'
const outFile = process.argv[3] || '/tmp/folio-minted-session.json'

await connect()

// `username` is uniquely indexed, so a hardcoded one only works for the first
// account ever minted — the second run dies with E11000. Derive it from the
// email and add a suffix if it is taken, the same way the real sign-in path does.
async function uniqueUsernameFor(targetEmail) {
  const base =
    targetEmail
      .split('@')[0]
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '')
      .slice(0, 20) || 'reader'

  let attempt = base
  let n = 1
  while (await User.exists({ username: attempt })) attempt = `${base}${++n}`
  return attempt
}

// Keep the username an existing account already owns, so re-minting does not
// churn it.
//
// Everything except the session is written with $setOnInsert, NOT $set. A
// previous version of this script $set name/portraitUrl/verified, which meant
// running it against a real Google account silently overwrote that person's
// name with the placeholder. A dev helper must not be able to damage real
// data — it only ever needs to create the row if it is missing.
const existing = await User.findOne({ email }).select('username').lean()

const user = await User.findOneAndUpdate(
  { email },
  {
    $setOnInsert: {
      googleSub: `sub-mint-${email}`,
      name: 'Ada Reader',
      username: existing?.username ?? (await uniqueUsernameFor(email)),
      portraitUrl: 'https://picsum.photos/seed/ada/128/128',
      verified: true,
    },
  },
  { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
)

await Session.deleteMany({ userId: user._id })

const refreshToken = await issueSession(user, { userAgent: 'mint-script', ip: '127.0.0.1' })

writeFileSync(
  outFile,
  JSON.stringify(
    {
      email: user.email,
      userId: user._id.toString(),
      name: user.name,
      role: user.role,
      refreshToken,
      // Also handed out so a test can drive /auth/callback#access_token=…
      // directly. That is the one leg the refresh-cookie path cannot cover: the
      // callback page is handed a bare token with no profile, and is the only
      // place that has to ask the server who the user is.
      accessToken: signAccessToken(user),
    },
    null,
    2,
  ),
)

await disconnect()
process.exit(0)
