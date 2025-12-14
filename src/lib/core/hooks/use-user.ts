'use client'

import { useMemo } from 'react'
import { useAuth } from '../auth-components'
import type { User } from '../types'

export function useUser() {
  const { user: authUser, isLoading, isAuthenticated } = useAuth()

  // Transform AuthUser to User format with graceful defaults for malformed data
  const user = useMemo(() => {
    if (!authUser) return null

    // If authUser is not an object, return null
    if (typeof authUser !== 'object' || authUser === null) {
      if (
        process.env.NODE_ENV === 'development' &&
        typeof jest === 'undefined'
      ) {
        console.warn('AuthUser is not a valid object:', authUser)
      }
      return null
    }

    // Gracefully handle malformed user data by providing safe defaults
    const safeId = typeof authUser.id === 'string' ? authUser.id : ''
    const safeEmail = typeof authUser.email === 'string' ? authUser.email : ''
    const safeName = typeof authUser.name === 'string' ? authUser.name : ''

    // Log warnings for malformed data in development (but not in tests)
    if (process.env.NODE_ENV === 'development' && typeof jest === 'undefined') {
      if (typeof authUser.id !== 'string' || !authUser.id) {
        console.warn('AuthUser has invalid id field:', authUser.id)
      }
      if (typeof authUser.email !== 'string' || !authUser.email) {
        console.warn('AuthUser has invalid email field:', authUser.email)
      }
    }

    return {
      id: safeId,
      name: safeName,
      email: safeEmail,
    } satisfies User
  }, [authUser])

  return { user, isLoading, isAuthenticated }
}
