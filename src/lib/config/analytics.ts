'use client'

/**
 * Cloudflare Web Analytics — cookieless, privacy-first traffic analytics.
 *
 * The site token is public (it ships in the client bundle and is visible in
 * page source) and is provided via NEXT_PUBLIC_CF_ANALYTICS_TOKEN. Analytics
 * is disabled whenever the token is unset, so staging, local, and self-hosted
 * builds emit no beacon unless the token is explicitly configured.
 */

/**
 * Get the Cloudflare Web Analytics site token, if configured.
 * @returns the token string, or undefined when analytics is disabled
 */
export function getCloudflareAnalyticsToken(): string | undefined {
  return process.env.NEXT_PUBLIC_CF_ANALYTICS_TOKEN || undefined
}

/**
 * Check if Cloudflare Web Analytics is enabled
 * @returns true if a Cloudflare Analytics token is configured
 */
export function isAnalyticsEnabled(): boolean {
  return !!process.env.NEXT_PUBLIC_CF_ANALYTICS_TOKEN
}
