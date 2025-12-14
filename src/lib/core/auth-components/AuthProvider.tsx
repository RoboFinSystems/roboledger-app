'use client'

import type { ReactNode } from 'react'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { clearGraphSelection } from '../actions/graph-actions'
import { performLogoutCleanup } from '../auth-core/cleanup'
import { RoboSystemsAuthClient } from '../auth-core/client'
import { useTokenExpiryHandler } from '../auth-core/hooks'
import { getTimeUntilExpiry, getTokenStatus } from '../auth-core/token-storage'
import type { AuthContextType, AuthUser } from '../auth-core/types'

// Configuration constants
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes
const TOKEN_REFRESH_INTERVAL_MS = 25 * 60 * 1000 // 25 minutes (5 min before 30 min expiry)
const TOKEN_WARNING_CHECK_INTERVAL_MS = 30 * 1000 // 30 seconds - reduced for better battery life
const ACTIVITY_THROTTLE_MS = 1000 // 1 second
const HEARTBEAT_INTERVAL_MS = 5 * 60 * 1000 // 5 minutes - server validation heartbeat
const REFRESH_COOLDOWN_MS = 60 * 1000 // 60 seconds - prevent duplicate background refreshes
const LOGOUT_TIMEOUT_MS = 10 * 1000 // 10 seconds - timeout for logout operation
const CACHE_VERSION = '1' // Increment to invalidate all cached auth data

// Debug logging helper
const debugLog = (message: string, error?: unknown) => {
  if (process.env.NODE_ENV === 'development') {
    console.debug(`[AuthProvider] ${message}`, error)
  }
}

// Storage error logging helper - logs to console.error for production visibility
const logStorageError = (operation: string, error: unknown) => {
  const message = `[AuthProvider] Storage ${operation} failed - continuing with degraded UX`
  if (process.env.NODE_ENV === 'development') {
    console.debug(message, error)
  } else {
    // In production, log to console.error so errors are visible in monitoring
    console.error(message, error)
  }
}

const AuthContext = createContext<AuthContextType | null>(null)

interface AuthProviderProps {
  children: ReactNode
  apiUrl?: string
}

export function AuthProvider({
  children,
  apiUrl = process.env.NEXT_PUBLIC_ROBOSYSTEMS_API_URL ||
    'http://localhost:8000',
}: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [sessionWarning, setSessionWarning] = useState<{
    show: boolean
    timeLeft: number
  }>({ show: false, timeLeft: 0 })
  const [authClient] = useState(() => new RoboSystemsAuthClient(apiUrl))
  const lastActivity = useRef(Date.now())
  const mounted = useRef(true)
  const activityTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastRefreshAttempt = useRef(0)
  const refreshInProgress = useRef(false)

  const isAuthenticated = user !== null

  const validateCachedUser = useCallback(
    async (userData: AuthUser) => {
      try {
        const user = await authClient.getCurrentUser()
        if (user.id !== userData.id) {
          // Cache is stale, update with fresh data
          setUser(user)
          if (typeof window !== 'undefined') {
            try {
              sessionStorage.setItem(
                'auth_user_cache',
                JSON.stringify({
                  ...user,
                  cached_at: Date.now(),
                  cache_version: CACHE_VERSION,
                })
              )
            } catch (error) {
              // Storage error - continue without caching (graceful degradation)
              logStorageError('write', error)
            }
          }
        }
      } catch (error) {
        // User not authenticated anymore, clear cache
        setUser(null)
        if (typeof window !== 'undefined') {
          try {
            sessionStorage.removeItem('auth_user_cache')
          } catch (error) {
            // Storage error - continue with graceful degradation
            logStorageError('remove', error)
          }
        }
      }
    },
    [authClient]
  )

  const checkSession = useCallback(async () => {
    try {
      const user = await authClient.getCurrentUser()
      setUser(user)
      // Cache the user data
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.setItem(
            'auth_user_cache',
            JSON.stringify({
              ...user,
              cached_at: Date.now(),
              cache_version: CACHE_VERSION,
            })
          )
        } catch (error) {
          // Storage error - continue without caching (graceful degradation)
          logStorageError('write', error)
        }
      }
    } catch (error) {
      // User not authenticated, that's fine
      setUser(null)
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.removeItem('auth_user_cache')
        } catch (error) {
          // Storage error - continue with graceful degradation
          logStorageError('remove', error)
        }
      }
    } finally {
      setIsLoading(false)
    }
  }, [authClient])

  const logout = useCallback(
    async (reason?: string) => {
      try {
        await authClient.logout()
      } catch (error) {
        // Logout error - continue with local logout regardless
        debugLog('Backend logout failed, continuing with local cleanup', error)
        // Could show a non-blocking notification here if needed
      } finally {
        // Clear auth client cache
        authClient.clearAuthCache()

        // Clear user state
        setUser(null)

        // Clear session warning
        setSessionWarning({ show: false, timeLeft: 0 })

        // Clear graph selection cookie (server-side)
        try {
          await clearGraphSelection()
        } catch (error) {
          debugLog('Failed to clear graph selection cookie', error)
        }

        // Perform comprehensive cleanup of all user-specific data
        performLogoutCleanup()

        debugLog('Logout cleanup completed')

        // If logout has a reason (like session_expired), pass it to login page
        if (reason && typeof window !== 'undefined') {
          window.location.href = `/login?reason=${reason}`
        }
      }
    },
    [authClient]
  )

  const refreshSession = useCallback(
    async (force = false) => {
      const now = Date.now()

      if (refreshInProgress.current) {
        debugLog('Refresh already in progress, skipping duplicate attempt')
        return
      }

      if (!force && now - lastRefreshAttempt.current < REFRESH_COOLDOWN_MS) {
        debugLog(
          `Skipping refresh - too soon since last attempt (< ${REFRESH_COOLDOWN_MS / 1000}s)`
        )
        return
      }

      refreshInProgress.current = true
      lastRefreshAttempt.current = now
      debugLog(
        force
          ? 'Starting user-initiated session refresh'
          : 'Starting session refresh'
      )

      try {
        const response = await authClient.refreshSession()
        if (response.success) {
          setUser(response.user)
          debugLog('Session refresh successful')
        } else {
          throw new Error('Session refresh failed')
        }
      } finally {
        refreshInProgress.current = false
      }
    },
    [authClient]
  )

  // Set up global 401 error handler
  useTokenExpiryHandler(logout)

  // Check session on mount with caching
  useEffect(() => {
    if (typeof window === 'undefined') {
      return // Skip during SSR
    }

    let cachedUser: string | null = null
    try {
      cachedUser = sessionStorage.getItem('auth_user_cache')
    } catch (error) {
      // Storage access error - proceed without cache
    }

    if (cachedUser) {
      try {
        const userData = JSON.parse(cachedUser)

        // Validate cache structure and version
        if (!userData || typeof userData !== 'object' || !userData.id) {
          throw new Error('Invalid cache structure')
        }

        // Check cache version - invalidate if version mismatch
        if (userData.cache_version !== CACHE_VERSION) {
          debugLog('Cache version mismatch, invalidating cache')
          throw new Error('Cache version mismatch')
        }

        const cacheAge = Date.now() - (userData.cached_at || 0)

        // If cache is fresh (< 5 minutes), use cached data
        if (cacheAge < CACHE_TTL_MS) {
          setUser(userData)
          setIsLoading(false)
          // Validate in background without blocking UI
          validateCachedUser(userData)
          return
        }
      } catch (error) {
        // Invalid cache, proceed with normal check
        try {
          sessionStorage.removeItem('auth_user_cache')
        } catch (removeError) {
          // Storage error - continue silently
          debugLog(
            'sessionStorage remove failed during cache invalidation',
            removeError
          )
        }
      }
    }

    checkSession()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Heartbeat - Server-side validation and background tab refresh
  useEffect(() => {
    if (!isAuthenticated) return

    let isMounted = true

    const performHeartbeat = async () => {
      if (!isMounted) return

      debugLog('Heartbeat: Checking server authentication status')

      try {
        // Make real HTTP call to validate session server-side
        // This works even in background tabs (not throttled like timers)
        await authClient.getCurrentUser()

        if (!isMounted) return
        debugLog('Heartbeat: Server validation successful')

        // After successful server check, verify local token status
        const tokenStatus = getTokenStatus()
        const timeLeft = getTimeUntilExpiry()

        // Proactively refresh if token is expiring soon
        if (
          tokenStatus === 'warning' ||
          tokenStatus === 'expired' ||
          timeLeft < 5 * 60 * 1000
        ) {
          debugLog(
            `Heartbeat: Token needs refresh (status: ${tokenStatus}, time left: ${Math.floor(timeLeft / 1000)}s)`
          )

          try {
            await refreshSession()
            if (!isMounted) return

            debugLog('Heartbeat: Token refresh successful')
            setSessionWarning({ show: false, timeLeft: 0 })
          } catch (refreshError) {
            if (!isMounted) return

            debugLog('Heartbeat: Token refresh failed', refreshError)
            // Show warning if refresh failed but token not expired
            if (timeLeft > 0) {
              setSessionWarning({
                show: true,
                timeLeft: Math.ceil(timeLeft / 1000),
              })
            }
          }
        }
      } catch (error) {
        if (!isMounted) return

        debugLog(
          'Heartbeat: Server validation failed - user may be logged out',
          error
        )
        // Server says we're not authenticated - immediate logout
        await logout('session_invalid')
      }
    }

    // Regular heartbeat interval
    const heartbeatInterval = setInterval(
      performHeartbeat,
      HEARTBEAT_INTERVAL_MS
    ) // Every 5 minutes

    // Also check immediately when tab regains focus
    const handleFocus = () => {
      if (!isMounted) return
      debugLog('Tab regained focus - performing immediate heartbeat')
      performHeartbeat()
    }

    const handleVisibilityChange = () => {
      if (!isMounted) return
      if (!document.hidden) {
        debugLog('Tab became visible - performing immediate heartbeat')
        performHeartbeat()
      }
    }

    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      isMounted = false
      clearInterval(heartbeatInterval)
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isAuthenticated, authClient, refreshSession, logout])

  // Proactive token refresh BEFORE expiry (kept for immediate refresh needs)
  useEffect(() => {
    if (!isAuthenticated) return

    let isMounted = true

    const refreshInterval = setInterval(async () => {
      if (!isMounted) return

      const tokenStatus = getTokenStatus()

      // If token is in warning state or expired, refresh it
      if (tokenStatus === 'warning' || tokenStatus === 'expired') {
        debugLog(`Token status: ${tokenStatus}, attempting refresh`)

        try {
          await refreshSession()
          if (!isMounted) return

          setSessionWarning({ show: false, timeLeft: 0 })
        } catch (error) {
          if (!isMounted) return

          debugLog('Token refresh failed', error)
          // Show warning instead of silent logout
          const timeLeft = getTimeUntilExpiry()
          if (timeLeft > 0) {
            setSessionWarning({
              show: true,
              timeLeft: Math.ceil(timeLeft / 1000),
            })
          } else {
            // Token is actually expired, need to re-authenticate
            debugLog('Token expired, redirecting to login')
            await logout('session_expired')
          }
        }
      }
    }, TOKEN_REFRESH_INTERVAL_MS) // Check every 25 minutes

    // Also check token status more frequently and auto-refresh if needed
    const warningInterval = setInterval(async () => {
      if (!isMounted) return

      const tokenStatus = getTokenStatus()
      const timeLeft = getTimeUntilExpiry()

      if (tokenStatus === 'warning' && timeLeft > 0) {
        // Token is approaching expiry - try to auto-refresh before showing warning
        debugLog('Token in warning state, attempting auto-refresh')

        try {
          await refreshSession()
          if (!isMounted) return

          debugLog('Auto-refresh successful, warning modal suppressed')
          setSessionWarning({ show: false, timeLeft: 0 })
        } catch (error) {
          if (!isMounted) return

          // Auto-refresh failed, show warning modal
          debugLog('Auto-refresh failed, showing warning modal', error)
          setSessionWarning({
            show: true,
            timeLeft: Math.ceil(timeLeft / 1000),
          })
        }
      } else if (tokenStatus === 'valid') {
        if (!isMounted) return
        setSessionWarning({ show: false, timeLeft: 0 })
      }
    }, TOKEN_WARNING_CHECK_INTERVAL_MS) // Check every 10 seconds

    return () => {
      isMounted = false
      clearInterval(refreshInterval)
      clearInterval(warningInterval)
    }
  }, [isAuthenticated, refreshSession, logout])

  // Track user activity with throttling
  useEffect(() => {
    if (typeof window === 'undefined') return

    const updateActivity = () => {
      // Clear existing timeout to prevent race conditions
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current)
      }

      activityTimeoutRef.current = setTimeout(() => {
        // Check if component is still mounted before updating
        if (mounted.current) {
          lastActivity.current = Date.now()
        }
        activityTimeoutRef.current = null
      }, ACTIVITY_THROTTLE_MS) // Update at most once per second
    }

    const options = { passive: true }
    window.addEventListener('mousedown', updateActivity, options)
    window.addEventListener('keydown', updateActivity, options)
    window.addEventListener('scroll', updateActivity, options)
    window.addEventListener('touchstart', updateActivity, options)

    return () => {
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current)
      }
      window.removeEventListener('mousedown', updateActivity)
      window.removeEventListener('keydown', updateActivity)
      window.removeEventListener('scroll', updateActivity)
      window.removeEventListener('touchstart', updateActivity)
    }
  }, [])

  // Track component mount status
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const login = async (email: string, password: string) => {
    const response = await authClient.login(email, password)
    if (response.success) {
      authClient.clearAuthCache() // Clear request deduplication cache
      setUser(response.user)
      // Cache the user data
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.setItem(
            'auth_user_cache',
            JSON.stringify({
              ...response.user,
              cached_at: Date.now(),
              cache_version: CACHE_VERSION,
            })
          )
        } catch (error) {
          // Storage error - continue without caching (graceful degradation)
          logStorageError('write', error)
        }
      }
      return response.user
    } else {
      throw new Error(response.message || 'Login failed')
    }
  }

  const register = async (email: string, password: string, name?: string) => {
    const response = await authClient.register(email, password, name)
    if (response.success) {
      authClient.clearAuthCache() // Clear request deduplication cache
      setUser(response.user)
      // Cache the user data
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.setItem(
            'auth_user_cache',
            JSON.stringify({
              ...response.user,
              cached_at: Date.now(),
              cache_version: CACHE_VERSION,
            })
          )
        } catch (error) {
          // Storage error - continue without caching (graceful degradation)
          logStorageError('write', error)
        }
      }
      return response.user
    } else {
      throw new Error(response.message || 'Registration failed')
    }
  }

  const forgotPassword = async (email: string) => {
    return authClient.forgotPassword(email)
  }

  const resetPassword = async (token: string, newPassword: string) => {
    const result = await authClient.resetPassword(token, newPassword)
    // If reset was successful and logged in automatically, fetch user
    if (result.success) {
      try {
        const user = await authClient.getCurrentUser()
        if (user) {
          setUser(user)
        }
      } catch {
        // User not logged in after reset, that's fine
      }
    }
    return result
  }

  const validateResetToken = async (token: string) => {
    return authClient.validateResetToken(token)
  }

  const verifyEmail = async (token: string) => {
    const result = await authClient.verifyEmail(token)
    // If verification was successful and logged in automatically, update user
    if (result.success && result.user) {
      setUser(result.user)
      // Cache the user data
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.setItem(
            'auth_user_cache',
            JSON.stringify({
              ...result.user,
              cached_at: Date.now(),
              cache_version: CACHE_VERSION,
            })
          )
        } catch (error) {
          // Storage error - continue without caching (graceful degradation)
          logStorageError('write', error)
        }
      }
    }
    return result
  }

  const resendVerificationEmail = async (email: string) => {
    return authClient.resendVerificationEmail(email)
  }

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    sessionWarning,
    login,
    register,
    logout,
    refreshSession,
    forgotPassword,
    resetPassword,
    validateResetToken,
    verifyEmail,
    resendVerificationEmail,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
