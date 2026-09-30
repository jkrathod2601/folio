// Installed before any import, because ES module imports are hoisted and
// evaluated first: a throw inside config/index.js happens before line 1's
// bindings exist, so a handler registered afterwards would never run. That is
// what made a bad env var surface as a bare "Exited with status 1" with no
// message — the one failure mode that is hardest to diagnose from a deploy log.
process.on('uncaughtException', (err) => {
  console.error('[server] uncaught exception:', err?.stack ?? err)
  process.exit(1)
})

process.on('unhandledRejection', (err) => {
  console.error('[server] unhandled rejection:', err?.stack ?? err)
})

const { createServer } = await import('./app.js')
const { isProduction } = await import('./config/index.js')

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
