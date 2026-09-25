/** 25 MB — holons and Tavi models are well under this; a hard cap bounds the proxy. */
export const MAX_HOLON_BYTES = 25 * 1024 * 1024

/**
 * The report artifacts the proxy will fetch, keyed by the suffix of their
 * bundle key, with the content type the proxy answers with. The type comes
 * from this table, never from the upstream response. Anything else under the
 * same prefix (the flat JSON-LD, the XBRL zip) is a download, not something
 * the page renders.
 */
export const RENDERABLE_ARTIFACTS = {
  '.holon.jsonld': 'application/ld+json',
  '.tavi.json': 'application/json',
} as const

export type RenderableSuffix = keyof typeof RENDERABLE_ARTIFACTS

export const RENDERABLE_SUFFIXES = Object.keys(
  RENDERABLE_ARTIFACTS
) as RenderableSuffix[]

/** Every report bundle key starts with this prefix inside the bucket. */
const BUNDLE_KEY_PREFIX = 'report-bundles/'

/** A region label in an S3 endpoint host (`us-east-1`, `eu-west-2`, …). */
const REGION = '[a-z0-9-]+'

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * The bucket that holds report bundles, from the server-only runtime env.
 * Read per call so a runtime change (and tests) take effect without a rebuild.
 */
function reportBundleBucket(): string | null {
  const bucket = process.env.REPORT_BUNDLE_BUCKET?.trim().toLowerCase()
  return bucket ? bucket : null
}

/**
 * The S3 endpoint override used by LocalStack in local development, as a
 * lowercase `host[:port]`, or null when none is configured.
 */
function endpointOverrideHost(): string | null {
  const endpoint = process.env.NEXT_PUBLIC_S3_ENDPOINT_URL
  if (!endpoint) return null
  try {
    return new URL(endpoint).host.toLowerCase()
  } catch {
    return null
  }
}

/**
 * The object key the URL addresses, if its host is one this deployment serves
 * report bundles from. Returns null for any other host.
 *
 * With a bucket configured, only that bucket is accepted, in the AWS forms a
 * presigned URL takes: virtual-hosted (`<bucket>.s3[.<region>].amazonaws.com`)
 * and path-style (`s3[.<region>].amazonaws.com/<bucket>/…`), plus path-style
 * against the endpoint override. Without one, only the endpoint override is
 * accepted — and production builds carry no override, so they accept nothing.
 */
function bundleObjectKey(u: URL): string | null {
  const host = u.hostname.toLowerCase()
  const bucket = reportBundleBucket()
  const override = endpointOverrideHost()
  const isOverride = override !== null && u.host.toLowerCase() === override

  // The path always begins with `/`; strip it to get the key (virtual-hosted)
  // or `<bucket>/<key>` (path-style).
  const path = u.pathname.slice(1)

  if (isOverride) {
    const slash = path.indexOf('/')
    if (slash <= 0) return null
    const pathBucket = path.slice(0, slash)
    if (bucket && pathBucket !== bucket) return null
    return path.slice(slash + 1)
  }

  if (!bucket || u.protocol !== 'https:' || u.port !== '') return null

  const virtualHosted = new RegExp(
    `^${escapeRegExp(bucket)}\\.s3(\\.${REGION})?\\.amazonaws\\.com$`
  )
  if (virtualHosted.test(host)) return path

  const pathStyle = new RegExp(`^s3(\\.${REGION})?\\.amazonaws\\.com$`)
  if (pathStyle.test(host) && path.startsWith(`${bucket}/`)) {
    return path.slice(bucket.length + 1)
  }

  return null
}

export interface AllowedArtifact {
  url: URL
  contentType: (typeof RENDERABLE_ARTIFACTS)[RenderableSuffix]
}

/**
 * Guard for the report-artifact proxy: accept a URL only if it addresses a
 * renderable object under the report-bundle prefix of the report-bundle
 * bucket, and carries a non-empty presigned signature. Returns the parsed URL
 * and the content type to answer with, else null.
 */
export function allowedHolonUrl(raw: string): AllowedArtifact | null {
  let u: URL
  try {
    u = new URL(raw)
  } catch {
    return null
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return null
  if (u.username || u.password) return null

  const key = bundleObjectKey(u)
  if (key === null || !key.startsWith(BUNDLE_KEY_PREFIX)) return null

  const suffix = RENDERABLE_SUFFIXES.find((s) => key.endsWith(s))
  if (!suffix) return null

  // The signature is the caller's actual capability, so require real values —
  // `?X-Amz-Signature=` with an empty value must not count as signed.
  const q = u.searchParams
  const present = (...keys: string[]) =>
    keys.some((k) => (q.get(k) ?? '') !== '')
  const signed =
    present('Signature', 'X-Amz-Signature') &&
    present('Expires', 'X-Amz-Expires') &&
    present('AWSAccessKeyId', 'X-Amz-Credential')
  if (!signed) return null

  return { url: u, contentType: RENDERABLE_ARTIFACTS[suffix] }
}
