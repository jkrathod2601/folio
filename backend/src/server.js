import { createServer } from './app.js'
import { isProduction } from './config/index.js'

const server = await createServer()

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, async () => {
    console.log(`[server] ${signal} received, shutting down`)
    try {
      await server.stop({ timeout: 10_000 })
      process.exit(0)
    } catch (err) {
      console.error('[server] shutdown failed', err)
      process.exit(1)
    }
  })
}

process.on('unhandledRejection', (err) => {
  console.error('[server] unhandled rejection', err)
})

try {
  await server.start()
} catch (err) {
  console.error('[server] failed to start:', err.message)
  if (isProduction) {
    console.error('[server] refusing to run without a healthy database')
    process.exit(1)
  }
  process.exitCode = 1
}
