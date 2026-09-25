import { describe, expect, it, vi } from 'vitest'

const mockPublish = vi.fn()

vi.mock('@/lib/sns', () => ({
  snsService: { publishContactForm: (...a: unknown[]) => mockPublish(...a) },
}))

vi.mock('@/lib/turnstile-server', () => ({
  getClientIp: () => '203.0.113.7',
  isCaptchaRequired: () => false,
  verifyTurnstileToken: vi.fn(),
}))

import { POST } from '../route'

describe('POST /api/contact', () => {
  it('reports a submission that SNS did not take as not delivered', async () => {
    mockPublish.mockResolvedValue(false)
    const res = await POST(
      new Request('https://app.test/api/contact', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': '198.51.100.200',
        },
        body: JSON.stringify({
          name: 'Ada',
          email: 'ada@example.com',
          company: 'Acme',
          message: 'Hello',
        }),
      }) as never
    )
    expect(res.status).toBe(503)
    expect((await res.json()).code).toBe('SUBMISSION_NOT_DELIVERED')
  })
})
