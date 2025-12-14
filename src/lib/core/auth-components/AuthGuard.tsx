'use client'

import { useRouter } from 'next/navigation'
import type { PropsWithChildren } from 'react'
import { useEffect } from 'react'
import { Spinner } from '../ui-components'
import { useAuth } from './AuthProvider'

interface AuthGuardProps extends PropsWithChildren {
  redirectTo?: string
  loadingComponent?: React.ReactNode
}

export function AuthGuard({
  children,
  redirectTo = '/login',
  loadingComponent,
}: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      try {
        router.push(redirectTo)
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          // Fallback to window.location if router.push fails
          console.error(
            'Router push failed, using window.location fallback:',
            error
          )
        }
        window.location.href = redirectTo
      }
    }
  }, [isAuthenticated, isLoading, router, redirectTo])

  if (isLoading) {
    return loadingComponent || <Spinner size="xl" fullScreen />
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}
