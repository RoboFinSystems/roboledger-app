'use client'
import { useAuth } from '@/lib/core/auth-components'
import { BrandSpinner } from '@/lib/core/ui-components'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import LandingPageContent from './content'
import MaintenancePage from './maintenance'

// Client gate: redirects authed users to /home, honors maintenance mode, and otherwise
// renders the public landing content. Split out so the route's page.tsx can be a server
// component that exports metadata + structured data.
export default function LandingGate() {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuth()
  const [isRedirecting, setIsRedirecting] = useState(false)

  // Check if this is an SSO login attempt
  const isSSO =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).has('session_id')

  // Redirect authenticated users to /home
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      setIsRedirecting(true)
      // Longer delay to prevent any flash and use replace for smoother transition
      setTimeout(() => {
        router.replace('/home')
      }, 300)
    }
  }, [isAuthenticated, isLoading, router])

  if (process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true' && !isSSO) {
    return <MaintenancePage />
  }

  // Show loading state while checking authentication or redirecting
  if (isLoading || isRedirecting) {
    return <BrandSpinner fullScreen size="lg" />
  }

  // Only show landing page if user is not authenticated
  return <LandingPageContent />
}
