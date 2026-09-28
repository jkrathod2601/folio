import mongoose from 'mongoose'
import { config } from '../config/index.js'

let connectPromise = null

export async function connect() {
  if (connectPromise) return connectPromise

  connectPromise = mongoose
    .connect(config.mongoUri, {
      dbName: config.db.name,
      maxPoolSize: config.db.maxPoolSize,
      serverSelectionTimeoutMS: config.db.serverSelectionTimeoutMs,
      autoIndex: config.nodeEnv !== 'production',
    })
    .then((m) => {
      m.connection.on('error', (err) => {
        console.error('[db] connection error', err.message)
      })
      m.connection.on('disconnected', () => {
        console.warn('[db] disconnected')
      })
      console.log(`[db] connected to "${m.connection.name}"`)
      return m
    })
    .catch((err) => {
      connectPromise = null
      throw err
    })

  return connectPromise
}

export async function disconnect() {
  if (!connectPromise) return
  connectPromise = null
  await mongoose.disconnect()
  console.log('[db] connection closed')
}

export function isHealthy() {
  return mongoose.connection.readyState === 1
}

export async function ping() {
  if (!isHealthy()) return false
  await mongoose.connection.db.admin().ping()
  return true
}

export { mongoose }
