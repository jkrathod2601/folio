import Joi from 'joi'
import Boom from '@hapi/boom'
import { adminOnly } from '../plugins/auth.js'
import { User, ROLES } from '../models/User.js'
import { detailedFailAction } from './detailedFailAction.js'

/** The shape both endpoints return, so the panel never has to know about `_id`. */
function serialize(user) {
  const doc = user.toJSON ? user.toJSON() : user
  return {
    id: doc.id ?? doc._id.toString(),
    email: doc.email,
    name: doc.name ?? null,
    username: doc.username ?? null,
    role: doc.role,
    verified: doc.verified,
    joined: doc.joined,
  }
}

/**
 * Administration endpoints.
 *
 * Every route here spreads `adminOnly`, so a reader calling any of them gets a
 * 403 from the auth scope before the handler runs. There is no in-handler role
 * check, and that is the point: the requirement lives in the route definition,
 * so adding a new admin endpoint cannot accidentally ship it unprotected.
 */
export default {
  name: 'admin-routes',
  version: '1.0.0',
  register(server) {
    server.route({
      method: 'GET',
      path: '/users',
      options: {
        ...adminOnly,
        // The handler caps the query itself; this is here so the bound is
        // visible to anyone reading the route table.
        description: 'List accounts (admin only)',
      },
      handler: async () => {
        const users = await User.find({}, { googleSub: 0 })
          .sort({ createdAt: -1 })
          .limit(100)

        return { users: users.map(serialize) }
      },
    })

    server.route({
      method: 'PATCH',
      path: '/users/{id}/role',
      options: {
        ...adminOnly,
        description: "Set an account's role (admin only)",
        validate: {
          params: Joi.object({
            // A malformed id is a client bug, not a missing record — rejecting it
            // here turns a would-be CastError 500 into a clean 400.
            id: Joi.string().hex().length(24).required(),
          }),
          payload: Joi.object({
            role: Joi.string().valid(...ROLES).required(),
          }),
          failAction: detailedFailAction,
        },
      },
      handler: async (request) => {
        const { id } = request.params
        const { role } = request.payload

        const user = await User.findById(id)
        if (!user) throw Boom.notFound('No such account')

        if (user.role === role) return { user: serialize(user) }

        // The one genuinely dangerous operation in this panel. Admins are
        // bootstrapped from ADMIN_EMAILS and can also be created here, so
        // demoting the last admin is unrecoverable through the UI: everyone
        // left loses the ability to promote anyone back.
        if (user.role === 'admin' && role !== 'admin') {
          const admins = await User.countDocuments({ role: 'admin' })
          if (admins <= 1) {
            throw Boom.forbidden(
              'This is the last admin account. Promote someone else first.',
            )
          }
        }

        user.role = role
        await user.save()

        return { user: serialize(user) }
      },
    })
  },
}
