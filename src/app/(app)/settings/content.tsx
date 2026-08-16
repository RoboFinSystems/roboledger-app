'use client'

import { getLoginHomeName } from '@robosystems/core/auth-core/config'
import { useCrossAppLink } from '@robosystems/core/hooks'
import { ACCOUNT_SETTINGS_PATH } from '@robosystems/core/ui-components/layout'
import { Card, Spinner } from 'flowbite-react'
import { useCallback, useEffect, useRef, useState } from 'react'
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
 * browser, not by our code.
 *
 * Since core 0.8.3 the sidebar cog and the navbar menu item hand off to the
 * login home directly, so nobody arrives here by clicking — only by deep
 * link, bookmark, or a stale tab. Those are all cases where the user already
 * asked for settings, so forward on mount instead of asking them to confirm
 * a destination they didn't choose in the first place.
 *
 * Same tab, deliberately: a `window.open` on mount has no user gesture
 * behind it and would be blocked outright, and replacing this tab is what
 * navigating to /settings meant.
 */
export function UserSettingsContent() {
  const { openLoginHome } = useCrossAppLink(API_URL)
  const [failed, setFailed] = useState(false)
  const hostAppName = getLoginHomeName()

  // Effects run twice under StrictMode in dev; the SSO exchange is a real
  // round-trip, so only let the first one through.
  const startedRef = useRef(false)

  const forward = useCallback(async () => {
    setFailed(false)
    const opened = await openLoginHome({
      path: ACCOUNT_SETTINGS_PATH,
      target: '_self',
    })
    if (!opened) {
      setFailed(true)
    }
  }, [openLoginHome])

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true
    void forward()
  }, [forward])

  if (!failed) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
        <Spinner size="xl" />
        <p className="text-gray-600 dark:text-gray-400">
          Taking you to your {hostAppName} account settings...
        </p>
      </div>
    )
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="max-w-md text-center">
        <h2 className="font-heading text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          Account Settings
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          We couldn&apos;t open your account settings just now. Your profile,
          password, passkeys and API keys are managed on the {hostAppName}{' '}
          platform — changes there apply across every app.
        </p>
        <button
          onClick={() => void forward()}
          className="bg-primary-700 hover:bg-primary-800 focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800 inline-flex w-full items-center justify-center rounded-lg px-5 py-3 text-center text-base font-medium text-white focus:ring-4 disabled:opacity-50"
        >
          <HiExternalLink className="mr-2 h-5 w-5" />
          Try again
        </button>
      </Card>
    </div>
  )
}
