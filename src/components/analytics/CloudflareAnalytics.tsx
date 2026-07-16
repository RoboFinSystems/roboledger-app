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
 */
export function CloudflareAnalytics() {
  const token = getCloudflareAnalyticsToken()

  if (!token) {
    return null
  }

  return (
    <Script
      id="cloudflare-web-analytics"
      type="module"
      src="https://static.cloudflareinsights.com/beacon.min.js"
      strategy="afterInteractive"
      data-cf-beacon={JSON.stringify({ token })}
    />
  )
}
