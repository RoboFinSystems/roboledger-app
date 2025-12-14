'use client'

import Image from 'next/image'
import React, { useEffect, useMemo, useState } from 'react'
import { RoboSystemsAuthClient } from '../auth-core/client'
import { getAppConfig } from '../auth-core/config'
import { useSSO } from '../auth-core/sso'
import type { AuthUser } from '../auth-core/types'
import { Spinner } from '../ui-components'

export interface SignInFormProps {
  onSuccess?: (user: AuthUser) => void
  onRedirect?: (url: string) => void
  redirectTo?: string
  className?: string
  apiUrl: string
  enableSSO?: boolean
  currentApp?: string
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
        // Check for SSO login from URL parameters
        const ssoUser = await handleSSOLogin()
        if (ssoUser) {
          setRedirecting(true)
          if (onSuccess) {
            onSuccess(ssoUser)
          }
          window.location.href = redirectTo
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
    } catch (error: any) {
      setError('Invalid email or password')
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
      <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-black via-gray-900 to-zinc-800 p-6">
        <div className="w-full max-w-md">
          <div className="text-center">
            <Image
              className="mx-auto h-12 w-auto"
              src="/images/logo.png"
              alt="Logo"
              width={48}
              height={48}
            />
            <h1 className="font-heading mt-4 text-center text-2xl font-semibold tracking-tight text-white">
              {appName}
            </h1>
            <div className="mt-6 flex justify-center">
              <Spinner size="xl" className="border-gray-300" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-black via-gray-900 to-zinc-800 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Image
            className="mx-auto h-12 w-auto"
            src="/images/logo.png"
            alt="Logo"
            width={48}
            height={48}
          />
          <h1 className="font-heading mt-4 text-center text-2xl font-semibold tracking-tight text-white">
            {appName}
          </h1>
          <h2 className="mt-6 text-center text-xl font-semibold tracking-tight text-gray-300">
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
                className="relative block w-full rounded-md border-0 bg-gray-800 px-4 py-3 text-white ring-1 ring-gray-600 ring-inset placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-white focus:ring-inset sm:text-sm sm:leading-6"
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
                className="relative block w-full rounded-md border-0 bg-gray-800 px-4 py-3 text-white ring-1 ring-gray-600 ring-inset placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-white focus:ring-inset sm:text-sm sm:leading-6"
                placeholder="Password"
                disabled={loading || redirecting}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || redirecting}
              className="group relative flex w-full justify-center rounded-md bg-white px-4 py-3 text-sm font-semibold text-black hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white focus-visible:outline-solid disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading && <Spinner size="sm" className="mr-2 border-black" />}
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
              className="text-sm text-gray-300 hover:text-white"
            >
              Forgot password?
            </a>
            <button
              type="button"
              onClick={handleSignUpClick}
              className="text-sm font-medium text-gray-300 hover:text-white"
            >
              Don't have an account? Sign up
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
