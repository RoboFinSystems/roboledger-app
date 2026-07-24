'use client'

import Script from 'next/script'

import { getCloudflareAnalyticsToken } from '@/lib/config/analytics'

/**
 * Cloudflare Web Analytics beacon.
 *
 * Cookieless, GDPR/ePrivacy-friendly traffic analytics — no consent banner
 * required. Renders nothing when NEXT_PUBLIC_CF_ANALYTICS_TOKEN is unset, so
 * only builds with a configured token (production) emit the beacon.
 *
 * The beacon host is already allow-listed in the CSP (see src/proxy.ts —
 * script-src and connect-src include static.cloudflareinsights.com).
 *
 * Two deliberate choices here, both about how the browser fetches this file.
 * Neither is incidental — changing either one puts warnings back in every
 * visitor's console.
 *
 * 1. CLASSIC script — do not add `type="module"`. beacon.min.js is a plain
 *    IIFE bundle with no import/export, and Cloudflare's documented snippet
 *    loads it classically. Marking it a module fetches it in CORS mode with
 *    credentials mode "same-origin", which mismatches any no-cors preload and
 *    makes the browser discard that preload and refetch the file.
 *
 * 2. `lazyOnload` — NOT `afterInteractive`. next/script calls
 *    `ReactDOM.preload(src, { as: 'script' })` for both `beforeInteractive`
 *    and `afterInteractive`, and there is no way to opt out. A preload is for
 *    resources the page critically needs; a third-party analytics beacon is
 *    the opposite, and preloading it makes it compete with real content. Worse,
 *    when a visitor's tracker blocker blocks the beacon — a large share of
 *    them — nothing ever consumes the preload, so the browser logs "preloaded
 *    using link preload but not used" on every page view. `lazyOnload` emits
 *    no preload at all, which is also closer to Cloudflare's own `<script
 *    defer>` snippet.
 *
 * The trade-off accepted in (2): the beacon fires after the window load event
 * rather than during parse, so a very fast bounce may go unrecorded. That is
 * an acceptable loss for traffic analytics.
 */
export function CloudflareAnalytics() {
  const token = getCloudflareAnalyticsToken()

  if (!token) {
    return null
  }

  return (
    <Script
      id="cloudflare-web-analytics"
      src="https://static.cloudflareinsights.com/beacon.min.js"
      strategy="lazyOnload"
      data-cf-beacon={JSON.stringify({ token })}
    />
  )
}
