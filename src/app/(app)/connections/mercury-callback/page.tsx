'use client'

import { friendlyError } from '@/lib/ledger/errors'
import { LoadingState, SDK, useGraphContext } from '@robosystems/core'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

/** How long to wait for a graph selection before giving up on the callback. */
const NO_GRAPH_TIMEOUT_MS = 15_000

// The registered Mercury redirect URI. Mercury sends `code` + `state` back
// here (no realm — one consent is one organization); the backend exchanges
// the code, records the consent and starts the first sync.
export default function MercuryCallbackPage() {
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

  // A decline at Mercury arrives as ?error=access_denied — a user choice,
  // not a system failure, and it needs no graph context.
  useEffect(() => {
    const oauthError = searchParams.get('error')
    if (!oauthError || attemptedRef.current) return
    attemptedRef.current = true
    const description = searchParams.get('error_description')
    setError(
      oauthError === 'access_denied'
        ? 'Connection canceled — access was declined at Mercury. You can start the connection again whenever you like.'
        : `Mercury reported an error: ${description || oauthError}`
    )
    setStatus('error')
  }, [searchParams])

  // Without a restorable graph selection the effect below never fires; fail
  // with an explanation instead of hanging on the spinner.
  useEffect(() => {
    if (currentGraphId || attemptedRef.current) return
    const timer = setTimeout(() => {
      if (attemptedRef.current) return
      attemptedRef.current = true
      setError(
        'No graph is selected, so this connection has nowhere to attach. Open Connections, pick a graph, and start the Mercury connection again.'
      )
      setStatus('error')
    }, NO_GRAPH_TIMEOUT_MS)
    return () => clearTimeout(timer)
  }, [currentGraphId])

  useEffect(() => {
    if (!currentGraphId) return
    if (attemptedRef.current) return
    attemptedRef.current = true

    const handleCallback = async () => {
      try {
        const code = searchParams.get('code')
        const state = searchParams.get('state')

        if (!code || !state) {
          setError(
            'This Mercury callback link has no authorization code — it was probably already used or opened directly. Start the connection again from Connections.'
          )
          setStatus('error')
          return
        }

        const response = await SDK.oauthCallback({
          path: { graph_id: currentGraphId, provider: 'mercury' },
          body: { code, state },
        })

        if (response.data?.success) {
          // The authorization code is single-use; strip it so a refresh
          // cannot resubmit a spent code and report a failure after success.
          window.history.replaceState({}, '', '/connections/mercury-callback')
          setStatus('success')
          setTimeout(() => {
            router.push('/connections?success=mercury-connected')
          }, 2000)
        } else {
          setError(
            response.data?.message ?? 'Failed to establish Mercury connection'
          )
          setStatus('error')
        }
      } catch (err) {
        console.error('Mercury callback error:', err)
        // The SDK's error carries FastAPI's JSON envelope; never show it raw.
        setError(
          err instanceof Error
            ? friendlyError(err.message).message
            : 'Failed to process Mercury callback'
        )
        setStatus('error')
      }
    }

    handleCallback()
  }, [currentGraphId, searchParams, router])

  if (status === 'loading') {
    return (
      <LoadingState
        message="Connecting to Mercury..."
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
            Mercury Connected Successfully!
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
