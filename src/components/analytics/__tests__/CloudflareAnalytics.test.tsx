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
  // mode "same-origin" while a no-cors preload stays "include" — the mismatch
  // makes the browser throw away the preload and fetch the script twice.
  it('loads the beacon as a classic script, never as a module', async () => {
    const { container } = await renderAnalytics()
    expect(container.querySelector('script')).not.toHaveAttribute('type')
  })

  // Regression guard. next/script preloads the src for `beforeInteractive`
  // and `afterInteractive` with no opt-out. Preloading a third-party beacon
  // is wrong on the merits, and when a tracker blocker blocks it nothing
  // consumes the preload — logging "preloaded using link preload but not
  // used" on every page view. `lazyOnload` emits no preload.
  it('uses lazyOnload so next/script emits no preload for the beacon', async () => {
    const { container } = await renderAnalytics()
    expect(container.querySelector('script')).toHaveAttribute(
      'strategy',
      'lazyOnload'
    )
  })
})
