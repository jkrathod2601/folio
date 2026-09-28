import { connect, disconnect, mongoose } from '../src/db/index.js'
import { config } from '../src/config/index.js'

const meta = mongoose.connection.collection('meta')

async function initDb() {
  await connect()

  const admin = mongoose.connection.getClient().db('admin')
  const { databases } = await admin.admin().listDatabases()
  const existed = databases.some((d) => d.name === config.db.name)

  const result = await meta.updateOne(
    { key: 'createdAt' },
    { $setOnInsert: { value: new Date().toISOString(), host: mongoose.connection.host } },
    { upsert: true },
  )

  console.log(
    existed
      ? `[db] "${config.db.name}" already present`
      : `[db] created "${config.db.name}" on ${mongoose.connection.host}:${mongoose.connection.port}`,
  )
  if (result.upsertedCount) console.log('[db] meta.createdAt recorded')

  const status = await admin.admin().serverStatus()

  console.log(`[db] server ${status.version} · database "${config.db.name}" ready`)
}

try {
  await initDb()
  await disconnect()
  process.exit(0)
} catch (err) {
  console.error('[db] init failed:', err.message)
  process.exit(1)
}
