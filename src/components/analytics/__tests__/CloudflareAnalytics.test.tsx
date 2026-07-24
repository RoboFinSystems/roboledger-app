import { render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// `next/script` defers real injection to the Next runtime, which doesn't exist
// under jsdom. Rendering a plain <script> with the same props is enough to
// assert what we care about here: the attributes handed to the tag.
vi.mock('next/script', () => ({
  default: (props: Record<string, unknown>) => <script {...props} />,
}))

const ORIGINAL_TOKEN = process.env.NEXT_PUBLIC_CF_ANALYTICS_TOKEN

async function renderAnalytics() {
  vi.resetModules()
  const { CloudflareAnalytics } = await import('../CloudflareAnalytics')
  return render(<CloudflareAnalytics />)
}

describe('CloudflareAnalytics', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_CF_ANALYTICS_TOKEN = 'test-token'
  })

  afterEach(() => {
    if (ORIGINAL_TOKEN === undefined) {
      delete process.env.NEXT_PUBLIC_CF_ANALYTICS_TOKEN
    } else {
      process.env.NEXT_PUBLIC_CF_ANALYTICS_TOKEN = ORIGINAL_TOKEN
    }
  })

  it('renders nothing when no token is configured', async () => {
    delete process.env.NEXT_PUBLIC_CF_ANALYTICS_TOKEN
    const { container } = await renderAnalytics()
    expect(container.querySelector('script')).toBeNull()
  })

  it('renders the beacon with the configured token', async () => {
    const { container } = await renderAnalytics()
    const script = container.querySelector('script')
    expect(script).not.toBeNull()
    expect(script).toHaveAttribute(
      'src',
      'https://static.cloudflareinsights.com/beacon.min.js'
    )
    expect(script).toHaveAttribute(
      'data-cf-beacon',
      JSON.stringify({ token: 'test-token' })
    )
  })

  // Regression guard. beacon.min.js is a classic IIFE bundle, not an ES
  // module. `type="module"` switches the fetch to CORS mode with credentials
  // mode "same-origin" while Next's injected `<link rel=preload as=script>`
  // stays no-cors/"include" — the mismatch makes the browser throw away the
  // preload and fetch the script a second time, with two console warnings.
  it('loads the beacon as a classic script, never as a module', async () => {
    const { container } = await renderAnalytics()
    expect(container.querySelector('script')).not.toHaveAttribute('type')
  })
})
