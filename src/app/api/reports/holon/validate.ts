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

/** The deployment's region; presigned URLs may use its regional S3 host. */
function deploymentRegion(): string {
  return (process.env.AWS_REGION || 'us-east-1').trim().toLowerCase()
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
 * The S3 endpoint override used by LocalStack in local development, matched
 * on protocol, host and port together; null when none is configured.
 */
function endpointOverride(): URL | null {
  const endpoint = process.env.NEXT_PUBLIC_S3_ENDPOINT_URL
  if (!endpoint) return null
  try {
    return new URL(endpoint)
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
  const override = endpointOverride()
  const isOverride =
    override !== null &&
    u.protocol === override.protocol &&
    u.host.toLowerCase() === override.host.toLowerCase()

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

  // Plaintext and explicit ports are tolerated only for the override.
  if (!bucket || u.protocol !== 'https:' || u.port !== '') return null

  const region = deploymentRegion()
  if (
    host === `${bucket}.s3.amazonaws.com` ||
    host === `${bucket}.s3.${region}.amazonaws.com`
  ) {
    return path
  }

  if (
    (host === 's3.amazonaws.com' || host === `s3.${region}.amazonaws.com`) &&
    path.startsWith(`${bucket}/`)
  ) {
    return path.slice(bucket.length + 1)
  }

  return null
}

/**
 * The origin the proxy may fetch from for this URL, built only from server
 * configuration (bucket, region, endpoint override) and never from the
 * request; null when the host is not one of them.
 */
function trustedOrigin(u: URL): string | null {
  const override = endpointOverride()
  if (
    override !== null &&
    u.protocol === override.protocol &&
    u.host.toLowerCase() === override.host.toLowerCase()
  ) {
    return override.origin
  }
  const bucket = reportBundleBucket()
  if (!bucket) return null
  const region = deploymentRegion()
  const hosts = [
    `${bucket}.s3.amazonaws.com`,
    `${bucket}.s3.${region}.amazonaws.com`,
    's3.amazonaws.com',
    `s3.${region}.amazonaws.com`,
  ]
  const host = hosts.find((h) => h === u.hostname.toLowerCase())
  return host ? `https://${host}` : null
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
  if (key.split('/').some((seg) => seg === '..' || seg === '.')) return null

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

  // Rebuild the target on a configured origin so the host that is fetched
  // never comes from the request. Path and query are kept byte for byte: the
  // presigned signature covers them.
  const origin = trustedOrigin(u)
  if (!origin) return null
  return {
    url: new URL(`${origin}${u.pathname}${u.search}`),
    contentType: RENDERABLE_ARTIFACTS[suffix],
  }
}
