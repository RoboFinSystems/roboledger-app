import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { allowedHolonUrl } from '../validate'

const BUCKET = 'robosystems-000000000000-user-test'
const KEY = 'report-bundles/kg19f333/rpt_01ABC/g1.holon.jsonld'
const SIG = 'X-Amz-Credential=cred&X-Amz-Signature=sig&X-Amz-Expires=300'

// A realistic LocalStack presigned holon URL (shape mirrors the live one).
const LOCAL =
  `http://localhost:4566/${BUCKET}/${KEY}` +
  '?response-content-type=application%2Fld%2Bjson&AWSAccessKeyId=test&Signature=abc%3D&Expires=1783315210'

const VIRTUAL_GLOBAL = `https://${BUCKET}.s3.amazonaws.com/${KEY}?${SIG}`
const VIRTUAL_REGIONAL = `https://${BUCKET}.s3.us-east-1.amazonaws.com/${KEY}?${SIG}`
const PATH_GLOBAL = `https://s3.amazonaws.com/${BUCKET}/${KEY}?${SIG}`
const PATH_REGIONAL = `https://s3.us-east-1.amazonaws.com/${BUCKET}/${KEY}?${SIG}`

describe('allowedHolonUrl', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_S3_ENDPOINT_URL', '')
    vi.stubEnv('REPORT_BUNDLE_BUCKET', BUCKET)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  describe('the configured bucket', () => {
    it('accepts virtual-hosted and path-style, global and regional', () => {
      for (const url of [
        VIRTUAL_GLOBAL,
        VIRTUAL_REGIONAL,
        PATH_GLOBAL,
        PATH_REGIONAL,
      ]) {
        expect(allowedHolonUrl(url), url).not.toBeNull()
      }
    })

    it('types the artifact by its suffix', () => {
      expect(allowedHolonUrl(VIRTUAL_GLOBAL)?.contentType).toBe(
        'application/ld+json'
      )
      const tavi = VIRTUAL_GLOBAL.replace('.holon.jsonld', '.tavi.json')
      expect(allowedHolonUrl(tavi)?.contentType).toBe('application/json')
    })

    it('accepts SigV2-style signature params', () => {
      const v2 = `https://${BUCKET}.s3.amazonaws.com/${KEY}?AWSAccessKeyId=a&Signature=s&Expires=1`
      expect(allowedHolonUrl(v2)).not.toBeNull()
    })

    it('matches the bucket name case-insensitively in the host', () => {
      vi.stubEnv('REPORT_BUNDLE_BUCKET', ` ${BUCKET.toUpperCase()} `)
      expect(allowedHolonUrl(VIRTUAL_GLOBAL)).not.toBeNull()
    })
  })

  describe('host pinning', () => {
    it('rejects any other bucket, in either form', () => {
      for (const url of [
        `https://attacker-bucket.s3.amazonaws.com/${KEY}?${SIG}`,
        `https://s3.amazonaws.com/attacker-bucket/${KEY}?${SIG}`,
        `https://${BUCKET}-x.s3.amazonaws.com/${KEY}?${SIG}`,
        `https://x${BUCKET}.s3.amazonaws.com/${KEY}?${SIG}`,
        `https://s3.amazonaws.com/${BUCKET}x/${KEY}?${SIG}`,
      ]) {
        expect(allowedHolonUrl(url), url).toBeNull()
      }
    })

    it('rejects other AWS services', () => {
      for (const host of [
        'abc123.execute-api.us-east-1.amazonaws.com',
        'internal-lb-1.us-east-1.elb.amazonaws.com',
        `${BUCKET}.s3-website-us-east-1.amazonaws.com`,
        `${BUCKET}.s3.amazonaws.com.evil.test`,
      ]) {
        expect(
          allowedHolonUrl(`https://${host}/${KEY}?${SIG}`),
          host
        ).toBeNull()
      }
    })

    it('rejects plaintext, explicit ports and userinfo on AWS hosts', () => {
      expect(
        allowedHolonUrl(VIRTUAL_GLOBAL.replace('https:', 'http:'))
      ).toBeNull()
      expect(
        allowedHolonUrl(VIRTUAL_GLOBAL.replace('.com/', '.com:8443/'))
      ).toBeNull()
      expect(
        allowedHolonUrl(VIRTUAL_GLOBAL.replace('https://', 'https://u:p@'))
      ).toBeNull()
    })

    it('rejects internal addresses and hosts that merely mention AWS', () => {
      for (const url of [
        `http://169.254.169.254/${BUCKET}/${KEY}?${SIG}`,
        `http://10.0.0.5/${BUCKET}/${KEY}?${SIG}`,
        `https://evil.test/${KEY}?${SIG}&pad=.amazonaws.com`,
      ]) {
        expect(allowedHolonUrl(url), url).toBeNull()
      }
    })

    it('refuses every AWS URL when no bucket is configured', () => {
      vi.stubEnv('REPORT_BUNDLE_BUCKET', '')
      for (const url of [VIRTUAL_GLOBAL, PATH_REGIONAL]) {
        expect(allowedHolonUrl(url), url).toBeNull()
      }
    })
  })

  describe('key pinning', () => {
    it('rejects objects outside the report-bundles prefix', () => {
      for (const key of [
        'user-staging/kg1/x.holon.jsonld',
        'graph-backups/report-bundles/x.holon.jsonld',
        'x/report-bundles/g/r/x.holon.jsonld',
        'report-bundles/../user-staging/x.holon.jsonld',
      ]) {
        const url = `https://${BUCKET}.s3.amazonaws.com/${key}?${SIG}`
        expect(allowedHolonUrl(url), key).toBeNull()
      }
    })

    it('rejects the other bundle artifacts — downloads, not renderables', () => {
      for (const file of [
        'g1.jsonld',
        'g1.zip',
        'g1.tavi.gaps.json',
        'x.env',
      ]) {
        expect(
          allowedHolonUrl(VIRTUAL_GLOBAL.replace('g1.holon.jsonld', file)),
          file
        ).toBeNull()
      }
    })

    it('rejects a missing or empty signature', () => {
      expect(allowedHolonUrl(VIRTUAL_GLOBAL.split('?')[0])).toBeNull()
      expect(
        allowedHolonUrl(
          VIRTUAL_GLOBAL.replace('X-Amz-Signature=sig', 'X-Amz-Signature=')
        )
      ).toBeNull()
    })

    it('rejects non-http(s) protocols and garbage input', () => {
      expect(allowedHolonUrl(`file:///${BUCKET}/${KEY}?${SIG}`)).toBeNull()
      expect(allowedHolonUrl('not a url')).toBeNull()
      expect(allowedHolonUrl('')).toBeNull()
    })
  })

  describe('the LocalStack endpoint override', () => {
    beforeEach(() => {
      vi.stubEnv('NEXT_PUBLIC_S3_ENDPOINT_URL', 'http://localhost:4566')
    })

    it('accepts path-style under the configured bucket', () => {
      const u = allowedHolonUrl(LOCAL)
      expect(u?.url.pathname.endsWith('.holon.jsonld')).toBe(true)
    })

    it('rejects another bucket on the override when a bucket is configured', () => {
      expect(allowedHolonUrl(LOCAL.replace(BUCKET, 'other'))).toBeNull()
    })

    it('accepts any bucket on the override in development with none configured', () => {
      vi.stubEnv('REPORT_BUNDLE_BUCKET', '')
      vi.stubEnv('NODE_ENV', 'development')
      expect(
        allowedHolonUrl(LOCAL.replace(BUCKET, 'robosystems-user'))
      ).not.toBeNull()
    })

    it('fails closed in production with no bucket configured', () => {
      vi.stubEnv('REPORT_BUNDLE_BUCKET', '')
      vi.stubEnv('NODE_ENV', 'production')
      expect(allowedHolonUrl(LOCAL)).toBeNull()
    })

    it('does not extend to another port on the same host', () => {
      expect(allowedHolonUrl(LOCAL.replace(':4566', ':8000'))).toBeNull()
    })

    it('rejects loopback when no override is configured', () => {
      vi.stubEnv('NEXT_PUBLIC_S3_ENDPOINT_URL', '')
      expect(allowedHolonUrl(LOCAL)).toBeNull()
    })
  })
})
