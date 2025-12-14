/**
 * JWT Token Storage Management
 *
 * Provides secure storage for JWT tokens using localStorage
 * for cross-domain authentication support and persistent sessions.
 */

const TOKEN_KEY = 'robosystems_jwt_token'
const TOKEN_EXPIRY_KEY = 'robosystems_jwt_expiry'
const TOKEN_THRESHOLD_KEY = 'robosystems_jwt_threshold'

export interface TokenData {
  token: string
  expiresAt: number
  refreshThreshold?: number
}

export type TokenStatus = 'valid' | 'warning' | 'expired'

/**
 * Store JWT token in localStorage
 * @param token - The JWT token from login response
 * @param expiresIn - Optional expiry time in seconds (default 30 minutes)
 * @param refreshThreshold - Optional refresh threshold in seconds (default 5 minutes)
 */
export function storeToken(
  token: string,
  expiresIn: number = 1800,
  refreshThreshold: number = 300
): void {
  // 30 minutes default to match backend token lifetime
  if (typeof window === 'undefined') return

  try {
    const expiresAt = Date.now() + expiresIn * 1000
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiresAt.toString())
    localStorage.setItem(
      TOKEN_THRESHOLD_KEY,
      (refreshThreshold * 1000).toString()
    )

    // Log token storage for security monitoring
    console.debug(
      '[TokenStorage] Token stored with expiry:',
      new Date(expiresAt).toISOString(),
      'Refresh threshold:',
      refreshThreshold,
      'seconds'
    )
  } catch (error) {
    console.error('[TokenStorage] Failed to store token:', error)
  }
}

/**
 * Retrieve JWT token from localStorage
 * @returns The stored token or null if not found/expired
 */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null

  try {
    const token = localStorage.getItem(TOKEN_KEY)
    const expiryStr = localStorage.getItem(TOKEN_EXPIRY_KEY)

    if (!token) return null

    // Check if token is expired
    if (expiryStr) {
      const expiry = parseInt(expiryStr, 10)
      if (Date.now() > expiry) {
        clearToken()
        return null
      }
    }

    return token
  } catch (error) {
    console.error('[TokenStorage] Failed to retrieve token:', error)
    return null
  }
}

/**
 * Clear JWT token from storage
 */
export function clearToken(): void {
  if (typeof window === 'undefined') return

  try {
    const hadToken = !!localStorage.getItem(TOKEN_KEY)
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(TOKEN_EXPIRY_KEY)
    localStorage.removeItem(TOKEN_THRESHOLD_KEY)

    if (hadToken) {
      logSecurityEvent('token_cleared', {
        timestamp: new Date().toISOString(),
        url: window.location.href,
      })
    }
  } catch (error) {
    console.error('[TokenStorage] Failed to clear token:', error)
  }
}

/**
 * Get current token status
 * @returns 'valid' if token is fresh, 'warning' if approaching expiry, 'expired' if expired
 */
export function getTokenStatus(): TokenStatus {
  if (typeof window === 'undefined') return 'expired'

  try {
    const expiryStr = localStorage.getItem(TOKEN_EXPIRY_KEY)
    const thresholdStr = localStorage.getItem(TOKEN_THRESHOLD_KEY)

    if (!expiryStr) return 'expired'

    const expiry = parseInt(expiryStr, 10)
    const threshold = thresholdStr ? parseInt(thresholdStr, 10) : 300000 // Default 5 min
    const now = Date.now()

    if (now > expiry) return 'expired'
    if (now > expiry - threshold) return 'warning'
    return 'valid'
  } catch (error) {
    console.error('[TokenStorage] Failed to get token status:', error)
    return 'expired'
  }
}

/**
 * Get time until token expiry in milliseconds
 * @returns Time until expiry in ms, or 0 if expired
 */
export function getTimeUntilExpiry(): number {
  if (typeof window === 'undefined') return 0

  try {
    const expiryStr = localStorage.getItem(TOKEN_EXPIRY_KEY)
    if (!expiryStr) return 0

    const expiry = parseInt(expiryStr, 10)
    return Math.max(0, expiry - Date.now())
  } catch (error) {
    console.error('[TokenStorage] Failed to get time until expiry:', error)
    return 0
  }
}

/**
 * Check if a valid token exists
 * @returns True if a non-expired token exists
 */
export function hasValidToken(): boolean {
  return getToken() !== null
}

/**
 * Get the Authorization header value for API requests
 * @returns Bearer token header or null
 */
export function getAuthHeader(): string | null {
  const token = getToken()
  return token ? `Bearer ${token}` : null
}

/**
 * Extract token from login response and store it
 * @param response - The auth response from login/refresh
 */
export function handleAuthResponse(response: any): void {
  if (response?.token) {
    storeToken(
      response.token,
      response.expires_in || 1800,
      response.refresh_threshold || 300
    )
  }
}

/**
 * Get valid token (backend handles refresh via grace period)
 * @returns Valid token or null if expired
 */
export async function getValidToken(): Promise<string | null> {
  const token = getToken()
  if (!token) return null

  // Just check if token is expired - let backend handle refresh
  const expiryStr = localStorage.getItem(TOKEN_EXPIRY_KEY)
  if (expiryStr) {
    const expiry = parseInt(expiryStr, 10)
    if (Date.now() > expiry) {
      // Token is expired, clear it and let AuthProvider handle re-auth
      clearToken()
      return null
    }
  }

  return token
}

/**
 * Security event logging (for monitoring)
 */
function logSecurityEvent(event: string, details: any = {}) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Security] ${event}:`, details)
  }
}
