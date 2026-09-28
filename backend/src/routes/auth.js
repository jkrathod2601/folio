import Boom from '@hapi/boom'
import { config, isGoogleConfigured } from '../config/index.js'
import { User } from '../models/User.js'
import { Session } from '../models/Session.js'
import { createState, authorizeUrl, exchangeCode, fetchProfile } from '../auth/google.js'
import {
  signAccessToken,
  issueSession,
  rotateSession,
  revokeSession,
  revokeAllForUser,
} from '../auth/tokens.js'
import {
  refreshCookie,
  clearRefreshCookie,
  stateCookie,
  clearStateCookie,
  readCookie,
} from '../auth/cookies.js'

const REQUEST_META = (request) => ({
  userAgent: request.headers['user-agent'],
  ip: request.info.remoteAddress,
})

/**
 * Is this email on the ADMIN_EMAILS bootstrap list?
 *
 * Compared case-insensitively because the schema lowercases on write but a
 * hand-typed env var is a common source of a silently-missing admin.
 */
function isBootstrapAdmin(email) {
  return config.auth.adminEmails.includes(String(email).toLowerCase())
}

function publicUser(user) {
  const doc = user.toJSON ? user.toJSON() : user
  return {
    id: doc.id ?? doc._id?.toString(),
    email: doc.email,
    name: doc.name,
    username: doc.username ?? null,
    portraitUrl: doc.portraitUrl ?? null,
    bio: doc.bio ?? '',
    location: doc.location ?? null,
    verified: doc.verified,
    role: doc.role,
    joined: doc.joined,
  }
}

/** Derives a stable, unique handle from the Google name/email. */
function deriveUsername(name, email) {
  const base = (name || email.split('@')[0] || 'reader')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 20)
  return base || 'reader'
}

async function upsertUser(profile) {
  const existing = await User.findOne({ googleSub: profile.googleSub })
  if (existing) {
    // Refresh the mutable parts on every sign-in, but never let a Google
    // response clobber anything the user set on Folio itself.
    existing.email = profile.email
    if (profile.name) existing.name = profile.name
    if (profile.portraitUrl) existing.portraitUrl = profile.portraitUrl
    if (profile.emailVerified) existing.verified = true
    // Promote, never demote: dropping an admin out of ADMIN_EMAILS should not
    // silently strip their access the next time they sign in from another
    // device. Revocation is an explicit act (npm run set-role).
    if (isBootstrapAdmin(existing.email)) existing.role = 'admin'
    await existing.save()
    return existing
  }

  const username = await (async () => {
    const candidate = deriveUsername(profile.name, profile.email)
    let attempt = candidate
    let n = 1
    while (await User.exists({ username: attempt })) attempt = `${candidate}${++n}`
    return attempt
  })()

  return User.create({
    googleSub: profile.googleSub,
    email: profile.email,
    name: profile.name,
    username,
    portraitUrl: profile.portraitUrl,
    verified: profile.emailVerified,
    role: isBootstrapAdmin(profile.email) ? 'admin' : undefined,
  })
}

/**
 * Bounces back to the SPA with the access token in the URL *fragment*.
 * Fragments are never sent to a server or written to an access log, so the
 * token cannot leak via referrers or the callback request line. The durable
 * credential stays in the httpOnly refresh cookie.
 */
function redirectToApp(h, accessToken) {
  const target = new URL('/auth/callback', config.frontendUrl)
  target.hash = new URLSearchParams({ access_token: accessToken }).toString()
  return h.redirect(target.toString())
}

/**
 * Google reports a declined consent screen (or any other failure) as a query
 * parameter on the callback, not an error status. Bouncing the reader back to
 * /login with the reason is what lets LoginPage explain what happened; throwing
 * here instead would dump a JSON body on a page they are looking at in a
 * browser, which is the sort of thing that generates a bug report.
 */
function redirectToLoginError(h, error) {
  const target = new URL('/login', config.frontendUrl)
  target.searchParams.set('error', error)
  return h.redirect(target.toString()).state(...clearStateCookie())
}

export default {
  name: 'auth-routes',
  version: '1.0.0',
  register(server) {
    // Lets the login page decide what to render without a round trip failure.
    server.route({
      method: 'GET',
      path: '/config',
      options: { auth: false },
      handler: () => ({
        providers: isGoogleConfigured ? ['google'] : [],
        googleEnabled: isGoogleConfigured,
      }),
    })

    server.route({
      method: 'GET',
      path: '/google',
      options: { auth: false, description: 'Start Google sign-in' },
      handler: (request, h) => {
        if (!isGoogleConfigured) {
          // See google.js: 503 survives hapi's 500 masking, 500 does not.
          throw Boom.serverUnavailable(
            'Google sign-in is not configured on this server. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and GOOGLE_REDIRECT_URI.',
          )
        }

        const { state, verifier, challenge } = createState()
        return h.redirect(authorizeUrl({ state, challenge })).state(...stateCookie(`${state}.${verifier}`))
      },
    })

    server.route({
      method: 'GET',
      path: '/google/callback',
      options: { auth: false, description: 'Google redirect target' },
      handler: async (request, h) => {
        const cookie = readCookie(request, config.auth.stateCookie)

        if (request.query.error) {
          return redirectToLoginError(h, request.query.error)
        }

        if (!cookie) throw Boom.badRequest('Sign-in expired — no state cookie was sent')
        if (!request.query.state) throw Boom.badRequest('Sign-in expired — missing state parameter')

        const [cookieState, verifier] = cookie.split('.')
        if (!cookieState || !verifier) throw Boom.badRequest('Malformed state cookie')
        if (cookieState !== request.query.state) throw Boom.forbidden('State mismatch — possible CSRF')
        if (!request.query.code) throw Boom.badRequest('Google did not return an authorization code')

        const { access_token: googleToken } = await exchangeCode({
          code: request.query.code,
          verifier,
        })
        const profile = await fetchProfile(googleToken)

        const user = await upsertUser(profile)
        const refreshToken = await issueSession(user, REQUEST_META(request))

        request.log(['auth', 'info'], `signed in ${user.email}`)

        return redirectToApp(h, signAccessToken(user))
          .state(...clearStateCookie())
          .state(...refreshCookie(refreshToken))
      },
    })

    server.route({
      method: 'POST',
      path: '/refresh',
      options: {
        auth: false,
        description: 'Exchange the refresh cookie for a new access token',
      },
      handler: async (request, h) => {
        const raw = readCookie(request, config.auth.refreshCookie)
        if (!raw) throw Boom.unauthorized('No refresh token — sign in again')

        const { user, refreshToken } = await rotateSession(raw, REQUEST_META(request))

        return h
          .response({ user: publicUser(user), accessToken: signAccessToken(user) })
          .state(...refreshCookie(refreshToken))
      },
    })

    server.route({
      method: 'GET',
      path: '/me',
      options: { description: 'The signed-in user, from the bearer access token' },
      handler: (request) => ({ user: publicUser(request.auth.artifacts.user) }),
    })

    server.route({
      method: 'POST',
      path: '/logout',
      options: { auth: false, description: 'Revoke the current session' },
      handler: async (request, h) => {
        const raw = readCookie(request, config.auth.refreshCookie)
        if (raw) await revokeSession(raw)
        return h.response({ ok: true }).state(...clearRefreshCookie())
      },
    })

    server.route({
      method: 'POST',
      path: '/logout-all',
      options: { description: 'Revoke every session for this account' },
      handler: async (request, h) => {
        const count = await revokeAllForUser(request.auth.credentials.userId)
        return h.response({ ok: true, revoked: count }).state(...clearRefreshCookie())
      },
    })

    server.route({
      method: 'GET',
      path: '/sessions',
      options: { description: 'Live sessions for this account' },
      handler: async (request) => {
        const sessions = await Session.find({
          userId: request.auth.credentials.userId,
          revokedAt: null,
          rotatedAt: null,
          expiresAt: { $gt: new Date() },
        })
          .sort({ createdAt: -1 })
          .lean()

        return {
          sessions: sessions.map((s) => ({
            id: s._id.toString(),
            userAgent: s.userAgent,
            ip: s.ip,
            createdAt: s.createdAt,
            expiresAt: s.expiresAt,
          })),
        }
      },
    })
  },
}
