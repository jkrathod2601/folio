import mongoose from 'mongoose'

const { Schema } = mongoose

/**
 * Roles, in increasing order of privilege.
 *
 * This array is the single source of truth for ordering. `reader` is the
 * default and is granted to every account that completes a Google sign-in;
 * `admin` is the only elevated role today and is never self-assignable — it can
 * only be granted by the ADMIN_EMAILS list in the environment or by
 * `npm run set-role`, never by anything a client sends.
 */
export const ROLES = ['reader', 'admin']
export const DEFAULT_ROLE = 'reader'

const userSchema = new Schema(
  {
    // Google's immutable per-account id. Stable for the life of the account and
    // the only thing we key sign-in on — never the email, which the user can
    // change and which Google does not promise to keep unique.
    googleSub: { type: String, required: true, unique: true, index: true },

    email: { type: String, required: true, lowercase: true, trim: true, index: true },

    name: { type: String, trim: true, maxlength: 120 },

    username: { type: String, trim: true, lowercase: true, unique: true, sparse: true },

    portraitUrl: { type: String },

    // Google's email_verified, mirrored so the UI can badge an account without
    // a second call. Deliberately not a Folio-side trust signal.
    verified: { type: Boolean, default: false },

    role: {
      type: String,
      enum: ROLES,
      default: DEFAULT_ROLE,
      index: true,
    },

    bio: { type: String, maxlength: 500, default: '' },
    location: { type: String, maxlength: 120 },

    joined: { type: Date, default: Date.now },
  },
  { timestamps: true },
)

/** True when `role` is at least as privileged as `required`. */
userSchema.methods.hasRole = function hasRole(required) {
  return ROLES.indexOf(this.role) >= ROLES.indexOf(required)
}

userSchema.set('toJSON', {
  virtuals: true,
  transform(_doc, ret) {
    ret.id = ret._id?.toString()
    delete ret._id
    delete ret.__v
    return ret
  },
})

export const User = mongoose.models.User || mongoose.model('User', userSchema)
