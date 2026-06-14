// @ts-nocheck - connections functionality removed from SDK, pending overhaul
'use client'

import { LoadingState, SDK, useGraphContext } from '@/lib/core'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

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
          setError('Missing authorization code or realm ID from QuickBooks')
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

        if ((response.data as any)?.success) {
          setStatus('success')
          setTimeout(() => {
            router.push('/connections?success=quickbooks-connected')
          }, 2000)
        } else {
          setError('Failed to establish QuickBooks connection')
          setStatus('error')
        }
      } catch (error: any) {
        console.error('QuickBooks callback error:', error)
        setError(error.message || 'Failed to process QuickBooks callback')
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
