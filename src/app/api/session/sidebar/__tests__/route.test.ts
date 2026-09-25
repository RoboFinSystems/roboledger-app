import { describe, expect, it, vi } from 'vitest'

let settled = false
const mockSet = vi.fn(async () => {
  await new Promise((resolve) => setTimeout(resolve, 5))
  settled = true
})

vi.mock('@robosystems/core', () => ({
  sidebarCookie: { set: (...a: unknown[]) => mockSet(...(a as [])) },
}))

import { POST } from '../route'

describe('POST /api/session/sidebar', () => {
  it('does not answer before the cookie is set', async () => {
    const res = await POST(
      new Request('https://app.test/api/session/sidebar', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ isCollapsed: true }),
      }) as never
    )
    expect(res.status).toBe(200)
    expect(settled).toBe(true)
    expect(mockSet).toHaveBeenCalledWith({ isCollapsed: true })
  })
})
