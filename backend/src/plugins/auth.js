import { jwtScheme } from '../auth/strategy.js'
import { cookieDefinitions } from '../auth/cookies.js'

/**
 * Authorization scopes.
 *
 * The `jwt` scope is the baseline every authenticated caller gets. The `admin`
 * scope is granted only to users whose role is at least `admin`, and a route has
 * to ask for it by name.
 *
 * Why a scope and not an `if (role !== 'admin')` inside each handler: a scope is
 * declared next to the route, so the requirement is visible in the route table
 * and cannot be forgotten in a handler that somebody forgot to review. There is
 * no way for a request to *reach* an admin route without passing this check,
 * because hapi resolves the scope before the handler runs.
 */
export const authPlugin = {
  name: 'auth',
  version: '1.0.0',
  register(server) {
    for (const { name, ...options } of cookieDefinitions()) {
      server.state(name, options)
    }

    server.auth.scheme('jwt', jwtScheme)
    server.auth.strategy('jwt', 'jwt')

    // `required` on the default: a new route is protected unless it explicitly
    // opts out with `auth: false`. The alternative ('try' mode) makes an
    // unannotated route quietly public, which is the wrong default for an API.
    // No default scope: any authenticated account may call an ordinary route.
    server.auth.default({ strategy: 'jwt', mode: 'required' })
  },
}

/**
 * Route option for endpoints that only an admin may call:
 *
 *     server.route({ method: 'GET', path: '/admin/users', options: adminOnly, handler })
 *
 * Hapi authorizes a route's `scope` against the `scope` array the scheme
 * returned in credentials, so `scope: 'admin'` here is checked before the
 * handler runs — there is no in-handler role check to forget. The caller gets a
 * 403 ("Insufficient scope"), never a 401, because they are authenticated; they
 * are simply not allowed.
 *
 * Exported as a spreadable object so the requirement is greppable — `auth: false`
 * and `auth: 'jwt'` are both easy to miss in review, `...adminOnly` is not.
 */
export const adminOnly = {
  auth: { strategy: 'jwt', mode: 'required', scope: 'admin' },
}
