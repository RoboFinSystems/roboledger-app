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
 * SSRF is bounded by `allowedHolonUrl` (see ./validate). A future hardening
 * could pin the S3 host via env or re-mint the URL server-side.
 */

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
    upstream = await fetch(target.toString())
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

  const text = await upstream.text()
  if (text.length > MAX_HOLON_BYTES) {
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
