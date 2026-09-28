import { server } from '@hapi/hapi'
import { config } from './config/index.js'
import { dbPlugin } from './plugins/db.js'
import { errorPlugin } from './plugins/error.js'
import { authPlugin } from './plugins/auth.js'
import { routes } from './routes/index.js'

export async function createServer(overrides = {}) {
  const app = server({
    host: config.host,
    port: config.port,
    router: { stripTrailingSlash: true },
    ...overrides,
  })

  await app.register([dbPlugin, errorPlugin, authPlugin])

  for (const { plugin, prefix } of routes) {
    await app.register(plugin, { routes: { prefix } })
  }

  app.events.on('start', () => {
    console.log(`[server] folio-backend listening on ${app.info.uri} (${config.nodeEnv})`)
  })

  return app
}
