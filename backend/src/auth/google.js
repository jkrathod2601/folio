import { createHash, randomBytes } from 'node:crypto'
import Boom from '@hapi/boom'
import { config, isGoogleConfigured } from '../config/index.js'

const AUTHORIZE_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo'

const SCOPES = ['openid', 'email', 'profile']

function requireConfigured() {
  if (!isGoogleConfigured) {
    // 503, not 500: hapi masks the message of any 500 behind "An internal server
    // error occurred", which would make a missing env var look like a crash.
    // A 503 survives and tells the client the provider is simply unavailable.
    throw Boom.serverUnavailable(
      'Google sign-in is not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and GOOGLE_REDIRECT_URI.',
    )
  }
}

const base64url = (buf) => buf.toString('base64url')

/**
 * Google is a confidential client here, but PKCE is cheap and means an
 * intercepted auth code is still useless without the verifier that never
 * leaves this process. The verifier rides out in the state cookie alongside
 * the state itself.
 */
function createPkce() {
  const verifier = base64url(randomBytes(32))
  return {
    verifier,
    challenge: base64url(createHash('sha256').update(verifier).digest()),
  }
}

export function createState() {
  const { verifier, challenge } = createPkce()
  return { state: base64url(randomBytes(24)), verifier, challenge }
}

export function authorizeUrl({ state, challenge }) {
  const params = new URLSearchParams({
    client_id: config.google.clientId,
    redirect_uri: config.google.redirectUri,
    response_type: 'code',
    scope: SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'select_account',
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  })
  return `${AUTHORIZE_URL}?${params}`
}

export async function exchangeCode({ code, verifier }) {
  requireConfigured()

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: config.google.clientId,
      client_secret: config.google.clientSecret,
      redirect_uri: config.google.redirectUri,
      grant_type: 'authorization_code',
      code_verifier: verifier,
    }),
  })

  const payload = await res.json().catch(() => ({}))

  if (!res.ok) {
    // Google's error body is descriptive; leaking it to the client is fine here
    // because it only ever describes the code exchange, never a secret.
    throw Boom.badRequest(payload.error_description || payload.error || 'Google rejected the authorization code')
  }

  if (!payload.access_token) {
    throw Boom.badImplementation('Google returned no access token')
  }

  return payload
}

export async function fetchProfile(accessToken) {
  const res = await fetch(USERINFO_URL, {
    headers: { authorization: `Bearer ${accessToken}` },
  })

  const profile = await res.json().catch(() => ({}))

  if (!res.ok || !profile.sub) {
    throw Boom.badGateway('Could not read the Google profile for this account')
  }

  return {
    googleSub: profile.sub,
    email: profile.email,
    name: profile.name || profile.given_name || null,
    portraitUrl: profile.picture || null,
    emailVerified: profile.email_verified === true,
  }
}
