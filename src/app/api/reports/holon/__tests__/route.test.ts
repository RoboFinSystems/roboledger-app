import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from '../route'

const BUCKET = 'robosystems-000000000000-user-test'
const SIG = '?X-Amz-Signature=a&X-Amz-Expires=1&X-Amz-Credential=a'
const HOLON = `https://${BUCKET}.s3.amazonaws.com/report-bundles/g/r/g1.holon.jsonld${SIG}`
const TAVI = HOLON.replace('.holon.jsonld', '.tavi.json')
const HTML = '<script>document.title="x"</script>'

function appCall(url: string, headers: Record<string, string> = {}) {
  return new Request('https://app.test/api/reports/holon', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: 'Bearer session-token',
      ...headers,
    },
    body: JSON.stringify({ url }),
  })
}

function upstream(body: string, contentType = 'text/html') {
  const fetchMock = vi.fn(
    async () =>
      new Response(body, {
        status: 200,
        headers: { 'content-type': contentType },
      })
  )
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function expectInert(res: Response) {
  expect(res.headers.get('x-content-type-options')).toBe('nosniff')
  expect(res.headers.get('content-security-policy')).toBe(
    "default-src 'none'; sandbox"
  )
}

describe('POST /api/reports/holon', () => {
  beforeEach(() => {
    vi.stubEnv('REPORT_BUNDLE_BUCKET', BUCKET)
    vi.stubEnv('NEXT_PUBLIC_S3_ENDPOINT_URL', '')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('types the response by the artifact suffix, never by upstream', async () => {
    upstream(HTML, 'text/html')
    const holon = await POST(appCall(HOLON) as never)
    expect(holon.status).toBe(200)
    expect(holon.headers.get('content-type')).toBe(
      'application/ld+json; charset=utf-8'
    )
    expectInert(holon)

    upstream('{}', 'text/html')
    const tavi = await POST(appCall(TAVI) as never)
    expect(tavi.headers.get('content-type')).toBe(
      'application/json; charset=utf-8'
    )
    expectInert(tavi)
  })

  it('returns 415 for a body that is not JSON, without fetching', async () => {
    const fetchMock = upstream('{}')
    const req = new Request('https://app.test/api/reports/holon', {
      method: 'POST',
      headers: {
        'content-type': 'text/plain',
        authorization: 'Bearer session-token',
      },
      body: `{"url":"${HOLON}","x":"="}`,
    })
    const res = await POST(req as never)
    expect(res.status).toBe(415)
    expectInert(res)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('returns 401 without a bearer, without fetching', async () => {
    const fetchMock = upstream('{}')
    for (const authorization of ['', 'Basic abc', 'Bearer ']) {
      const res = await POST(appCall(HOLON, { authorization }) as never)
      expect(res.status, authorization).toBe(401)
      expectInert(res)
    }
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('accepts JSON with a charset parameter', async () => {
    upstream('{}')
    const res = await POST(
      appCall(HOLON, {
        'content-type': 'application/json; charset=utf-8',
      }) as never
    )
    expect(res.status).toBe(200)
  })

  it('refuses a target outside the bundle bucket, without fetching', async () => {
    const fetchMock = upstream(HTML)
    for (const host of [
      'abc123.execute-api.us-east-1.amazonaws.com',
      'attacker-bucket.s3.amazonaws.com',
    ]) {
      const res = await POST(
        appCall(
          `https://${host}/report-bundles/g/r/x.holon.jsonld${SIG}`
        ) as never
      )
      expect(res.status, host).toBe(400)
      expectInert(res)
    }
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('refuses a non-string url', async () => {
    const req = new Request('https://app.test/api/reports/holon', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer t',
      },
      body: JSON.stringify({ url: { href: HOLON } }),
    })
    const res = await POST(req as never)
    expect(res.status).toBe(400)
  })

  it('does not follow redirects and reports an upstream failure inertly', async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(null, {
          status: 302,
          headers: { location: 'https://evil.test/' },
        })
    )
    vi.stubGlobal('fetch', fetchMock)
    const res = await POST(appCall(HOLON) as never)
    expect(fetchMock).toHaveBeenCalledWith(HOLON, { redirect: 'manual' })
    expect(res.status).toBe(502)
    expectInert(res)
  })
})
