/**
 * Client IP resolution for requests arriving through a proxy chain.
 *
 * Two sources, in order of trustworthiness.
 *
 * `CloudFront-Viewer-Address` is CloudFront's own record of the address it
 * accepted the connection from. CloudFront sets it and overwrites anything the
 * caller sent, so it cannot be forged, and it does not depend on knowing how
 * many proxies sit in front of the app. When it is present, it is the answer.
 *
 * `X-Forwarded-For` is the fallback for requests that did not arrive through
 * CloudFront. It is a list each proxy appends to and the caller can seed, so
 * reading the *leftmost* entry (the usual mistake) reads whatever the caller
 * supplied and lets anyone mint a fresh identity per request. We count in from
 * the right by `TRUSTED_PROXY_HOPS` instead, trusting only the entries appended
 * by infrastructure we control.
 *
 * Why the header is preferred rather than used as a cross-check: behind
 * CloudFront the real chain is `<viewer>, <App Runner ingress>` — two entries,
 * not one — so a hop count of 1 resolves to infrastructure rather than the
 * viewer, collapsing every client behind an edge into a single rate-limit
 * bucket. Counting hops means guessing that topology correctly; the header just
 * states it. The default of 1 is kept for the fallback path because that path
 * only runs when the request did *not* come through CloudFront, where a second
 * appended hop should not be assumed.
 */
const DEFAULT_TRUSTED_PROXY_HOPS = 1

function trustedProxyHops(): number {
  const configured = Number(process.env.TRUSTED_PROXY_HOPS)
  return Number.isInteger(configured) && configured > 0
    ? configured
    : DEFAULT_TRUSTED_PROXY_HOPS
}

/**
 * CloudFront sends `<address>:<port>` for both IPv4 (`198.51.100.10:46532`)
 * and IPv6 (`2a03:2880:f10c:83:face:b00c:0:25de:14383`), so a port is always
 * present and always follows the final colon.
 */
function cloudfrontViewerIp(request: Request): string | undefined {
  const raw = request.headers.get('cloudfront-viewer-address')?.trim()
  if (!raw) return undefined

  const portSeparator = raw.lastIndexOf(':')
  const address = portSeparator === -1 ? raw : raw.slice(0, portSeparator)
  return address || undefined
}

/**
 * Extract the client IP from request headers, or undefined when no usable
 * header is present (e.g. a direct request in local development).
 */
export function getClientIp(request: Request): string | undefined {
  const viewerIp = cloudfrontViewerIp(request)
  if (viewerIp) return viewerIp

  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    const hops = forwardedFor
      .split(',')
      .map((hop) => hop.trim())
      .filter(Boolean)
    if (hops.length > 0) {
      // A chain shorter than the configured hop count means the request didn't
      // come through the expected proxies; the leftmost entry is the best
      // available answer and is no worse than the old behaviour.
      return hops[hops.length - trustedProxyHops()] ?? hops[0]
    }
  }

  // Set by the platform rather than forwarded from the caller.
  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp.trim()

  return undefined
}
