/**
 * Exercises the auth paths that matter and that a browser cannot easily prove:
 * refresh-token rotation, replay detection, family revocation, and logout.
 *
 * The Google code exchange itself is a thin fetch and is not covered here — it
 * needs real credentials. Everything downstream of "we have a user" is.
 *
 * Run with the server's Mongo reachable:  npm run test:auth
 */
import assert from 'node:assert/strict'
import { createServer } from '../src/app.js'
import { config } from '../src/config/index.js'
import { connect, disconnect } from '../src/db/index.js'
import { User } from '../src/models/User.js'
import { Session } from '../src/models/Session.js'
import { issueSession, signAccessToken, hashToken } from '../src/auth/tokens.js'

let passed = 0
const failures = []

async function check(name, fn) {
  try {
    await fn()
    passed += 1
    console.log(`  ok   ${name}`)
  } catch (err) {
    failures.push({ name, err })
    console.log(`  FAIL ${name}\n       ${err.message}`)
  }
}

const REFRESH_COOKIE = config.auth.refreshCookie
/** hapi 21's inject() returns .result (already parsed); there is no .json(). */
const body = (res) => (typeof res.result === 'string' ? JSON.parse(res.result) : res.result)

const jar = (token) => `${REFRESH_COOKIE}=${encodeURIComponent(token)}`

async function main() {
  await connect()
  // Port 0 so the suite never collides with a dev server on 4000.
  const server = await createServer({ port: 0 })
  await server.start()
  const inject = server.inject.bind(server)

  const marker = `test-${Date.now()}`
  const user = await User.create({
    googleSub: `sub-${marker}`,
    email: `${marker}@example.test`,
    name: 'Test Writer',
    username: marker,
  })

  console.log(`\nauth tests · db "${config.db.name}" · ${server.info.uri}\n`)

  await check('refresh issues an access token and rotates the cookie', async () => {
    const first = await issueSession(user, { userAgent: 'test' })

    const res = await inject({
      method: 'POST',
      url: '/api/auth/refresh',
      headers: { cookie: jar(first) },
    })

    assert.equal(res.statusCode, 200)
    const refreshed = body(res)
    assert.equal(refreshed.user.email, user.email)
    assert.ok(refreshed.accessToken, 'expected an access token')

    const setCookie = res.headers['set-cookie']
    const cookieHeader = Array.isArray(setCookie) ? setCookie.join(';') : String(setCookie)
    assert.match(cookieHeader, new RegExp(`${REFRESH_COOKIE}=[^;]+`), 'no rotated cookie set')
    assert.match(cookieHeader, /HttpOnly/i, 'refresh cookie must be HttpOnly')
    assert.doesNotMatch(cookieHeader, /Secure/i, 'Secure should be off over plain http in dev')

    const next = cookieHeader.match(new RegExp(`${REFRESH_COOKIE}=([^;]+)`))[1]
    assert.notEqual(next, first, 'refresh token must rotate, not repeat')
  })

  await check('the access token is accepted by /me', async () => {
    const token = signAccessToken(user)
    const res = await inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { authorization: `Bearer ${token}` },
    })
    assert.equal(res.statusCode, 200)
    assert.equal(body(res).user.email, user.email)
  })

  await check('a refresh token cannot be used as an access token', async () => {
    const refresh = await issueSession(user)
    const res = await inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { authorization: `Bearer ${refresh}` },
    })
    assert.equal(res.statusCode, 401)
  })

  await check('an access token cannot be used to refresh', async () => {
    const res = await inject({
      method: 'POST',
      url: '/api/auth/refresh',
      headers: { cookie: jar(signAccessToken(user)) },
    })
    assert.equal(res.statusCode, 401)
  })

  await check('replaying a rotated refresh token kills the whole family', async () => {
    const first = await issueSession(user)

    const rotated = await inject({
      method: 'POST',
      url: '/api/auth/refresh',
      headers: { cookie: jar(first) },
    })
    assert.equal(rotated.statusCode, 200)

    const setCookie = rotated.headers['set-cookie']
    const header = Array.isArray(setCookie) ? setCookie.join(';') : String(setCookie)
    const second = header.match(new RegExp(`${REFRESH_COOKIE}=([^;]+)`))[1]

    // Replay the token that was already spent: this is what a stolen cookie
    // looks like, and it must not quietly mint another session.
    const replay = await inject({
      method: 'POST',
      url: '/api/auth/refresh',
      headers: { cookie: jar(first) },
    })
    assert.equal(replay.statusCode, 401)
    assert.match(body(replay).error.message, /already used/i)

    // ...and the legitimate holder is logged out too, which is the point.
    const victim = await inject({
      method: 'POST',
      url: '/api/auth/refresh',
      headers: { cookie: jar(second) },
    })
    assert.equal(victim.statusCode, 401, 'the rotated token must be revoked as collateral')

    const session = await Session.findOne({ tokenHash: hashToken(second) })
    assert.equal(session.revokedReason, 'reuse_detected')
  })

  await check('logout revokes the session server-side, not just in the browser', async () => {
    const refresh = await issueSession(user)

    const res = await inject({
      method: 'POST',
      url: '/api/auth/logout',
      headers: { cookie: jar(refresh) },
    })
    assert.equal(res.statusCode, 200)

    const header = String(res.headers['set-cookie'])
    assert.match(header, new RegExp(`${REFRESH_COOKIE}=;`), 'cookie should be cleared')

    const reuse = await inject({
      method: 'POST',
      url: '/api/auth/refresh',
      headers: { cookie: jar(refresh) },
    })
    assert.equal(reuse.statusCode, 401, 'a logged-out token must not work')
  })

  await check('logout-all revokes every session for the user', async () => {
    const a = await issueSession(user)
    const b = await issueSession(user)

    const res = await inject({
      method: 'POST',
      url: '/api/auth/logout-all',
      headers: { authorization: `Bearer ${signAccessToken(user)}` },
    })
    assert.equal(res.statusCode, 200)
    // Earlier cases deliberately left live sessions behind, so the exact count
    // is not the point — that the two we just made are dead is.
    const { revoked } = body(res)
    assert.ok(revoked >= 2, `expected at least 2 sessions revoked, got ${revoked}`)

    for (const token of [a, b]) {
      const attempt = await inject({
        method: 'POST',
        url: '/api/auth/refresh',
        headers: { cookie: jar(token) },
      })
      assert.equal(attempt.statusCode, 401)
    }
  })

  await check('protected routes reject anonymous callers', async () => {
    const guarded = [
      { method: 'GET', url: '/api/auth/me' },
      { method: 'GET', url: '/api/auth/sessions' },
      { method: 'POST', url: '/api/auth/logout-all' },
    ]
    for (const opts of guarded) {
      const res = await inject(opts)
      assert.equal(res.statusCode, 401, `${opts.method} ${opts.url} should require a token`)
    }
  })

  await check('a new account defaults to the reader role', async () => {
    const fresh = await User.create({
      googleSub: `sub-test-${marker}-role`,
      email: `sub-test-${marker}-role@example.test`,
      name: 'Role Tester',
    })
    assert.equal(fresh.role, 'reader')
    await User.deleteOne({ _id: fresh._id })
  })

  await check('a reader is refused admin routes', async () => {
    assert.equal(user.role, 'reader')
    const token = signAccessToken(user)

    const res = await inject({
      method: 'GET',
      url: '/api/admin/users',
      headers: { authorization: `Bearer ${token}` },
    })
    // 403, not 401: the caller is authenticated, they are just not allowed.
    assert.equal(res.statusCode, 403)
  })

  await check('an admin is allowed admin routes', async () => {
    const admin = await User.create({
      googleSub: `sub-test-${marker}-admin`,
      email: `sub-test-${marker}-admin@example.test`,
      name: 'Admin Tester',
      role: 'admin',
    })

    const res = await inject({
      method: 'GET',
      url: '/api/admin/users',
      headers: { authorization: `Bearer ${signAccessToken(admin)}` },
    })
    assert.equal(res.statusCode, 200)
    assert.ok(Array.isArray(body(res).users))

    // The list must never leak Google's immutable subject id.
    assert.ok(
      body(res).users.every((u) => u.googleSub === undefined),
      'admin list exposed googleSub',
    )

    // cleaned up by the shared sweep, but assert it here too so a regression in
    // cleanup() shows up as a failure rather than as mystery rows in the dev db
    await User.deleteOne({ _id: admin._id })
  })

  // The role is read from the database on every request rather than baked into
  // the token, so a revocation takes effect immediately instead of waiting out
  // the access token's lifetime. This proves that.
  await check('revoking a role takes effect without a new token', async () => {
    const admin = await User.create({
      googleSub: `sub-test-${marker}-revoke`,
      email: `sub-test-${marker}-revoke@example.test`,
      role: 'admin',
    })
    const token = signAccessToken(admin)

    const before = await inject({
      method: 'GET',
      url: '/api/admin/users',
      headers: { authorization: `Bearer ${token}` },
    })
    assert.equal(before.statusCode, 200)

    admin.role = 'reader'
    await admin.save()

    const after = await inject({
      method: 'GET',
      url: '/api/admin/users',
      headers: { authorization: `Bearer ${token}` },
    })
    assert.equal(after.statusCode, 403, 'the same token still worked after a demotion')

    await User.deleteOne({ _id: admin._id })
  })

  await check('admin routes still require a token', async () => {
    const res = await inject({ method: 'GET', url: '/api/admin/users' })
    assert.equal(res.statusCode, 401)
  })

  await check('public routes stay public', async () => {
    for (const url of ['/api/ping', '/api/health', '/api/auth/config']) {
      const res = await inject({ method: 'GET', url })
      assert.equal(res.statusCode, 200, `${url} should not require a token`)
    }
  })

  await check('the oauth callback rejects a state mismatch', async () => {
    const start = await inject({ method: 'GET', url: '/api/auth/google' })
    if (start.statusCode === 503) return // google not configured; nothing to forge

    const setCookie = start.headers['set-cookie']
    const stateCookie = (Array.isArray(setCookie) ? setCookie : [setCookie])
      .find((c) => c.startsWith(`${config.auth.stateCookie}=`))

    const res = await inject({
      method: 'GET',
      url: '/api/auth/google/callback?code=whatever&state=forged',
      headers: { cookie: stateCookie.split(';')[0] },
    })
    assert.equal(res.statusCode, 403)
    assert.match(body(res).error.message, /state mismatch/i)
  })

  // The bug this catches: GOOGLE_REDIRECT_URI pointed at a different host than
  // the one the browser started on (127.0.0.1:4000 vs localhost:5173). Cookies
  // are host-scoped, so the state cookie was never sent back and every real
  // sign-in died with "no state cookie was sent". Nothing else in the suite
  // would have noticed, because every other test calls the API directly.
  await check('the oauth redirect_uri is on the same host as the state cookie', async () => {
    const start = await inject({ method: 'GET', url: '/api/auth/google' })
    if (start.statusCode === 503) return

    const location = start.headers.location
    const redirectUri = new URL(new URLSearchParams(location.split('?')[1]).get('redirect_uri'))
    const callbackOrigin = new URL(config.google.redirectUri).origin
    // The app origin the browser actually navigates to in dev. In production
    // both are the same public host and this collapses to a trivial check.
    const appOrigin = new URL(config.frontendUrl).origin

    assert.equal(
      redirectUri.origin,
      callbackOrigin,
      'the redirect_uri sent to Google must equal GOOGLE_REDIRECT_URI',
    )
    assert.equal(
      callbackOrigin,
      appOrigin,
      `sign-in starts on ${appOrigin}, so the callback must return there too — ` +
        'a different host cannot receive the state cookie',
    )
  })

  // A declined consent screen arrives as ?error= on the callback. Returning a
  // JSON body dumped a raw error page in the reader's browser; it has to land
  // back on /login where the message can be explained.
  await check('a declined google consent screen returns to the login page', async () => {
    const start = await inject({ method: 'GET', url: '/api/auth/google' })
    if (start.statusCode === 503) return

    const res = await inject({ method: 'GET', url: '/api/auth/google/callback?error=access_denied' })
    assert.equal(res.statusCode, 302)

    const target = new URL(res.headers.location)
    assert.equal(target.pathname, '/login')
    assert.equal(target.searchParams.get('error'), 'access_denied')

    // The state cookie must not survive a failed attempt.
    const cleared = (res.headers['set-cookie'] || []).join(';')
    assert.match(cleared, new RegExp(`${config.auth.stateCookie}=;`))
  })

  return { user, server }
}

/**
 * Removes every test account and its sessions, whatever state we ended in.
 * Must run before the server stops: stopping it triggers the db plugin's
 * onPostStop, which closes the connection out from under these queries.
 */
async function cleanup(user) {
  // Collect ids first — once the users are gone their sessions are orphans.
  const ids = await User.find({ googleSub: /^sub-test-/ }).distinct('_id')
  if (user && !ids.some((id) => String(id) === String(user._id))) ids.push(user._id)

  if (ids.length) await Session.deleteMany({ userId: { $in: ids } })
  await User.deleteMany({ _id: { $in: ids } })
}

main()
  .then(async ({ user, server }) => {
    await cleanup(user)
    await server.stop()
    await disconnect()

    console.log(`\n${passed} passed, ${failures.length} failed\n`)
    if (failures.length) {
      for (const f of failures) console.error(`${f.name}:\n${f.err.stack}\n`)
      process.exit(1)
    }
    process.exit(0)
  })
  .catch(async (err) => {
    console.error('\nharness crashed:', err)
    // Cleanup runs even on a crash, otherwise a failed run leaves live
    // sessions and a user behind in the dev database.
    await cleanup().catch(() => {})
    await disconnect().catch(() => {})
    process.exit(1)
  })
