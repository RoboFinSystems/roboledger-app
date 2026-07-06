/** 25 MB — holons are well under this; a hard cap bounds the proxy. */
export const MAX_HOLON_BYTES = 25 * 1024 * 1024

/**
 * Guard for the holon proxy: accept a URL only if it looks like a presigned
 * report-bundle holon (path shape + AWS signature params). Keeps the proxy
 * from being a general SSRF open-proxy. The presigned URL is a signed,
 * short-lived capability the client already holds, so proxying it is not a
 * privilege escalation. Returns the parsed URL when allowed, else null.
 */
export function allowedHolonUrl(raw: string): URL | null {
  let u: URL
  try {
    u = new URL(raw)
  } catch {
    return null
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return null
  // .../report-bundles/<graph>/<report>/*.holon.jsonld
  if (!u.pathname.includes('/report-bundles/')) return null
  if (!u.pathname.endsWith('.holon.jsonld')) return null
  const q = u.searchParams
  const signed =
    (q.has('Signature') || q.has('X-Amz-Signature')) &&
    (q.has('Expires') || q.has('X-Amz-Expires')) &&
    (q.has('AWSAccessKeyId') || q.has('X-Amz-Credential'))
  if (!signed) return null
  return u
}
