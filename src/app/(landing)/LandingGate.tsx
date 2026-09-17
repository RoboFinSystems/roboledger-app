'use client'
import { useAuth } from '@robosystems/core/auth-components'
import { BrandSpinner } from '@robosystems/core/ui-components'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import LandingPageContent from './content'
import MaintenancePage from './maintenance'

// Client gate: redirects authed users to /home, honors maintenance mode, and otherwise
// renders the public landing content. Split out so the route's page.tsx can be a server
// component that exports metadata + structured data.
//
// The landing content always renders, and the loader covers it while auth resolves. The
// server pass has no session yet, so returning only the loader there shipped an empty
// homepage to every crawler that does not run JavaScript (Bing, the AI crawlers): no
// heading, no copy, no links (2026-09-16).
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

  // Covered while checking authentication, and for a signed-in user until the redirect
  // lands, so they never see the marketing page flash.
  const covered = isLoading || isRedirecting || isAuthenticated

  return (
    <>
      <LandingPageContent />
      {covered && (
        <div
          data-testid="landing-gate-cover"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-50 dark:bg-black"
        >
          <BrandSpinner size="lg" />
        </div>
      )}
    </>
  )
}
