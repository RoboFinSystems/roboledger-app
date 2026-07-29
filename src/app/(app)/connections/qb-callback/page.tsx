'use client'

import { LoadingState, SDK, useGraphContext } from '@robosystems/core'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

/** How long to wait for a graph selection before giving up on the callback. */
const NO_GRAPH_TIMEOUT_MS = 15_000

export default function QuickBooksCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const {
    state: { currentGraphId },
  } = useGraphContext()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    'loading'
  )
  const [error, setError] = useState<string>('')
  const attemptedRef = useRef(false)

  // Intuit reports a user-initiated cancel as ?error=access_denied. That isn't
  // a system failure and needs no graph context, so handle it before the gate
  // below — otherwise declining at Intuit rendered "Missing authorization code
  // or realm ID from QuickBooks", which reads as something being broken.
  useEffect(() => {
    const oauthError = searchParams.get('error')
    if (!oauthError || attemptedRef.current) return
    attemptedRef.current = true
    setError(
      oauthError === 'access_denied'
        ? 'Connection canceled — access was declined at QuickBooks. You can start the connection again whenever you like.'
        : `QuickBooks reported an error: ${oauthError}`
    )
    setStatus('error')
  }, [searchParams])

  // Without a restorable graph selection (cleared cookies, OAuth started in a
  // different browser profile) currentGraphId never arrives and the effect
  // below returns forever, leaving the user on "Connecting to QuickBooks…"
  // with no way out. Fail with an explanation instead of hanging.
  useEffect(() => {
    if (currentGraphId || attemptedRef.current) return
    const timer = setTimeout(() => {
      if (attemptedRef.current) return
      attemptedRef.current = true
      setError(
        'No graph is selected, so this connection has nowhere to attach. Open Connections, pick a graph, and start the QuickBooks connection again.'
      )
      setStatus('error')
    }, NO_GRAPH_TIMEOUT_MS)
    return () => clearTimeout(timer)
  }, [currentGraphId])

  useEffect(() => {
    // Wait for graph context to load
    if (!currentGraphId) return
    // Only attempt once
    if (attemptedRef.current) return
    attemptedRef.current = true

    const handleCallback = async () => {
      try {
        const code = searchParams.get('code')
        const realmId = searchParams.get('realmId')
        const state = searchParams.get('state')

        if (!code || !realmId) {
          setError(
            'This QuickBooks callback link has no authorization code — it was probably already used or opened directly. Start the connection again from Connections.'
          )
          setStatus('error')
          return
        }

        // Send callback data to backend
        const response = await SDK.oauthCallback({
          path: {
            graph_id: currentGraphId,
            provider: 'quickbooks',
          },
          body: {
            code,
            state,
            realm_id: realmId,
          },
        })

        if (response.data?.success) {
          // The authorization code is single-use. Strip it so that refreshing
          // this page during the redirect delay can't resubmit a spent code and
          // turn a connection that already succeeded into "Connection Failed".
          window.history.replaceState({}, '', '/connections/qb-callback')
          setStatus('success')
          setTimeout(() => {
            router.push('/connections?success=quickbooks-connected')
          }, 2000)
        } else {
          // The response carries a message now that it's typed; prefer it over
          // a generic string when the server explains what went wrong.
          setError(
            response.data?.message ??
              'Failed to establish QuickBooks connection'
          )
          setStatus('error')
        }
      } catch (err) {
        console.error('QuickBooks callback error:', err)
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to process QuickBooks callback'
        )
        setStatus('error')
      }
    }

    handleCallback()
  }, [currentGraphId, searchParams, router])

  if (status === 'loading') {
    return (
      <LoadingState
        message="Connecting to QuickBooks..."
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
            QuickBooks Connected Successfully!
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Redirecting you back to connections...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
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
          Connection Failed
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-300">{error}</p>
        <button
          onClick={() => router.push('/connections')}
          className="bg-primary-600 hover:bg-primary-700 mt-4 rounded-md px-4 py-2 text-white"
        >
          Back to Connections
        </button>
      </div>
    </div>
  )
}
