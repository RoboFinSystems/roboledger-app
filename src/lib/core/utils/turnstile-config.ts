'use client'

/**
 * Check if Turnstile CAPTCHA is enabled
 * @returns true if Turnstile site key is configured
 */
export function isTurnstileEnabled(): boolean {
  return !!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
}

/**
 * Validate if Turnstile token is present when required
 * @param token - The Turnstile token
 * @returns true if token is valid or Turnstile is not enabled
 */
export function isTurnstileValid(token: string | null): boolean {
  if (!isTurnstileEnabled()) {
    return true
  }
  return !!token
}
