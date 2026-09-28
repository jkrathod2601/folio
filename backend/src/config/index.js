import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import dotenv from 'dotenv'
import Joi from 'joi'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..', '..')

dotenv.config({ path: resolve(root, '.env'), quiet: true })

const blankToUndefined = (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v)

const schema = Joi.object({
  nodeEnv: Joi.string().valid('development', 'test', 'production').default('development'),
  host: Joi.string().default('127.0.0.1'),
  port: Joi.number().port().default(4000),
  logLevel: Joi.string().default('info'),
  mongoUri: Joi.string().uri({ scheme: ['mongodb', 'mongodb+srv'] }).required(),
  frontendUrl: Joi.string().uri().default('http://localhost:5173'),
  db: {
    name: Joi.string().default('folio'),
    maxPoolSize: Joi.number().integer().min(1).default(10),
    serverSelectionTimeoutMs: Joi.number().integer().min(100).default(5000),
  },
  auth: {
    accessSecret: Joi.string().min(32).required(),
    refreshSecret: Joi.string().min(32).required(),
    issuer: Joi.string().default('folio-backend'),
    accessTtlMs: Joi.number().integer().min(60_000).default(15 * 60_000),
    refreshTtlMs: Joi.number().integer().min(3_600_000).default(30 * 24 * 3_600_000),
    // Refresh lives in a cookie so it is unreadable by JS. The access token is
    // deliberately NOT a cookie: it is short-lived and held in memory, so XSS
    // cannot exfiltrate a durable credential.
    refreshCookie: Joi.string().default('folio_rt'),
    stateCookie: Joi.string().default('folio_oauth_state'),
    cookieSecure: Joi.boolean().default(false),
    cookieSameSite: Joi.string().valid('Strict', 'Lax', 'None').default('Lax'),
    // Accounts that are promoted to admin on their next sign-in. This is the
    // bootstrap for the first administrator: it is the only path that can mint
    // an admin without an existing admin, so it is deliberately an env var and
    // not something a request body can reach.
    adminEmails: Joi.array().items(Joi.string().email()).default([]),
  },
  google: {
    clientId: Joi.string(),
    clientSecret: Joi.string(),
    redirectUri: Joi.string().uri(),
  },
})

const { value, error } = schema.validate(
  {
    nodeEnv: process.env.NODE_ENV,
    host: process.env.HOST,
    port: process.env.PORT,
    logLevel: process.env.LOG_LEVEL,
    mongoUri: process.env.MONGODB_URI,
    frontendUrl: process.env.FRONTEND_URL,
    db: {
      name: process.env.DB_NAME,
      maxPoolSize: process.env.DB_MAX_POOL_SIZE,
      serverSelectionTimeoutMs: process.env.DB_SERVER_SELECTION_TIMEOUT_MS,
    },
    auth: {
      accessSecret: blankToUndefined(process.env.JWT_ACCESS_SECRET),
      refreshSecret: blankToUndefined(process.env.JWT_REFRESH_SECRET),
      issuer: process.env.JWT_ISSUER,
      accessTtlMs: process.env.ACCESS_TOKEN_TTL_MS,
      refreshTtlMs: process.env.REFRESH_TOKEN_TTL_MS,
      cookieSecure: process.env.COOKIE_SECURE,
      cookieSameSite: process.env.COOKIE_SAMESITE,
      adminEmails: process.env.ADMIN_EMAILS
        ? process.env.ADMIN_EMAILS.split(',')
            .map((e) => e.trim().toLowerCase())
            .filter(Boolean)
        : undefined,
    },
    google: {
      clientId: blankToUndefined(process.env.GOOGLE_CLIENT_ID),
      clientSecret: blankToUndefined(process.env.GOOGLE_CLIENT_SECRET),
      redirectUri: blankToUndefined(process.env.GOOGLE_REDIRECT_URI),
    },
  },
  { abortEarly: false },
)

if (error) {
  throw new Error(`Invalid environment config: ${error.message}`)
}

export const config = Object.freeze(value)
export const isProduction = config.nodeEnv === 'production'

/** Google sign-in is the only provider, so the UI just needs to know if it can be used. */
export const isGoogleConfigured = Boolean(
  config.google.clientId && config.google.clientSecret && config.google.redirectUri,
)

if (isProduction && !isGoogleConfigured) {
  throw new Error('Invalid environment config: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and GOOGLE_REDIRECT_URI are required in production')
}

export { root as projectRoot }
