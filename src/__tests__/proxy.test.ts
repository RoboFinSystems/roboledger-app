import { NextRequest } from 'next/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { proxy } from '../proxy'

const connectSrc = () => {
  const csp =
    proxy(new NextRequest('https://ledger.example.test/home')).headers.get(
      'content-security-policy'
    ) ?? ''
  return csp.split(';').find((d) => d.trim().startsWith('connect-src')) ?? ''
}

describe('proxy CSP', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('lets the browser reach the API this build is configured for', () => {
    vi.stubEnv('NEXT_PUBLIC_ROBOSYSTEMS_API_URL', 'https://api.corp.example/')
    expect(connectSrc()).toContain('https://api.corp.example')
    expect(connectSrc()).toContain('https://api.robosystems.ai')
  })

  it('adds nothing for an unparsable API URL', () => {
    vi.stubEnv('NEXT_PUBLIC_ROBOSYSTEMS_API_URL', '__PLACEHOLDER__')
    expect(connectSrc()).not.toContain('__PLACEHOLDER__')
  })

  it.each(['https://*', 'https://a;b.com', "https://x.com'unsafe-eval'"])(
    'keeps %s out of the policy',
    (value) => {
      vi.stubEnv('NEXT_PUBLIC_ROBOSYSTEMS_API_URL', value)
      const directive = connectSrc()
      expect(directive).not.toContain('https://*')
      expect(directive).not.toContain('a;b')
      expect(directive).not.toContain("'unsafe-eval'")
    }
  )
})
