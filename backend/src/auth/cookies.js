import { config, isProduction } from '../config/index.js'

/**
 * Cookie policy for the two browser-held credentials.
 *
 * `isSecure` is forced on in production: the app is served over HTTPS there and
 * a refresh cookie without Secure would travel in the clear. `sameSite: 'Lax'`
 * still permits the top-level GET redirect Google sends the user back on, while
 * blocking cross-site POSTs — which is what protects `POST /auth/refresh` and
 * `POST /auth/logout` from CSRF. There is no state-changing GET in this API.
 */
const secure = config.auth.cookieSecure || isProduction

const base = {
  isHttpOnly: true,
  isSecure: secure,
  isSameSite: config.auth.cookieSameSite,
  path: '/',
  encoding: 'none',
}

const STATE_TTL_MS = 10 * 60_000

/**
 * Cookie specs are arrays shaped to spread straight into `h.state(...)`:
 *
 *     return h.state(...refreshCookie(token)).state(...clearStateCookie())
 *
 * An object would be wrong here — `{...spec}` is object spread, but `h.state(
 * ...spec)` is argument spread, and plain objects are not iterable. They must
 * also not call `h.state` themselves: it already returns the response, so
 * nesting the two emits a junk cookie literally named "undefined".
 */

/** Declarations for `server.state()`, which hapi needs before it can parse. */
export const cookieDefinitions = () => [
  { ...base, name: config.auth.refreshCookie, ttl: config.auth.refreshTtlMs },
  {
    // Short-lived, single round trip, and scoped to the auth routes so it is not
    // attached to every request the API makes.
    ...base,
    name: config.auth.stateCookie,
    ttl: STATE_TTL_MS,
    path: '/api/auth',
  },
]

export const refreshCookie = (token) => [
  config.auth.refreshCookie,
  token,
  { ...base, ttl: config.auth.refreshTtlMs },
]

export const clearRefreshCookie = () => [
  config.auth.refreshCookie,
  null,
  { ...base, ttl: 0 },
]

export const stateCookie = (value) => [
  config.auth.stateCookie,
  value,
  { ...base, ttl: STATE_TTL_MS, path: '/api/auth' },
]

export const clearStateCookie = () => [
  config.auth.stateCookie,
  null,
  { ...base, ttl: 0, path: '/api/auth' },
]

export function readCookie(request, name) {
  return request.state?.[name] || null
}
