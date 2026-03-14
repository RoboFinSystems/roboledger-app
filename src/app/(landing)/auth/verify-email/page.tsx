'use client'

import { useAuth } from '@/lib/core/auth-components/AuthProvider'
import { Spinner } from 'flowbite-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useRef, useState } from 'react'
import { HiCheckCircle, HiExclamationCircle } from 'react-icons/hi'

function VerifyEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { verifyEmail } = useAuth()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    'loading'
  )
  const [message, setMessage] = useState<string>('')
  const verifyAttempted = useRef(false)

  useEffect(() => {
    if (verifyAttempted.current) return
    verifyAttempted.current = true

    let timeoutId: NodeJS.Timeout | null = null

    const verifyEmailToken = async () => {
      const token = searchParams.get('token')

      if (!token) {
        setStatus('error')
        setMessage('No verification token provided')
        return
      }

      try {
        const result = await verifyEmail(token)

        if (result.success) {
          setStatus('success')
          setMessage(result.message || 'Email verified successfully!')

          // Redirect to home after 3 seconds
          timeoutId = setTimeout(() => {
            router.push('/home')
          }, 3000)
        } else {
          setStatus('error')
          setMessage(result.message || 'Failed to verify email')
        }
      } catch (error) {
        setStatus('error')
        setMessage('An unexpected error occurred during verification')
      }
    }

    verifyEmailToken()

    // Cleanup function to clear timeout
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [searchParams, verifyEmail, router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md space-y-8 p-6">
        <div className="text-center">
          {status === 'loading' && (
            <>
              <Spinner size="xl" className="mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Verifying Your Email
              </h2>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Please wait while we verify your email address...
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <HiCheckCircle className="mx-auto mb-4 h-16 w-16 text-green-500" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Email Verified!
              </h2>
              <p className="mt-2 text-gray-600 dark:text-gray-400">{message}</p>
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                Redirecting...
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <HiExclamationCircle className="mx-auto mb-4 h-16 w-16 text-red-500" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Verification Failed
              </h2>
              <p className="mt-2 text-gray-600 dark:text-gray-400">{message}</p>
              <div className="mt-6">
                <button
                  onClick={() => router.push('/login')}
                  className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Go to Login
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="w-full max-w-md space-y-8 p-6">
            <div className="text-center">
              <Spinner size="xl" className="mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Loading...
              </h2>
            </div>
          </div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  )
}
