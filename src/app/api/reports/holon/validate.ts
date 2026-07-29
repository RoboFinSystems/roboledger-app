/** 25 MB — holons are well under this; a hard cap bounds the proxy. */
export const MAX_HOLON_BYTES = 25 * 1024 * 1024

/**
 * AWS-owned hostnames are always acceptable targets: AWS controls the whole
 * `amazonaws.com` namespace, so no name under it can be pointed at VPC-internal
 * services or the link-local instance-metadata endpoint.
 */
function isAwsHost(hostname: string): boolean {
  return hostname === 'amazonaws.com' || hostname.endsWith('.amazonaws.com')
}

/**
 * Additional hosts this deployment serves bundles from: the S3 endpoint
 * override used by LocalStack in local development. Presigned URLs in staging
 * and production are signed against real AWS endpoints, which `isAwsHost`
 * already covers.
 *
 * Read per call rather than at module load so a runtime env change (and tests)
 * take effect without a rebuild.
 */
function configuredHosts(): Set<string> {
  const hosts = new Set<string>()
  const endpoint = process.env.NEXT_PUBLIC_S3_ENDPOINT_URL
  if (endpoint) {
    try {
      hosts.add(new URL(endpoint).hostname.toLowerCase())
    } catch {
      // A malformed endpoint override simply contributes no host.
    }
  }
  return hosts
}

/**
 * Guard for the holon proxy: accept a URL only if it points at a bundle host we
 * serve from AND looks like a presigned report-bundle holon (path shape + a
 * non-empty AWS signature). The host check is what keeps this from being an
 * SSRF vector — without it the proxy would fetch any URL an unauthenticated
 * caller supplied, including internal addresses. Returns the parsed URL when
 * allowed, else null.
 */
export function allowedHolonUrl(raw: string): URL | null {
  let u: URL
  try {
    u = new URL(raw)
  } catch {
    return null
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return null

  // Exact host match only — never a substring/suffix test against the whole
  // URL, or `https://evil.test/?x=.amazonaws.com` would slip through.
  const host = u.hostname.toLowerCase()
  const configured = configuredHosts()
  const isConfigured = configured.has(host)
  if (!isAwsHost(host) && !isConfigured) return null

  // Plaintext is tolerated only for an explicitly configured endpoint, which in
  // practice means LocalStack over loopback in development.
  if (u.protocol === 'http:' && !isConfigured) return null

  // .../report-bundles/<graph>/<report>/*.holon.jsonld
  if (!u.pathname.includes('/report-bundles/')) return null
  if (!u.pathname.endsWith('.holon.jsonld')) return null

  // The signature is the caller's actual capability, so require real values —
  // `?X-Amz-Signature=` with an empty value must not count as signed.
  const q = u.searchParams
  const present = (...keys: string[]) =>
    keys.some((key) => (q.get(key) ?? '') !== '')
  const signed =
    present('Signature', 'X-Amz-Signature') &&
    present('Expires', 'X-Amz-Expires') &&
    present('AWSAccessKeyId', 'X-Amz-Credential')
  if (!signed) return null

  return u
}
