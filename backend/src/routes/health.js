import { ping, isHealthy } from '../db/index.js'
import { config } from '../config/index.js'

export default {
  name: 'health-routes',
  version: '1.0.0',
  register(server) {
    server.route({
      method: 'GET',
      path: '/ping',
      options: { auth: false, description: 'Liveness probe — no database access' },
      handler: () => ({ pong: true, uptime: process.uptime() }),
    })

    server.route({
      method: 'GET',
      path: '/health',
      options: { auth: false, description: 'Readiness probe — checks MongoDB' },
      handler: async (request, h) => {
        const dbOk = await ping().catch(() => false)
        return h
          .response({
            status: dbOk ? 'ok' : 'degraded',
            database: dbOk ? 'up' : 'down',
            dbConnected: isHealthy(),
            name: config.db.name,
            env: config.nodeEnv,
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
          })
          .code(dbOk ? 200 : 503)
      },
    })
  },
}
