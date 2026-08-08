import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { env } from './env.js'
import { getDb } from './db.js'
import { ApiError, errorBody } from './errors.js'
import { authRoutes } from './auth/routes.js'
import { meRoutes } from './me/routes.js'
import { tripsRoutes } from './trips/routes.js'
import { visitedRoutes } from './visited/routes.js'

getDb()

const app = new Hono()

app.use(
  '*',
  cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
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

app.onError((err, c) => {
  const { status, body } = errorBody(err instanceof Error ? err : new Error(String(err)))
  return c.json(body, status as 400)
})

app.notFound((c) =>
  c.json({ error: { code: 'not_found', message: 'Не найдено' } }, 404),
)

serve({ fetch: app.fetch, port: env.port }, (info) => {
  console.log(`Vandrounik API http://localhost:${info.port}/api/v1`)
})

export default app
