import { server } from '@hapi/hapi'
import { config } from './config/index.js'
import { dbPlugin } from './plugins/db.js'
import { errorPlugin } from './plugins/error.js'
import { corsPlugin } from './plugins/cors.js'
import { authPlugin } from './plugins/auth.js'
import { routes } from './routes/index.js'

export async function createServer(overrides = {}) {
  const app = server({
    host: config.host,
    port: config.port,
    router: { stripTrailingSlash: true },
    ...overrides,
  })

  // error before cors, deliberately. errorPlugin rebuilds every Boom response
  // into a fresh JSON body, which discards any headers set earlier in the
  // lifecycle — so a CORS extension running first would put its headers on a
  // response that is then thrown away, and a 401 would reach the browser with
  // no access-control-allow-origin at all. Registered last, cors decorates the
  // response that actually leaves the server.
  await app.register([dbPlugin, errorPlugin, authPlugin, corsPlugin])

  for (const { plugin, prefix } of routes) {
    await app.register(plugin, { routes: { prefix } })
  }

  app.events.on('start', () => {
    console.log(`[server] folio-backend listening on ${app.info.uri} (${config.nodeEnv})`)
  })

  return app
}
