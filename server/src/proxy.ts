import type { Context } from 'hono'

const STRIP_RESPONSE_HEADERS = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailers',
  'transfer-encoding',
  'upgrade',
  'host',
  'content-length',
  'content-encoding',
  'content-disposition',
  // Upstream CORS must not override our Hono cors middleware.
  'access-control-allow-origin',
  'access-control-allow-methods',
  'access-control-allow-headers',
  'access-control-expose-headers',
  'access-control-allow-credentials',
  'access-control-max-age',
])

export async function proxyRequest(
  c: Context,
  targetBase: string,
  stripPrefix: string,
  extraHeaders: Record<string, string> = {},
): Promise<Response> {
  const incoming = new URL(c.req.url)
  const stripped = incoming.pathname.replace(stripPrefix, '') || '/'
  const target = `${targetBase}${stripped}${incoming.search}`

  const headers = new Headers(extraHeaders)
  const accept = c.req.header('Accept')
  if (accept) headers.set('Accept', accept)
  // Avoid double-decode issues when forwarding a decompressed body.
  headers.set('Accept-Encoding', 'identity')

  const init: RequestInit = {
    method: c.req.method,
    headers,
    redirect: 'follow',
  }
  if (c.req.method !== 'GET' && c.req.method !== 'HEAD') {
    init.body = await c.req.arrayBuffer()
  }

  const upstream = await fetch(target, init)
  const buffer = await upstream.arrayBuffer()

  const out = new Headers()
  upstream.headers.forEach((value, key) => {
    if (!STRIP_RESPONSE_HEADERS.has(key.toLowerCase())) out.set(key, value)
  })
  if (!out.has('Content-Type')) {
    out.set('Content-Type', 'application/json; charset=utf-8')
  }

  return new Response(buffer, { status: upstream.status, headers: out })
}
