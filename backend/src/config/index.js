import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import dotenv from 'dotenv'
import Joi from 'joi'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..', '..')

dotenv.config({ path: resolve(root, '.env'), quiet: true })

const blankToUndefined = (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v)

/**
 * Render (and every PaaS that fronts the app with its own router) can only reach
 * a process bound to all interfaces. 127.0.0.1 is still the right local default —
 * it keeps the dev server off the LAN — but a production deploy that inherits it
 * answers on a port nothing can route to, and the platform reports it as an
 * application that exited early.
 */
const DEFAULT_HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1'

const schema = Joi.object({
  nodeEnv: Joi.string().valid('development', 'test', 'production').default('development'),
  host: Joi.string().default(DEFAULT_HOST),
  port: Joi.number().port().default(4000),
  logLevel: Joi.string().default('info'),
  mongoUri: Joi.string().uri({ scheme: ['mongodb', 'mongodb+srv'] }).required(),
  frontendUrl: Joi.string().uri().default('http://localhost:5173'),
  cors: {
    // Extra allowed origins beyond frontendUrl. Needed when more than one
    // frontend deployment talks to the API (a preview deploy, say).
    allowedOrigins: Joi.array().items(Joi.string().uri()).default([]),
  },
  db: {
    name: Joi.string().default('folio'),
    maxPoolSize: Joi.number().integer().min(1).default(10),
    serverSelectionTimeoutMs: Joi.number().integer().min(100).default(5000),
    /**
     * Start the HTTP server even when MongoDB is unreachable.
     *
     * False by default: a process that boots without its only datastore serves
     * 500s on every route that touches data, so a green deploy can hide a total
     * outage. True makes the server useful anyway — health checks answer, and
     * endpoints that need no database (the auth config probe, /api/ping) still
     * work — which is what you want while wiring up the connection string.
     *
     * The health route reads `dbConnected` and still returns 503 when the
     * database is down, so this relaxes startup, not the truthfulness of the
     * health check.
     */
    optional: Joi.boolean().default(false),
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
    host: blankToUndefined(process.env.HOST),
    port: blankToUndefined(process.env.PORT),
    logLevel: blankToUndefined(process.env.LOG_LEVEL),
    mongoUri: process.env.MONGODB_URI,
    frontendUrl: process.env.FRONTEND_URL,
    cors: {
      allowedOrigins: process.env.CORS_ALLOWED_ORIGINS
        ? process.env.CORS_ALLOWED_ORIGINS.split(',')
            .map((o) => o.trim())
            .filter(Boolean)
        : undefined,
    },
    db: {
      name: process.env.DB_NAME,
      maxPoolSize: process.env.DB_MAX_POOL_SIZE,
      serverSelectionTimeoutMs: process.env.DB_SERVER_SELECTION_TIMEOUT_MS,
      optional: blankToUndefined(process.env.DB_OPTIONAL),
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

if (isProduction && !config.host.startsWith('0.')) {
  throw new Error(
    `Invalid environment config: production must bind 0.0.0.0, got "${config.host}". A platform router cannot reach 127.0.0.1.`,
  )
}

// Browsers reject SameSite=None outright unless the cookie is also Secure, and
// they do it silently — the Set-Cookie is dropped, so the symptom is a user who
// is mysteriously signed out on every reload rather than an error anywhere.
if (config.auth.cookieSameSite === 'None' && !config.auth.cookieSecure && !isProduction) {
  throw new Error(
    'Invalid environment config: COOKIE_SAMESITE=None requires COOKIE_SECURE=true.',
  )
}

/**
 * Production is a split deployment: SPA on Vercel, API on Render. The refresh
 * cookie therefore travels cross-site, and a cross-site cookie is only stored
 * and sent when it is SameSite=None; Secure. Lax is not "more secure" here, it
 * is simply never sent, which reads as a refresh that fails on every page load.
 *
 * Verified rather than assumed: the session is minted by a response to a
 * cross-origin fetch with credentials, so this is the browser's decision, not
 * ours. `Secure` is forced on in cookies.js whenever isProduction regardless.
 */
if (isProduction && config.frontendUrl.startsWith('http://')) {
  throw new Error(
    `Invalid environment config: FRONTEND_URL must be https in production, got "${config.frontendUrl}". A Secure cookie cannot be set over http.`,
  )
}

export { root as projectRoot }
