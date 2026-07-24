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
 * Deliberately a CLASSIC script — do not add `type="module"`. beacon.min.js
 * is a plain IIFE bundle with no import/export, and Cloudflare's documented
 * snippet loads it classically. Marking it as a module changes the fetch to
 * CORS mode with credentials mode "same-origin", while the `<link rel=preload
 * as=script>` that Next injects for an afterInteractive script stays no-cors
 * with credentials mode "include". The mismatch makes the browser discard the
 * preload and refetch the file — two console warnings ("preload ... is found,
 * but is not used because the request credentials mode does not match" and
 * "preloaded using link preload but not used") plus a wasted request.
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
      strategy="afterInteractive"
      data-cf-beacon={JSON.stringify({ token })}
    />
  )
}
