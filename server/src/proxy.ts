import type { Context } from 'hono'

const HOP_BY_HOP = new Set([
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

  const init: RequestInit = {
    method: c.req.method,
    headers,
    redirect: 'follow',
  }
  if (c.req.method !== 'GET' && c.req.method !== 'HEAD') {
    init.body = await c.req.arrayBuffer()
  }

  const upstream = await fetch(target, init)
  const out = new Headers()
  upstream.headers.forEach((value, key) => {
    if (!HOP_BY_HOP.has(key.toLowerCase())) out.set(key, value)
  })
  return new Response(upstream.body, { status: upstream.status, headers: out })
}
