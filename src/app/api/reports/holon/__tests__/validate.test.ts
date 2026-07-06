import { describe, expect, it } from 'vitest'
import { allowedHolonUrl } from '../validate'

// A realistic LocalStack presigned holon URL (shape mirrors the live one).
const VALID =
  'http://localhost:4566/robosystems-user/report-bundles/kg19f333/rpt_01ABC/g1.holon.jsonld' +
  '?response-content-type=application%2Fld%2Bjson&AWSAccessKeyId=test&Signature=abc%3D&Expires=1783315210'

describe('allowedHolonUrl', () => {
  it('accepts a presigned report-bundle holon URL', () => {
    const u = allowedHolonUrl(VALID)
    expect(u).not.toBeNull()
    expect(u?.pathname.endsWith('.holon.jsonld')).toBe(true)
  })

  it('accepts SigV4-style signature params', () => {
    const sigv4 =
      'https://s3.amazonaws.com/robosystems-user/report-bundles/g/r/x.holon.jsonld' +
      '?X-Amz-Credential=cred&X-Amz-Signature=sig&X-Amz-Expires=300'
    expect(allowedHolonUrl(sigv4)).not.toBeNull()
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
        'http://internal-service/report-bundles/g/r/x.holon.jsonld'
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
})
