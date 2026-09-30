import { connect, disconnect, mongoose } from '../db/index.js'
import { config } from '../config/index.js'

export const dbPlugin = {
  name: 'db',
  version: '1.0.0',
  register(server) {
    server.ext('onPreStart', async () => {
      try {
        await connect()
      } catch (err) {
        // Without this, a bad MONGODB_URI aborts server.start() and the process
        // exits 1 — which reads on Render as "Application exited early" and
        // tells you nothing about the URI that caused it.
        if (!config.db.optional) throw err

        // The failure is deliberately loud and repeated: this is a degraded
        // boot, not a healthy one. Health checks still report 503, so a monitor
        // sees the outage even though the process is up.
        console.error(
          `[db] could not connect to "${config.mongoUri.replace(/\/\/[^@]*@/, '//***@')}" — ${err.message}`,
        )
        console.error('[db] DB_OPTIONAL is set, so the server is starting without a database. Data routes will fail until it is reachable.')

        // Reconnect in the background so a transient outage or a late-starting
        // replica set heals without a redeploy. mongoose.connect() after a
        // failed attempt is safe; connect() clears its own cached promise.
        let attempt = 0
        const retry = setInterval(() => {
          attempt += 1
          connect().then(
            () => {
              clearInterval(retry)
              console.log('[db] reconnected after ' + attempt + ' attempt(s) — data routes are live')
            },
            (retryErr) => {
              // Logged rather than swallowed: a silent retry loop is
              // indistinguishable from no retry loop at all, which is exactly
              // the bug this had while being written.
              console.warn(`[db] retry ${attempt} failed: ${retryErr.message}`)
            },
          )
        }, 10_000)
        // Unref so the pending timer cannot hold the process open during a
        // graceful shutdown. The server itself keeps the event loop alive.
        retry.unref()
      }
    })

    server.ext('onPostStop', async () => {
      await disconnect()
    })

    server.decorate('server', 'mongo', () => mongoose.connection)
  },
}
