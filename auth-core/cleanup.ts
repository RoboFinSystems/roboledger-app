/**
 * Logout cleanup utilities
 *
 * Provides comprehensive cleanup of user-specific data on logout
 * including cookies, localStorage, and sessionStorage.
 */

/**
 * Clear all user-specific cookies on logout
 */
export function clearUserCookies(): void {
  if (typeof document === 'undefined') return

  // List of user-specific cookies to clear
  const userCookies = [
    'selected-graph', // Graph selection state
    'credit-visibility', // UI preferences
    // Note: auth-token is cleared by the backend
    // Note: sidebar-collapsed is kept as it's a UI preference that can persist
  ]

  userCookies.forEach((cookieName) => {
    // Set cookie to expired date to delete it
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}`

    // Also try without domain for localhost/development
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
  })
}

/**
 * Clear user-specific localStorage items
 */
export function clearUserLocalStorage(): void {
  if (typeof localStorage === 'undefined') return

  try {
    // Get all localStorage keys
    const keys = Object.keys(localStorage)

    // Patterns of user-specific localStorage items to clear
    const userDataPatterns = [
      /^saved_queries_/, // Saved queries per graph: saved_queries_${graphId}
      /^query_history_/, // Query history per graph: query_history_${graphId}
      /^graph_/, // Any graph-specific data
      /^user_/, // Any user-specific data
      /^auth_/, // Auth-related data (though we handle auth_user_cache separately)
    ]

    // Clear matching items
    keys.forEach((key) => {
      if (userDataPatterns.some((pattern) => pattern.test(key))) {
        try {
          localStorage.removeItem(key)
        } catch (error) {
          console.warn(`Failed to remove localStorage item: ${key}`, error)
        }
      }
    })
  } catch (error) {
    console.warn('Failed to access localStorage for cleanup', error)
  }
}

/**
 * Clear user-specific sessionStorage items
 */
export function clearUserSessionStorage(): void {
  if (typeof sessionStorage === 'undefined') return

  try {
    // Get all sessionStorage keys
    const keys = Object.keys(sessionStorage)

    // Patterns of user-specific sessionStorage items to clear
    const userDataPatterns = [
      /^auth_/, // Auth cache and related data
      /^user_/, // User-specific session data
      /^graph_/, // Graph-specific session data
      /^temp_/, // Temporary user data
    ]

    // Clear matching items
    keys.forEach((key) => {
      if (userDataPatterns.some((pattern) => pattern.test(key))) {
        try {
          sessionStorage.removeItem(key)
        } catch (error) {
          console.warn(`Failed to remove sessionStorage item: ${key}`, error)
        }
      }
    })
  } catch (error) {
    console.warn('Failed to access sessionStorage for cleanup', error)
  }
}

/**
 * Comprehensive logout cleanup
 *
 * Clears all user-specific data from the browser including:
 * - User-specific cookies (graph selection, preferences, etc.)
 * - User-specific localStorage items (saved queries, etc.)
 * - User-specific sessionStorage items (auth cache, etc.)
 */
export function performLogoutCleanup(): void {
  clearUserCookies()
  clearUserLocalStorage()
  clearUserSessionStorage()
}

/**
 * Reset UI state that should not persist between users
 *
 * This can be called to reset UI state that might confuse
 * users when switching accounts (like showing graph tabs
 * for a user who doesn't have any graphs).
 */
export function resetUIState(): void {
  if (typeof document === 'undefined') return

  // Clear selected graph cookie specifically
  document.cookie = `selected-graph=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`

  // You could also reset other UI state here, but be careful
  // not to clear preferences that should persist (like theme, language, etc.)
}

/**
 * Diagnostic function to list all cookies and storage items
 * Useful for development and debugging
 */
export function listUserData(): {
  cookies: string[]
  localStorage: string[]
  sessionStorage: string[]
} {
  const result = {
    cookies: [] as string[],
    localStorage: [] as string[],
    sessionStorage: [] as string[],
  }

  // List cookies
  if (typeof document !== 'undefined') {
    result.cookies = document.cookie
      .split(';')
      .map((c) => c.trim().split('=')[0])
      .filter(Boolean)
  }

  // List localStorage
  if (typeof localStorage !== 'undefined') {
    try {
      result.localStorage = Object.keys(localStorage)
    } catch (error) {
      console.warn('Failed to access localStorage', error)
    }
  }

  // List sessionStorage
  if (typeof sessionStorage !== 'undefined') {
    try {
      result.sessionStorage = Object.keys(sessionStorage)
    } catch (error) {
      console.warn('Failed to access sessionStorage', error)
    }
  }

  return result
}
