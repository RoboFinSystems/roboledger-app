'use client'

import { useSSO } from '@robosystems/core/auth-core/sso'
import { Card } from 'flowbite-react'
import { useState } from 'react'
import { HiExternalLink } from 'react-icons/hi'

const API_URL =
  process.env.NEXT_PUBLIC_ROBOSYSTEMS_API_URL || 'http://localhost:8000'

/**
 * Account settings live on the login home, not here.
 *
 * Identity, password, passkeys and API keys are account-global — one user
 * across every product app — and the passkey surface in particular *cannot*
 * render here: WebAuthn binds credentials to a single Relying Party ID (the
 * login home's domain), so a ceremony from this origin is rejected by the
 * browser, not by our code. Rather than ship a settings page that silently
 * omits half the account surface, forward to the one place all of it works.
 *
 * Same pattern as /graphs/new — keep the route so deep links, the sidebar
 * cog and the navbar menu item all still resolve.
 */
export function UserSettingsContent() {
  const { navigateToApp } = useSSO(API_URL)
  const [navigating, setNavigating] = useState(false)

  const handleNavigate = async () => {
    setNavigating(true)
    try {
      await navigateToApp('robosystems', '/settings')
    } catch {
      setNavigating(false)
    }
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="max-w-md text-center">
        <h2 className="font-heading text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          Account Settings
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Your profile, password, passkeys and API keys are managed on the
          RoboSystems platform. Changes there apply across every app.
        </p>
        <button
          onClick={handleNavigate}
          disabled={navigating}
          className="bg-primary-700 hover:bg-primary-800 focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800 inline-flex w-full items-center justify-center rounded-lg px-5 py-3 text-center text-base font-medium text-white focus:ring-4 disabled:opacity-50"
        >
          <HiExternalLink className="mr-2 h-5 w-5" />
          {navigating ? 'Redirecting...' : 'Go to RoboSystems'}
        </button>
      </Card>
    </div>
  )
}
