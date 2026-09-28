import { createHash, randomUUID } from 'node:crypto'
import Jwt from '@hapi/jwt'
import Boom from '@hapi/boom'
import { config } from '../config/index.js'
import { Session } from '../models/Session.js'

/** Refresh tokens are persisted hashed; this is the only representation stored. */
export function hashToken(token) {
  return createHash('sha256').update(token).digest('hex')
}

/**
 * @hapi/jwt puts `iss`/`iat`/`exp` in the payload only if you pass them *in the
 * payload object*. Supplying them in the generate options looks right and is
 * silently ignored — the token then has no `exp` at all, and `verifyTime` only
 * checks the payload, so it never expires. Same for `iss`: the verify side
 * rejects a token whose payload is missing it.
 */
function claims(user, { typ, family }, ttlMs) {
  const nowSec = Math.floor(Date.now() / 1000)
  return {
    sub: user._id.toString(),
    iss: config.auth.issuer,
    typ,
    // A signed JWT is deterministic: same payload + same key + same second
    // produces the identical string. Without a jti, two sessions created for the
    // same user inside one second are the same token, and the unique index on
    // tokenHash rejects the second one. This also gives every refresh token its
    // own identity for revocation and audit.
    jti: randomUUID(),
    ...(family ? { family } : {}),
    iat: nowSec,
    exp: nowSec + Math.floor(ttlMs / 1000),
  }
}

function sign(payload, key) {
  return Jwt.token.generate(payload, { key, algorithm: 'HS256', noTimestamp: true })
}

/**
 * `Jwt.token.verify` takes decode *artifacts* and returns nothing, so the
 * payload has to be read off the artifacts it was given.
 */
function verifyJwt(raw, key, expectedType) {
  let artifacts
  try {
    artifacts = Jwt.token.decode(raw)
  } catch {
    throw Boom.unauthorized('Malformed token')
  }

  try {
    Jwt.token.verify(artifacts, key, { iss: config.auth.issuer })
  } catch (err) {
    throw Boom.unauthorized(`Token rejected: ${err.message}`)
  }

  const payload = artifacts.decoded.payload

  if (payload.typ !== expectedType) {
    throw Boom.unauthorized(`Expected a ${expectedType} token`)
  }

  return payload
}

export function signAccessToken(user) {
  return sign(claims(user, { typ: 'access' }, config.auth.accessTtlMs), config.auth.accessSecret)
}

export function signRefreshToken(user, family) {
  return sign(
    claims(user, { typ: 'refresh', family }, config.auth.refreshTtlMs),
    config.auth.refreshSecret,
  )
}

export function verifyAccessToken(token) {
  return verifyJwt(token, config.auth.accessSecret, 'access')
}

export function verifyRefreshToken(token) {
  return verifyJwt(token, config.auth.refreshSecret, 'refresh')
}

export async function issueSession(user, { userAgent, ip, family = randomUUID() } = {}) {
  const token = signRefreshToken(user, family)

  await Session.create({
    userId: user._id,
    tokenHash: hashToken(token),
    family,
    expiresAt: new Date(Date.now() + config.auth.refreshTtlMs),
    userAgent: userAgent?.slice(0, 300),
    ip,
  })

  return token
}

/**
 * Redeems a refresh token for a fresh pair, rotating the stored one.
 *
 * An unknown or already-redeemed token is treated as a replay and nukes the whole
 * token family, logging out every device sharing it. That is the standard
 * response to a leaked cookie: the attacker and the victim both get logged out,
 * and the user re-authenticates.
 */
export async function rotateSession(rawToken, meta = {}) {
  const payload = verifyRefreshToken(rawToken)
  const tokenHash = hashToken(rawToken)

  const session = await Session.findOne({ tokenHash }).populate('userId')

  if (!session || String(session.userId?._id) !== payload.sub) {
    throw Boom.unauthorized('Refresh token not recognised')
  }

  if (session.rotatedAt || session.revokedAt) {
    await Session.updateMany(
      { family: session.family },
      { $set: { revokedAt: new Date(), revokedReason: 'reuse_detected' } },
    )
    throw Boom.unauthorized('Refresh token already used — session revoked')
  }

  if (session.expiresAt <= new Date()) {
    await Session.updateOne({ _id: session._id }, { $set: { revokedAt: new Date(), revokedReason: 'expired' } })
    throw Boom.unauthorized('Refresh token expired')
  }

  session.rotatedAt = new Date()
  await session.save()

  const user = session.userId

  // The replacement must stay in the same family, or a later replay could not
  // be traced back to the rest of the chain.
  return { user, refreshToken: await issueSession(user, { ...meta, family: session.family }) }
}

export async function revokeSession(rawToken, reason = 'logout') {
  const tokenHash = hashToken(rawToken)
  const result = await Session.updateOne(
    { tokenHash, revokedAt: null, rotatedAt: null },
    { $set: { revokedAt: new Date(), revokedReason: reason } },
  )
  return result.modifiedCount > 0
}

export async function revokeAllForUser(userId, reason = 'logout_all') {
  const result = await Session.updateMany(
    { userId, revokedAt: null },
    { $set: { revokedAt: new Date(), revokedReason: reason } },
  )
  return result.modifiedCount
}

