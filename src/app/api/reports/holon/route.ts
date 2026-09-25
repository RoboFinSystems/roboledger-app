import type { NextRequest } from 'next/server'
import { allowedHolonUrl, MAX_HOLON_BYTES } from './validate'

/**
 * Same-origin proxy for a Report's renderable artifact: the Tavi compiled
 * model or the holon JSON-LD bundle.
 *
 * Both are served only as presigned S3 *attachment* URLs from a bucket with
 * no CORS, so a browser `fetch()` of either is blocked cross-origin. The
 * client obtains the presigned URL via the authenticated SDK
 * (`getReportDownloadUrl`, format `TAVI` or `HOLON_JSONLD`) and hands it
 * here; the server fetches it (server→S3 isn't subject to browser CORS) and
 * streams the body back same-origin so `parseReportDocument` can consume it.
 *
 * The proxy is deliberately narrow. It answers only the app's own JSON call
 * carrying the session bearer; `allowedHolonUrl` pins the target to the
 * report-bundle objects (see ./validate); redirects are not followed; the body
 * is capped while streaming; and the response is typed by the artifact suffix
 * and served inert. The presigned signature remains the caller's capability.
 */

/** Headers on every response from this route, success or refusal. */
const INERT_HEADERS = {
  'x-content-type-options': 'nosniff',
  'content-security-policy': "default-src 'none'; sandbox",
  'cache-control': 'private, no-store',
} as const

function jsonError(error: string, status: number): Response {
  return Response.json({ error }, { status, headers: INERT_HEADERS })
}

function isJsonRequest(req: Request): boolean {
  const mediaType = (req.headers.get('content-type') ?? '')
    .split(';')[0]
    .trim()
    .toLowerCase()
  return mediaType === 'application/json'
}

function hasBearer(req: Request): boolean {
  return /^Bearer\s+\S+/i.test(req.headers.get('authorization') ?? '')
}

/**
 * Read the body while counting bytes, aborting as soon as the cap is exceeded
 * so an oversized (or endless) upstream can't be buffered into memory. Returns
 * null when the cap is hit.
 */
async function readCapped(
  upstream: Response,
  maxBytes: number
): Promise<string | null> {
  if (!upstream.body) return ''
  const reader = upstream.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.byteLength
    if (total > maxBytes) {
      await reader.cancel()
      return null
    }
    chunks.push(value)
  }
  const joined = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    joined.set(chunk, offset)
    offset += chunk.byteLength
  }
  return new TextDecoder().decode(joined)
}

export async function POST(req: NextRequest) {
  if (!isJsonRequest(req)) {
    return jsonError('Unsupported content type', 415)
  }
  if (!hasBearer(req)) {
    return jsonError('Unauthorized', 401)
  }

  let body: { url?: unknown }
  try {
    body = (await req.json()) as { url?: unknown }
  } catch {
    return jsonError('Invalid request body', 400)
  }

  if (typeof body?.url !== 'string' || !body.url) {
    return jsonError('Missing url', 400)
  }

  const target = allowedHolonUrl(body.url)
  if (!target) {
    return jsonError('URL is not an allowed report artifact URL', 400)
  }

  let upstream: Response
  try {
    // `manual` keeps a redirect from relocating the fetch to a host that
    // allowedHolonUrl never vetted; a 3xx simply fails the !ok check below.
    upstream = await fetch(target.url.toString(), { redirect: 'manual' })
  } catch {
    return jsonError('Upstream fetch failed', 502)
  }

  if (!upstream.ok) {
    return jsonError(`Upstream returned ${upstream.status}`, 502)
  }

  const declaredLen = Number(upstream.headers.get('content-length') ?? '0')
  if (declaredLen > MAX_HOLON_BYTES) {
    return jsonError('Report artifact exceeds size limit', 413)
  }

  const text = await readCapped(upstream, MAX_HOLON_BYTES)
  if (text === null) {
    return jsonError('Report artifact exceeds size limit', 413)
  }

  return new Response(text, {
    status: 200,
    headers: {
      ...INERT_HEADERS,
      'content-type': `${target.contentType}; charset=utf-8`,
    },
  })
}
