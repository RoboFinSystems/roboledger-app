'use client'

import {
  completePlaidLink,
  openPlaidLink,
  plaidRefusalMessage,
  takePendingPlaidLink,
} from '@/lib/plaid-link'
import { LoadingState } from '@robosystems/core'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

// Where a bank that signs in through OAuth sends the user back. Link is
// opened again here with the same token and the redirect it received, and
// hands back the public token that completes the connection.
export default function PlaidCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    'loading'
  )
  const [error, setError] = useState<string>('')
  const attemptedRef = useRef(false)

  useEffect(() => {
    if (attemptedRef.current) return
    attemptedRef.current = true

    const pending = takePendingPlaidLink()
    if (!searchParams.get('oauth_state_id') || !pending) {
      setError(
        'This bank sign-in link has nothing to resume — it was probably already used or opened directly. Start the connection again from Connections.'
      )
      setStatus('error')
      return
    }

    void openPlaidLink({
      token: pending.linkToken,
      receivedRedirectUri: window.location.href,
      onSuccess: (publicToken) => {
        void completePlaidLink({
          graphId: pending.graphId,
          publicToken,
          state: pending.state,
        }).then(
          () => {
            // The return is single-use; strip it so a refresh cannot
            // resubmit it and report a failure after success.
            window.history.replaceState({}, '', '/connections/plaid-callback')
            setStatus('success')
            setTimeout(() => {
              router.push('/connections?success=bank-connected')
            }, 2000)
          },
          (err: unknown) => {
            setError(
              plaidRefusalMessage(err, 'The bank could not be connected')
            )
            setStatus('error')
          }
        )
      },
      onExit: (exitError) => {
        setError(
          exitError
            ? exitError.display_message ||
                exitError.error_message ||
                'The bank reported an error. Start the connection again from Connections.'
            : 'Connection canceled — nothing was linked. You can start the connection again whenever you like.'
        )
        setStatus('error')
      },
    }).catch((err: unknown) => {
      setError(plaidRefusalMessage(err, 'Plaid Link could not be opened'))
      setStatus('error')
    })
  }, [router, searchParams])

  if (status === 'loading') {
    return (
      <LoadingState
        message="Finishing the bank sign-in..."
        size="xl"
        className="min-h-[60vh]"
      />
    )
  }

  if (status === 'success') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-8 w-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Bank Connected
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Your first sync is running. Redirecting you back to connections...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <svg
            className="h-8 w-8 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Bank Not Connected
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-300">{error}</p>
        <button
          type="button"
          onClick={() => router.push('/connections')}
          className="bg-primary-600 hover:bg-primary-700 mt-6 rounded-lg px-4 py-2 text-sm font-medium text-white"
        >
          Back to Connections
        </button>
      </div>
    </div>
  )
}
