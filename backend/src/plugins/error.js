import Boom from '@hapi/boom'

export const errorPlugin = {
  name: 'error',
  version: '1.0.0',
  register(server) {
    server.ext('onPreResponse', async (request, h) => {
      const { response } = request

      if (!response.isBoom) return h.continue

      const status = response.output.statusCode
      if (status === 404 && request.path.startsWith('/api')) {
        const notFound = Boom.notFound(`Route ${request.method.toUpperCase()} ${request.path} not found`)
        return h.response({
          error: { statusCode: 404, message: notFound.message, path: request.path },
        }).code(404)
      }

      if (status >= 500) {
        // hapi's console listener does not reliably print event logs, and a 500
        // payload is masked to "An internal server error occurred" before it
        // reaches the client — so a server error logged only through hapi's
        // logger can be completely invisible. console.error is the one channel
        // that always shows up.
        request.log(['error', 'server'], { msg: response.message, err: response })
        console.error(`[error] ${request.method.toUpperCase()} ${request.path} -> ${response.message}`)
        if (response.data) console.error(response.data)
      }

      // Hapi attaches the failing field paths to the payload (`validation.keys`)
      // for every Joi rejection. The default response drops them, leaving the
      // client with "Invalid request payload input" and no way to know which
      // field to fix — so they are copied across here.
      //
      // `response.data` is deliberately not copied: for validation failures it
      // holds the generic default error, whose only message is the one this
      // response has already replaced with the specific reason.
      const validation = response.output.payload?.validation

      return h
        .response({
          error: {
            statusCode: status,
            message: response.message,
            ...(validation ? { validation } : {}),
          },
        })
        .code(status)
    })
  },
}
