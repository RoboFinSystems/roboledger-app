/**
 * Client IP resolution for requests arriving through a proxy chain.
 *
 * `X-Forwarded-For` is a list each proxy appends to, and the caller can send
 * their own to begin with — so only the entries appended by infrastructure we
 * control are trustworthy. Reading the *leftmost* entry (the usual mistake)
 * reads whatever the caller supplied, which lets anyone mint a fresh identity
 * per request and walk straight through a rate limit. We count in from the
 * right instead: CloudFront appends the viewer IP it actually saw, so with one
 * trusted proxy the last entry is the real client.
 *
 * `TRUSTED_PROXY_HOPS` must match the number of proxies in front of this app
 * that append to the header. Set it too high and unrelated clients collapse
 * into one bucket; too low and the value becomes caller-controlled again.
 */
const DEFAULT_TRUSTED_PROXY_HOPS = 1

function trustedProxyHops(): number {
  const configured = Number(process.env.TRUSTED_PROXY_HOPS)
  return Number.isInteger(configured) && configured > 0
    ? configured
    : DEFAULT_TRUSTED_PROXY_HOPS
}

/**
 * Extract the client IP from request headers, or undefined when no proxy
 * header is present (e.g. a direct request in local development).
 */
export function getClientIp(request: Request): string | undefined {
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

/**
 * TEMPORARY DIAGNOSTIC — remove once TRUSTED_PROXY_HOPS is confirmed.
 *
 * `getClientIp` counts in from the right by a hop count we have assumed rather
 * than measured, and being wrong is user-visible in both directions: too low
 * and the value is caller-controlled again, too high and every viewer behind a
 * CloudFront edge collapses into one rate-limit bucket and real users start
 * getting 429s. The position is a constant for this architecture, so a single
 * observation of a real request settles it permanently.
 *
 * Emits one structured line per instance, on the first request that carries a
 * forwarded chain. Note this records IP addresses to the application log; that
 * is why it is once-per-instance and why it should be deleted after reading.
 */
let proxyChainLogged = false

export function logProxyChainOnce(request: Request): void {
  if (proxyChainLogged) return

  const forwardedFor = request.headers.get('x-forwarded-for')
  if (!forwardedFor) return

  const hops = forwardedFor
    .split(',')
    .map((hop) => hop.trim())
    .filter(Boolean)
  if (hops.length === 0) return

  proxyChainLogged = true

  console.info(
    JSON.stringify({
      event: 'proxy_chain_observed',
      // The chain as received, so the trustworthy position can be read off it.
      forwardedFor: hops,
      hopCount: hops.length,
      configuredTrustedHops: trustedProxyHops(),
      resolvedClientIp: getClientIp(request),
      // `via` naming CloudFront confirms the request came through the
      // distribution rather than straight to the App Runner origin.
      via: request.headers.get('via'),
      // If present, this is CloudFront's own view of the viewer address and is
      // authoritative — it would let us drop hop counting altogether.
      cloudfrontViewerAddress: request.headers.get('cloudfront-viewer-address'),
      xRealIp: request.headers.get('x-real-ip'),
    })
  )
}
