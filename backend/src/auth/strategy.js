import Boom from '@hapi/boom'
import { verifyAccessToken } from './tokens.js'
import { User } from '../models/User.js'

/**
 * Bearer access-token scheme.
 *
 * The access token lives in memory on the client and rides in the Authorization
 * header, never a cookie. That is deliberate: a cookie is sent automatically by
 * the browser, so an XSS anywhere on the page can ride on it, whereas a token
 * it can only read out of JS memory is exactly as exposed as the XSS itself and
 * expires in minutes either way.
 *
 * Hapi requires a scheme to be a factory returning `{ authenticate }`.
 */
export function jwtScheme() {
  return {
    authenticate: async (request, h) => {
      const header = request.headers.authorization

      // Null message plus a scheme: that combination is what flags the error
      // as `isMissing` in Boom, and that flag is how a strategy tells hapi "no
      // credentials were supplied" rather than "credentials were rejected".
      // Optional mode depends on the distinction — it continues anonymously on
      // a missing credential but still hard-fails a bad one. Required mode ends
      // in a 401 either way, with the Bearer challenge in the header.
      if (!header) throw Boom.unauthorized(null, 'Bearer')

      const [scheme, token] = header.split(' ')
      if (!/^Bearer$/i.test(scheme ?? '') || !token) {
        throw Boom.unauthorized('Authorization header must be "Bearer <token>"')
      }

      const { sub } = verifyAccessToken(token)

      const user = await User.findById(sub)
      if (!user) throw Boom.unauthorized('Account no longer exists')

      // Hapi authorizes a route scope by intersecting this with the scope the
      // route asked for (see plugins/auth.js). The role is read from the
      // database on every request rather than trusted from the token, so a
      // demotion takes effect immediately instead of after the access token
      // expires.
      const scope = user.hasRole('admin') ? ['jwt', 'admin'] : ['jwt']

      return h.authenticated({
        credentials: { userId: sub, scope, role: user.role },
        artifacts: { user },
      })
    },
  }
}
