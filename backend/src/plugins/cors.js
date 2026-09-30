import Boom from '@hapi/boom'
import { config } from '../config/index.js'

/**
 * CORS for the split deployment.
 *
 * In development the frontend is same-origin (Vite proxies /api to :4000), so
 * none of this fires. In production the SPA is on Vercel and the API is on
 * Render — two different origins — so the browser preflights every request.
 *
 * `credentials: 'include'` is not optional here. The refresh cookie is httpOnly
 * and lives on the API origin; without it the silent refresh on page load can
 * never happen and the user is silently signed out on every reload.
 *
 * The two consequences of that cookie crossing origins are handled by config
 * rather than here: `COOKIE_SAMESITE=None` and `COOKIE_SECURE=true` are both
 * required for the browser to store and send a cross-site cookie. See
 * .env.example.
 *
 * Allowed origins are explicit. A reflected `Origin` header would let any site
 * on the internet make authenticated requests with the reader's cookie, which
 * is the same thing as no cookie policy at all.
 */
export const corsPlugin = {
  name: 'cors',
  version: '1.0.0',
  register(server) {
    const allowed = new Set(
      [config.frontendUrl, ...config.cors.allowedOrigins]
        .filter(Boolean)
        .map((origin) => origin.replace(/\/+$/, '')),
    )

    server.ext('onRequest', (request, h) => {
      const origin = request.headers.origin?.replace(/\/+$/, '')
      if (!origin || !allowed.has(origin)) return h.continue

      // `h.continue` is the value hapi hands back to end an extension early, not
      // the response toolkit, so it has no `.header()`. The decision is recorded
      // here and the headers are attached in onPreResponse, where there is a
      // real response to decorate.
      request.app.corsOrigin = origin
      return h.continue
    })

    server.ext('onPreResponse', (request, h) => {
      const origin = request.app.corsOrigin
      if (!origin) return h.continue

      // `vary` is what stops a shared cache (Render's edge, a CDN, a proxy) from
      // serving one origin's response to a different origin. `response.vary()`
      // appends correctly; assigning the header would produce a duplicate
      // "Origin, Origin" that some caches treat as a distinct value.
      const { response } = request

      // Any Boom that reached this point was not rebuilt by errorPlugin — a 404
      // from hapi's own router, say. Mutate the output headers rather than
      // replacing the response, so the status code and payload survive.
      if (response.isBoom) {
        Object.assign(response.output.headers, {
          'access-control-allow-origin': origin,
          'access-control-allow-credentials': 'true',
        })
        response.output.headers.vary = 'Origin'
        return h.continue
      }

      response.header('access-control-allow-origin', origin)
      response.header('access-control-allow-credentials', 'true')
      response.vary('Origin')
      if (request.headers['access-control-request-headers']) {
        response.vary('Access-Control-Request-Headers')
      }
      return h.continue
    })

    // Preflight. Hapi routes OPTIONS itself, so an explicit route is needed or
    // the browser gets a 404 and reports the real request as a CORS failure.
    server.route({
      method: 'OPTIONS',
      path: '/{any*}',
      options: { auth: false, description: 'CORS preflight' },
      handler: (request, h) => {
        const origin = request.headers.origin?.replace(/\/+$/, '')
        if (!origin || !allowed.has(origin)) {
          throw Boom.forbidden(
            `Origin not allowed: ${origin ?? '(none)'}. Add it to FRONTEND_URL or CORS_ALLOWED_ORIGINS.`,
          )
        }

        return h
          .response()
          .code(204)
          .header(
            'access-control-allow-methods',
            'GET, POST, PUT, PATCH, DELETE, OPTIONS',
          )
          .header(
            'access-control-allow-headers',
            request.headers['access-control-request-headers'] ??
              'Authorization, Content-Type',
          )
          .header('access-control-max-age', '86400')
      },
    })
  },
}
