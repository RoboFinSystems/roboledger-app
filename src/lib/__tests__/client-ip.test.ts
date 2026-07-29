import { afterEach, describe, expect, it } from 'vitest'
import { getClientIp } from '../client-ip'

function requestWith(headers: Record<string, string>): Request {
  return new Request('https://roboledger.ai/api/contact', { headers })
}

describe('getClientIp', () => {
  const originalHops = process.env.TRUSTED_PROXY_HOPS

  afterEach(() => {
    if (originalHops === undefined) delete process.env.TRUSTED_PROXY_HOPS
    else process.env.TRUSTED_PROXY_HOPS = originalHops
  })

  describe('cloudfront-viewer-address', () => {
    it('uses the viewer address and strips the port', () => {
      expect(
        getClientIp(
          requestWith({ 'cloudfront-viewer-address': '203.0.113.7:54969' })
        )
      ).toBe('203.0.113.7')
    })

    it('strips the port from an IPv6 viewer address', () => {
      // CloudFront sends IPv6 unbracketed with the port after the final colon.
      expect(
        getClientIp(
          requestWith({
            'cloudfront-viewer-address':
              '2a03:2880:f10c:83:face:b00c:0:25de:14383',
          })
        )
      ).toBe('2a03:2880:f10c:83:face:b00c:0:25de')
    })

    it('wins over x-forwarded-for', () => {
      // The measured production chain: <viewer>, <App Runner ingress>. Counting
      // one hop in from the right lands on infrastructure, which is the bug this
      // header exists to remove.
      expect(
        getClientIp(
          requestWith({
            'x-forwarded-for': '216.73.216.46, 15.158.61.134',
            'cloudfront-viewer-address': '216.73.216.46:54969',
          })
        )
      ).toBe('216.73.216.46')
    })

    it('cannot be overridden by a forged forwarded chain', () => {
      const first = getClientIp(
        requestWith({
          'x-forwarded-for': 'forged-a, 15.158.61.134',
          'cloudfront-viewer-address': '203.0.113.7:1000',
        })
      )
      const second = getClientIp(
        requestWith({
          'x-forwarded-for': 'forged-b, 15.158.61.134',
          'cloudfront-viewer-address': '203.0.113.7:2000',
        })
      )
      expect(first).toBe('203.0.113.7')
      expect(second).toBe('203.0.113.7')
    })

    it('falls through to the forwarded chain when absent or empty', () => {
      expect(
        getClientIp(
          requestWith({
            'cloudfront-viewer-address': '',
            'x-forwarded-for': 'spoofed, 203.0.113.7',
          })
        )
      ).toBe('203.0.113.7')
    })
  })

  describe('x-forwarded-for fallback', () => {
    it('returns the single forwarded entry', () => {
      expect(
        getClientIp(requestWith({ 'x-forwarded-for': '203.0.113.7' }))
      ).toBe('203.0.113.7')
    })

    it('ignores a caller-supplied entry and trusts the proxy-appended one', () => {
      const ip = getClientIp(
        requestWith({ 'x-forwarded-for': '1.1.1.1, 203.0.113.7' })
      )
      expect(ip).toBe('203.0.113.7')
    })

    it('does not let a forged chain mint a fresh identity per request', () => {
      const first = getClientIp(
        requestWith({ 'x-forwarded-for': 'forged-a, 203.0.113.7' })
      )
      const second = getClientIp(
        requestWith({ 'x-forwarded-for': 'forged-b, 203.0.113.7' })
      )
      expect(first).toBe(second)
    })

    it('counts in from the right by the configured hop count', () => {
      process.env.TRUSTED_PROXY_HOPS = '2'
      const ip = getClientIp(
        requestWith({ 'x-forwarded-for': 'spoofed, 203.0.113.7, 70.132.0.1' })
      )
      expect(ip).toBe('203.0.113.7')
    })

    it('falls back to the leftmost entry when the chain is shorter than configured', () => {
      process.env.TRUSTED_PROXY_HOPS = '3'
      expect(
        getClientIp(requestWith({ 'x-forwarded-for': '203.0.113.7' }))
      ).toBe('203.0.113.7')
    })

    it('trims whitespace around entries', () => {
      expect(
        getClientIp(
          requestWith({ 'x-forwarded-for': '1.1.1.1,   203.0.113.7  ' })
        )
      ).toBe('203.0.113.7')
    })
  })

  it('falls back to x-real-ip when no forwarded chain is present', () => {
    expect(getClientIp(requestWith({ 'x-real-ip': '203.0.113.9' }))).toBe(
      '203.0.113.9'
    )
  })

  it('returns undefined when no proxy headers are present', () => {
    expect(getClientIp(requestWith({}))).toBeUndefined()
  })

  it('ignores a spoofable cf-connecting-ip header', () => {
    // Not behind Cloudflare — honouring this header would reopen the bypass.
    expect(
      getClientIp(
        requestWith({
          'cf-connecting-ip': 'attacker-controlled',
          'x-forwarded-for': 'spoofed, 203.0.113.7',
        })
      )
    ).toBe('203.0.113.7')
  })
})
