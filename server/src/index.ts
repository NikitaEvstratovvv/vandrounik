import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { env } from './env.js'
import { getDb } from './db.js'
import { errorBody } from './errors.js'
import { authRoutes } from './auth/routes.js'
import { meRoutes } from './me/routes.js'
import { tripsRoutes } from './trips/routes.js'
import { visitedRoutes } from './visited/routes.js'
import { proxyRequest } from './proxy.js'

const NOMINATIM_UA = 'Vandrounik/0.1.0 (travel PWA)'

getDb()

const app = new Hono()

app.use(
  '*',
  cors({
    origin: env.corsOrigins,
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  }),
)

const v1 = new Hono()

v1.get('/health', (c) => c.json({ ok: true }))
v1.route('/auth', authRoutes)
v1.route('/me', meRoutes)
v1.route('/trips', tripsRoutes)
v1.route('/visited', visitedRoutes)

app.route('/api/v1', v1)

app.all('/api/nominatim/*', (c) =>
  proxyRequest(c, 'https://nominatim.openstreetmap.org', '/api/nominatim', {
    'User-Agent': NOMINATIM_UA,
  }),
)
app.all('/api/osrm/*', (c) =>
  proxyRequest(c, 'https://router.project-osrm.org', '/api/osrm'),
)

app.onError((err, c) => {
  const { status, body } = errorBody(err instanceof Error ? err : new Error(String(err)))
  return c.json(body, status as 400)
})

const staticRoot = env.staticDir
const indexHtmlPath = join(staticRoot, 'index.html')
const hasStatic = existsSync(indexHtmlPath)
const indexHtml = hasStatic ? readFileSync(indexHtmlPath, 'utf8') : null

if (hasStatic) {
  const staticMw = serveStatic({ root: staticRoot })
  app.use('*', async (c, next) => {
    if (c.req.path.startsWith('/api/')) return next()
    return staticMw(c, next)
  })
}

app.notFound((c) => {
  if (c.req.path.startsWith('/api/')) {
    return c.json({ error: { code: 'not_found', message: 'Не найдено' } }, 404)
  }
  if (indexHtml) return c.html(indexHtml)
  return c.json({ error: { code: 'not_found', message: 'Не найдено' } }, 404)
})

serve({ fetch: app.fetch, port: env.port }, (info) => {
  console.log(`Vandrounik http://localhost:${info.port}`)
  console.log(`API http://localhost:${info.port}/api/v1`)
  if (hasStatic) console.log(`Static ${staticRoot}`)
})

export default app
