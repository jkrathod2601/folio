import mongoose from 'mongoose'

const { Schema } = mongoose

/**
 * One row per issued refresh token. The JWT itself is never stored — only its
 * SHA-256 hash — so a database leak cannot be replayed as a session.
 *
 * Refresh tokens rotate: redeeming one issues a new one in the same `family` and
 * marks the old row `rotatedAt`. Presenting an already-rotated token is the
 * signature of a stolen cookie, so the entire family is revoked on sight.
 */
const sessionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    tokenHash: { type: String, required: true, unique: true },

    family: { type: String, required: true, index: true },

    expiresAt: { type: Date, required: true },

    rotatedAt: { type: Date, default: null },
    revokedAt: { type: Date, default: null },
    revokedReason: { type: String, default: null },

    userAgent: { type: String, maxlength: 300 },
    ip: { type: String, maxlength: 64 },
  },
  { timestamps: true },
)

// Mongo reaps expired sessions on its own; no cron needed.
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

sessionSchema.statics.isLive = function isLive(session) {
  return Boolean(session) && !session.revokedAt && !session.rotatedAt && session.expiresAt > new Date()
}

export const Session = mongoose.models.Session || mongoose.model('Session', sessionSchema)
