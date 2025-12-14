'use client'

import { useCallback, useEffect } from 'react'
import { TokenExpiredError } from './client'
import type { AuthUser } from './types'

/**
 * Creates user-specific operations that can be used with auth context.
 * This is a factory function that takes the auth client instance.
 */
export function useUserHook(
  authClient: any,
  setUser: (user: AuthUser | null) => void
) {
  const refreshUser = useCallback(async (): Promise<AuthUser | null> => {
    try {
      const user = await authClient.getCurrentUser()
      setUser(user)
      return user
    } catch (error) {
      setUser(null)
      return null
    }
  }, [authClient, setUser])

  const updateProfile = useCallback(
    async (data: { name?: string; email?: string }): Promise<AuthUser> => {
      // This would use SDK updateUser method
      // For now, refresh user data after update
      const user = await refreshUser()
      if (!user) {
        throw new Error('User not found after update')
      }
      return user
    },
    [refreshUser]
  )

  return {
    refreshUser,
    updateProfile,
  }
}

/**
 * Hook to handle token expiry errors globally
 * Automatically redirects to login on token expiry
 */
export function useTokenExpiryHandler(
  logout: (reason?: string) => Promise<void>
) {
  const handleTokenExpiry = useCallback(
    async (error: unknown) => {
      if (error instanceof TokenExpiredError) {
        // Token expired, redirect to login
        await logout('session_expired')
        return true // Error was handled
      }
      return false // Error was not handled
    },
    [logout]
  )

  // Set up global error handler for unhandled promise rejections
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event.reason instanceof TokenExpiredError) {
        event.preventDefault() // Prevent default error logging
        handleTokenExpiry(event.reason)
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('unhandledrejection', handleUnhandledRejection)

      return () => {
        window.removeEventListener(
          'unhandledrejection',
          handleUnhandledRejection
        )
      }
    }
  }, [handleTokenExpiry])

  return { handleTokenExpiry }
}
