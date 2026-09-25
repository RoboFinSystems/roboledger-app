import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockPublish = vi.fn()

vi.mock('@/lib/sns', () => ({
  snsService: { publishContactForm: (...a: unknown[]) => mockPublish(...a) },
}))

vi.mock('@/lib/turnstile-server', () => ({
  getClientIp: () => '203.0.113.7',
  isCaptchaRequired: () => false,
  verifyTurnstileToken: vi.fn(),
}))

import { POST as contactPOST } from '../../contact/route'
import { POST } from '../route'

let ip = 0
function post(body: unknown, forwardedFor = `198.51.100.${++ip}`) {
  return new Request('https://app.test/api/support', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': forwardedFor,
    },
    body: JSON.stringify(body),
  })
}

const SUPPORT = {
  name: 'Ada',
  email: 'ada@example.com',
  subject: 'Help',
  message: 'Close is blocked',
}

describe('POST /api/support', () => {
  beforeEach(() => {
    mockPublish.mockReset()
    mockPublish.mockResolvedValue(true)
  })

  it('reports a submission that SNS did not take as not delivered', async () => {
    mockPublish.mockResolvedValue(false)
    const res = await POST(post(SUPPORT) as never)
    expect(res.status).toBe(503)
    expect((await res.json()).code).toBe('SUBMISSION_NOT_DELIVERED')
  })

  it('keeps only bounded, single-line known context fields', async () => {
    const res = await POST(
      post({
        ...SUPPORT,
        metadata: {
          orgName: 'Acme\nInjected: line',
          graphId: 'x'.repeat(5000),
          userRole: { nested: true },
          extra: 'dropped',
        },
      }) as never
    )
    expect(res.status).toBe(200)
    const { message } = mockPublish.mock.calls[0][0]
    expect(message).toContain('Organization: Acme Injected: line')
    expect(message).toContain(`Graph ID: ${'x'.repeat(200)}\n`.trimEnd())
    expect(message).not.toContain('x'.repeat(201))
    expect(message).not.toContain('Role:')
    expect(message).not.toContain('dropped')
  })

  it('has its own limit, not the contact form’s', async () => {
    const shared = '192.0.2.10'
    const contact = {
      name: 'Ada',
      email: 'ada@example.com',
      company: 'Acme',
      message: 'Hello',
    }
    for (let i = 0; i < 6; i++) {
      await contactPOST(post(contact, shared) as never)
    }
    const res = await POST(post(SUPPORT, shared) as never)
    expect(res.status).toBe(200)
  })
})
