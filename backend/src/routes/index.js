import healthRoutes from './health.js'
import authRoutes from './auth.js'
import adminRoutes from './admin.js'
import bookRoutes from './books.js'
import { storyEntityRoutes } from './bookEntities.js'
import pageRoutes from './pages.js'

export const routes = [
  { plugin: healthRoutes, prefix: '/api' },
  { plugin: authRoutes, prefix: '/api/auth' },
  { plugin: adminRoutes, prefix: '/api/admin' },
  { plugin: bookRoutes, prefix: '/api/books' },
  // Same prefix as the book routes, so these resolve to /api/books/:id/characters
  // and friends. Registering them under their own prefix would have duplicated
  // the `/:id` ownership check that both need.
  { plugin: storyEntityRoutes, prefix: '/api/books' },
  { plugin: pageRoutes, prefix: '/api/books' },
]
