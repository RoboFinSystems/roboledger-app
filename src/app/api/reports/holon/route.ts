import type { NextRequest } from 'next/server'
import { allowedHolonUrl, MAX_HOLON_BYTES } from './validate'

/**
 * Same-origin proxy for a Report's holon JSON-LD bundle.
 *
 * The holon is served only as a presigned S3 *attachment* URL from a bucket
 * with no CORS, so a browser `fetch()` of it is blocked cross-origin. The
 * client obtains that presigned URL via the authenticated SDK
 * (`getReportDownloadUrl`, format `HOLON_JSONLD`) and hands it here; the
 * server fetches it (server→S3 isn't subject to browser CORS) and streams the
 * body back same-origin so `parseJsonld` can consume it.
 *
 * The proxy is deliberately narrow: `allowedHolonUrl` pins the target to a
 * bundle host (see ./validate), redirects are not followed so a 3xx cannot
 * walk the fetch off that host, and the body is capped while streaming. The
 * presigned signature remains the caller's capability — this endpoint grants
 * no access to a bundle whose signed URL the caller doesn't already hold.
 */

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
  let body: { url?: string }
  try {
    body = (await req.json()) as { url?: string }
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!body.url) {
    return Response.json({ error: 'Missing url' }, { status: 400 })
  }

  const target = allowedHolonUrl(body.url)
  if (!target) {
    return Response.json(
      { error: 'URL is not an allowed holon bundle URL' },
      { status: 400 }
    )
  }

  let upstream: Response
  try {
    // `manual` keeps a redirect from relocating the fetch to a host that
    // allowedHolonUrl never vetted; a 3xx simply fails the !ok check below.
    upstream = await fetch(target.toString(), { redirect: 'manual' })
  } catch (err) {
    return Response.json(
      {
        error: `Upstream fetch failed: ${
          err instanceof Error ? err.message : String(err)
        }`,
      },
      { status: 502 }
    )
  }

  if (!upstream.ok) {
    return Response.json(
      { error: `Upstream returned ${upstream.status}` },
      { status: 502 }
    )
  }

  const declaredLen = Number(upstream.headers.get('content-length') ?? '0')
  if (declaredLen > MAX_HOLON_BYTES) {
    return Response.json({ error: 'Holon exceeds size limit' }, { status: 413 })
  }

  const text = await readCapped(upstream, MAX_HOLON_BYTES)
  if (text === null) {
    return Response.json({ error: 'Holon exceeds size limit' }, { status: 413 })
  }

  return new Response(text, {
    status: 200,
    headers: {
      'content-type': 'application/ld+json; charset=utf-8',
      'cache-control': 'private, no-store',
    },
  })
}
