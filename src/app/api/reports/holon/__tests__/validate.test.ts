import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { allowedHolonUrl } from '../validate'

// A realistic LocalStack presigned holon URL (shape mirrors the live one).
const VALID =
  'http://localhost:4566/robosystems-user/report-bundles/kg19f333/rpt_01ABC/g1.holon.jsonld' +
  '?response-content-type=application%2Fld%2Bjson&AWSAccessKeyId=test&Signature=abc%3D&Expires=1783315210'

const SIG = 'X-Amz-Credential=cred&X-Amz-Signature=sig&X-Amz-Expires=300'

describe('allowedHolonUrl', () => {
  const originalEndpoint = process.env.NEXT_PUBLIC_S3_ENDPOINT_URL
  const originalHosts = process.env.HOLON_BUNDLE_HOSTS

  beforeEach(() => {
    // Development configuration: LocalStack over loopback.
    process.env.NEXT_PUBLIC_S3_ENDPOINT_URL = 'http://localhost:4566'
    delete process.env.HOLON_BUNDLE_HOSTS
  })

  afterEach(() => {
    process.env.NEXT_PUBLIC_S3_ENDPOINT_URL = originalEndpoint
    process.env.HOLON_BUNDLE_HOSTS = originalHosts
  })

  it('accepts a presigned report-bundle holon URL from the configured endpoint', () => {
    const u = allowedHolonUrl(VALID)
    expect(u).not.toBeNull()
    expect(u?.pathname.endsWith('.holon.jsonld')).toBe(true)
  })

  it('accepts SigV4-style signature params', () => {
    const sigv4 =
      'https://s3.amazonaws.com/robosystems-user/report-bundles/g/r/x.holon.jsonld?' +
      SIG
    expect(allowedHolonUrl(sigv4)).not.toBeNull()
  })

  it('accepts a virtual-hosted-style bucket URL', () => {
    const virtualHosted =
      'https://robosystems-user.s3.us-east-1.amazonaws.com/report-bundles/g/r/x.holon.jsonld?' +
      SIG
    expect(allowedHolonUrl(virtualHosted)).not.toBeNull()
  })

  it('rejects a URL that is not a holon bundle path', () => {
    expect(
      allowedHolonUrl(
        'http://localhost:4566/robosystems-user/other/x.json?AWSAccessKeyId=t&Signature=s&Expires=1'
      )
    ).toBeNull()
  })

  it('rejects a report-bundle URL without a signature (blocks arbitrary fetch)', () => {
    expect(
      allowedHolonUrl(
        'https://s3.amazonaws.com/report-bundles/g/r/x.holon.jsonld'
      )
    ).toBeNull()
  })

  it('rejects a signature param present but empty', () => {
    expect(
      allowedHolonUrl(
        'https://s3.amazonaws.com/report-bundles/g/r/x.holon.jsonld' +
          '?X-Amz-Credential=cred&X-Amz-Signature=&X-Amz-Expires=300'
      )
    ).toBeNull()
  })

  it('rejects non-http(s) protocols', () => {
    expect(
      allowedHolonUrl(
        'file:///report-bundles/g/r/x.holon.jsonld?AWSAccessKeyId=t&Signature=s&Expires=1'
      )
    ).toBeNull()
  })

  it('rejects a non-holon file extension', () => {
    expect(
      allowedHolonUrl(
        'http://localhost:4566/robosystems-user/report-bundles/g/r/secrets.env?AWSAccessKeyId=t&Signature=s&Expires=1'
      )
    ).toBeNull()
  })

  it('rejects garbage input', () => {
    expect(allowedHolonUrl('not a url')).toBeNull()
    expect(allowedHolonUrl('')).toBeNull()
  })

  describe('SSRF host pinning', () => {
    it('rejects the instance metadata endpoint even with a well-formed path', () => {
      expect(
        allowedHolonUrl(
          'http://169.254.169.254/report-bundles/g/r/x.holon.jsonld?' + SIG
        )
      ).toBeNull()
    })

    it('rejects arbitrary internal hosts and ports', () => {
      expect(
        allowedHolonUrl(
          'http://internal-service:8000/report-bundles/g/r/x.holon.jsonld?' +
            SIG
        )
      ).toBeNull()
      expect(
        allowedHolonUrl(
          'http://10.0.0.5/report-bundles/g/r/x.holon.jsonld?' + SIG
        )
      ).toBeNull()
    })

    it('rejects an attacker host that merely mentions the AWS domain', () => {
      expect(
        allowedHolonUrl(
          'https://evil.test/report-bundles/g/r/x.holon.jsonld?' +
            SIG +
            '&pad=.amazonaws.com'
        )
      ).toBeNull()
      expect(
        allowedHolonUrl(
          'https://amazonaws.com.evil.test/report-bundles/g/r/x.holon.jsonld?' +
            SIG
        )
      ).toBeNull()
    })

    it('rejects plaintext http to a non-configured host', () => {
      expect(
        allowedHolonUrl(
          'http://s3.amazonaws.com/report-bundles/g/r/x.holon.jsonld?' + SIG
        )
      ).toBeNull()
    })

    it('honours an explicit HOLON_BUNDLE_HOSTS allowlist', () => {
      process.env.HOLON_BUNDLE_HOSTS = 'bundles.roboledger.ai'
      expect(
        allowedHolonUrl(
          'https://bundles.roboledger.ai/report-bundles/g/r/x.holon.jsonld?' +
            SIG
        )
      ).not.toBeNull()
      expect(
        allowedHolonUrl(
          'https://other.roboledger.ai/report-bundles/g/r/x.holon.jsonld?' + SIG
        )
      ).toBeNull()
    })

    it('rejects loopback when no local endpoint is configured', () => {
      delete process.env.NEXT_PUBLIC_S3_ENDPOINT_URL
      expect(allowedHolonUrl(VALID)).toBeNull()
    })
  })
})
