import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
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

  it('returns the single forwarded entry', () => {
    expect(requestWith({ 'x-forwarded-for': '203.0.113.7' })).toBeDefined()
    expect(getClientIp(requestWith({ 'x-forwarded-for': '203.0.113.7' }))).toBe(
      '203.0.113.7'
    )
  })

  it('ignores a caller-supplied entry and trusts the proxy-appended one', () => {
    // The caller sent "1.1.1.1"; CloudFront appended the address it actually saw.
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
    expect(getClientIp(requestWith({ 'x-forwarded-for': '203.0.113.7' }))).toBe(
      '203.0.113.7'
    )
  })

  it('trims whitespace around entries', () => {
    expect(
      getClientIp(
        requestWith({ 'x-forwarded-for': '1.1.1.1,   203.0.113.7  ' })
      )
    ).toBe('203.0.113.7')
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

describe('logProxyChainOnce', () => {
  // The once-per-instance guard is module-level state, so each test needs a
  // freshly imported copy of the module.
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('records the observed chain, hop count and resolved IP', async () => {
    const { logProxyChainOnce } = await import('../client-ip')
    const info = vi.spyOn(console, 'info').mockImplementation(() => {})

    logProxyChainOnce(
      requestWith({
        'x-forwarded-for': '1.1.1.1, 203.0.113.7',
        via: '1.1 abc.cloudfront.net (CloudFront)',
      })
    )

    expect(info).toHaveBeenCalledTimes(1)
    const payload = JSON.parse(info.mock.calls[0][0] as string)
    expect(payload.event).toBe('proxy_chain_observed')
    expect(payload.forwardedFor).toEqual(['1.1.1.1', '203.0.113.7'])
    expect(payload.hopCount).toBe(2)
    expect(payload.configuredTrustedHops).toBe(1)
    expect(payload.resolvedClientIp).toBe('203.0.113.7')
    expect(payload.via).toContain('CloudFront')
  })

  it('logs only once per instance', async () => {
    const { logProxyChainOnce } = await import('../client-ip')
    const info = vi.spyOn(console, 'info').mockImplementation(() => {})

    logProxyChainOnce(requestWith({ 'x-forwarded-for': '203.0.113.7' }))
    logProxyChainOnce(requestWith({ 'x-forwarded-for': '198.51.100.4' }))
    logProxyChainOnce(requestWith({ 'x-forwarded-for': '198.51.100.5' }))

    expect(info).toHaveBeenCalledTimes(1)
  })

  it('stays silent when there is no forwarded chain to learn from', async () => {
    const { logProxyChainOnce } = await import('../client-ip')
    const info = vi.spyOn(console, 'info').mockImplementation(() => {})

    logProxyChainOnce(requestWith({}))
    expect(info).not.toHaveBeenCalled()

    // ...and the guard is not consumed, so a later real request still reports.
    logProxyChainOnce(requestWith({ 'x-forwarded-for': '203.0.113.7' }))
    expect(info).toHaveBeenCalledTimes(1)
  })
})
