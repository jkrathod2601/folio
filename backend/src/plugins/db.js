import { connect, disconnect, mongoose } from '../db/index.js'

export const dbPlugin = {
  name: 'db',
  version: '1.0.0',
  register(server) {
    server.ext('onPreStart', async () => {
      await connect()
    })

    server.ext('onPostStop', async () => {
      await disconnect()
    })

    server.decorate('server', 'mongo', () => mongoose.connection)
  },
}
