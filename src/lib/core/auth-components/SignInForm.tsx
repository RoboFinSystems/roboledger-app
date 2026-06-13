'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { RoboSystemsAuthClient } from '../auth-core/client'
import { getAppConfig } from '../auth-core/config'
import { useSSO } from '../auth-core/sso'
import type { AuthUser } from '../auth-core/types'
import { LogoBadge, Spinner } from '../ui-components'

export interface SignInFormProps {
  onSuccess?: (user: AuthUser) => void
  onRedirect?: (url: string) => void
  redirectTo?: string
  className?: string
  apiUrl: string
  enableSSO?: boolean
  currentApp?: string
}

/**
 * Map a login failure to a user-facing message. A connectivity failure (the
 * request never reached the server — `fetch` throws a `TypeError`) must NOT be
 * reported as bad credentials: that sends users to reset a password that is
 * actually correct. Reached-server auth rejection (401/403, or an empty/invalid
 * auth body) stays "Invalid email or password"; 5xx gets its own message.
 */
export function loginErrorMessage(error: unknown): string {
  const err = error as {
    status?: number
    response?: { status?: number }
    message?: string
  }
  const status = err?.status ?? err?.response?.status
  const message = String(err?.message ?? '')

  if (
    error instanceof TypeError ||
    /failed to fetch|networkerror|load failed|fetch failed|err_(connection|network|name_not_resolved)/i.test(
      message
    )
  ) {
    return 'Unable to reach the server. Check your connection and try again.'
  }
  if (typeof status === 'number' && status >= 500) {
    return 'The server ran into a problem. Please try again in a moment.'
  }
  return 'Invalid email or password'
}

export function SignInForm({
  onSuccess,
  onRedirect,
  redirectTo = '/home',
  className = '',
  apiUrl,
  enableSSO = true,
  currentApp,
}: SignInFormProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [ssoChecking, setSSOChecking] = useState(enableSSO)
  const [redirecting, setRedirecting] = useState(false)

  const authClient = useMemo(() => new RoboSystemsAuthClient(apiUrl), [apiUrl])
  const { checkSSOAuthentication, handleSSOLogin } = useSSO(apiUrl)

  // Check for existing authentication or SSO login on mount
  useEffect(() => {
    if (!enableSSO) return

    const checkAuth = async () => {
      try {
        // Capture returnUrl before handleSSOLogin cleans up URL params
        const urlParams = new URLSearchParams(window.location.search)
        const ssoReturnUrl = urlParams.get('returnUrl')

        // Check for SSO login from URL parameters
        const ssoUser = await handleSSOLogin()
        if (ssoUser) {
          setRedirecting(true)
          if (onSuccess) {
            onSuccess(ssoUser)
          }
          // handleSSOLogin schedules navigation to returnUrl if present;
          // only redirect to the default if no returnUrl was specified
          if (!ssoReturnUrl) {
            window.location.href = redirectTo
          }
          return
        }

        // Check if user is already authenticated via regular session
        try {
          const existingUser = await checkSSOAuthentication()
          if (existingUser) {
            setRedirecting(true)
            if (onSuccess) {
              onSuccess(existingUser)
            }
            window.location.href = redirectTo
            return
          }
        } catch {
          // User not authenticated, continue to login form
        }

        // Only hide spinner if authentication failed
        setSSOChecking(false)
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Auth check failed:', error)
        }
        setSSOChecking(false)
      }
    }

    checkAuth()
  }, [
    enableSSO,
    redirectTo,
    onSuccess,
    handleSSOLogin,
    checkSSOAuthentication,
    authClient,
  ])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await authClient.login(formData.email, formData.password)

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess(result.user)
      }

      // Set redirecting state to keep showing loading
      setRedirecting(true)

      // Use window.location.href for reliable redirect
      window.location.href = redirectTo
    } catch (error: unknown) {
      setError(loginErrorMessage(error))
      setLoading(false)
    }
  }

  const handleSignUpClick = () => {
    if (onRedirect) {
      onRedirect('/register')
    } else {
      window.location.href = '/register'
    }
  }

  // Determine app name based on currentApp prop
  const appName = getAppConfig(currentApp || 'robosystems').displayName

  if (ssoChecking || redirecting) {
    return (
      <div className="via-primary-950 flex min-h-screen items-center justify-center bg-linear-to-br from-black to-zinc-900 p-6">
        <div className="w-full max-w-md">
          <div className="text-center">
            <LogoBadge animate="loop" className="mx-auto h-16 w-16" />
            <h1 className="font-heading mt-4 text-center text-2xl font-semibold tracking-tight text-white">
              {appName}
            </h1>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="via-primary-950 flex min-h-screen items-center justify-center bg-linear-to-br from-black to-zinc-900 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-lg space-y-8">
        <div className="text-center">
          <LogoBadge animate="once" className="mx-auto h-14 w-14" />
          <h1 className="font-heading mt-4 text-center text-2xl font-semibold tracking-tight text-white">
            {appName}
          </h1>
          <h2 className="mt-2 text-center text-xl font-semibold tracking-tight text-gray-300">
            Sign in to your account
          </h2>
        </div>
        <form
          className={['mt-8 space-y-6', className].filter(Boolean).join(' ')}
          onSubmit={handleSubmit}
        >
          {error && (
            <div className="rounded-md border border-red-800 bg-red-900/50 p-4">
              <div className="text-sm text-red-300">{error}</div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="focus:ring-primary-500 relative block w-full rounded-md border-0 bg-gray-800 px-5 py-4 text-base leading-7 text-white ring-1 ring-gray-600 ring-inset placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset"
                placeholder="Email address"
                disabled={loading || redirecting}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={handleInputChange}
                className="focus:ring-primary-500 relative block w-full rounded-md border-0 bg-gray-800 px-5 py-4 text-base leading-7 text-white ring-1 ring-gray-600 ring-inset placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset"
                placeholder="Password"
                disabled={loading || redirecting}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || redirecting}
              className="group bg-primary-600 hover:bg-primary-700 focus-visible:outline-primary-500 relative flex w-full justify-center rounded-md px-4 py-3 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading && <Spinner size="sm" className="mr-2 border-white" />}
              {redirecting
                ? 'Redirecting...'
                : loading
                  ? 'Signing in...'
                  : 'Sign in'}
            </button>
          </div>

          <div className="flex flex-col items-center gap-2">
            <a
              href="/auth/forgot-password"
              className="hover:text-primary-400 text-sm text-gray-300"
            >
              Forgot password?
            </a>
            <button
              type="button"
              onClick={handleSignUpClick}
              className="hover:text-primary-400 text-sm font-medium text-gray-300"
            >
              Don't have an account? Sign up
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
