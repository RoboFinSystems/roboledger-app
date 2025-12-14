'use client'

import Image from 'next/image'
import React, { useState } from 'react'
import { RoboSystemsAuthClient } from '../auth-core/client'
import { getAppConfig } from '../auth-core/config'
import type { AuthUser } from '../auth-core/types'
import { Spinner } from '../ui-components'
import { TurnstileWidget } from './TurnstileWidget'

export interface SignUpFormProps {
  onSuccess?: (user: AuthUser) => void
  onRedirect?: (url: string) => void
  redirectTo?: string
  className?: string
  showConfirmPassword?: boolean
  showTermsAcceptance?: boolean
  autoSignIn?: boolean
  apiUrl: string
  currentApp?: string
  turnstileSiteKey?: string // Cloudflare Turnstile site key for CAPTCHA
}

export function SignUpForm({
  onSuccess,
  onRedirect,
  redirectTo = '/login',
  className = '',
  showConfirmPassword = true,
  showTermsAcceptance = true,
  autoSignIn = false,
  apiUrl,
  currentApp,
  turnstileSiteKey,
}: SignUpFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [captchaError, setCaptchaError] = useState<string | null>(null)

  const authClient = new RoboSystemsAuthClient(apiUrl)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleCaptchaVerify = (token: string) => {
    setCaptchaToken(token)
    setCaptchaError(null)
  }

  const handleCaptchaError = (error: string) => {
    setCaptchaError(error)
    setCaptchaToken(null)
  }

  const handleCaptchaExpire = () => {
    setCaptchaToken(null)
    setCaptchaError('CAPTCHA expired. Please verify again.')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setCaptchaError(null)

    // Validate confirm password if enabled
    if (showConfirmPassword && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    // Check CAPTCHA if site key is provided (production mode)
    if (turnstileSiteKey && !captchaToken) {
      setError('Please complete the security verification to continue')
      setLoading(false)
      return
    }

    try {
      const result = await authClient.register(
        formData.email,
        formData.password,
        formData.name,
        captchaToken || undefined
      )

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess(result.user)
      }

      // Use window.location.href for reliable redirect
      window.location.href = redirectTo
    } catch (error: any) {
      // Check if it's a CAPTCHA-related error
      if (
        error?.message?.includes('CAPTCHA') ||
        error?.message?.includes('captcha')
      ) {
        setError(
          error.message || 'CAPTCHA verification failed. Please try again.'
        )
        // Reset CAPTCHA on failure
        setCaptchaToken(null)
      } else {
        setError(error?.message || 'Registration failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSignInClick = () => {
    if (onRedirect) {
      onRedirect('/login')
    } else {
      window.location.href = '/login'
    }
  }

  const handleTermsClick = (link: string) => {
    if (onRedirect) {
      onRedirect(link)
    } else {
      window.location.href = link
    }
  }

  // Determine app name based on currentApp prop
  const appName = getAppConfig(currentApp || 'robosystems').displayName

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
            Create your account
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

          {captchaError && (
            <div className="rounded-md border border-red-800 bg-red-900/50 p-4">
              <div className="text-sm text-red-300">{captchaError}</div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="sr-only">
                Full name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={formData.name}
                onChange={handleInputChange}
                className="relative block w-full rounded-md border-0 bg-gray-800 px-4 py-3 text-white ring-1 ring-gray-600 ring-inset placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-white focus:ring-inset sm:text-sm sm:leading-6"
                placeholder="Full name"
                disabled={loading}
              />
            </div>
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
                disabled={loading}
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
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleInputChange}
                className="relative block w-full rounded-md border-0 bg-gray-800 px-4 py-3 text-white ring-1 ring-gray-600 ring-inset placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-white focus:ring-inset sm:text-sm sm:leading-6"
                placeholder="Password"
                disabled={loading}
              />
            </div>
            {showConfirmPassword && (
              <div>
                <label htmlFor="confirmPassword" className="sr-only">
                  Confirm password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="relative block w-full rounded-md border-0 bg-gray-800 px-4 py-3 text-white ring-1 ring-gray-600 ring-inset placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-white focus:ring-inset sm:text-sm sm:leading-6"
                  placeholder="Confirm password"
                  disabled={loading}
                />
              </div>
            )}
          </div>

          {/* CAPTCHA Widget - only show if site key is provided (production) */}
          {turnstileSiteKey && (
            <div className="flex justify-center">
              <TurnstileWidget
                siteKey={turnstileSiteKey}
                onVerify={handleCaptchaVerify}
                onError={handleCaptchaError}
                onExpire={handleCaptchaExpire}
                theme="dark"
                className="flex justify-center"
                disabled={loading}
              />
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading || (turnstileSiteKey && !captchaToken)}
              className="group relative flex w-full justify-center rounded-md bg-white px-4 py-3 text-sm font-semibold text-black hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white focus-visible:outline-solid disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading && <Spinner size="sm" className="mr-2 border-black" />}
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </div>

          {showTermsAcceptance && (
            <div className="text-center text-xs text-gray-400">
              By creating an account, you agree to our{' '}
              <a
                href="/pages/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-gray-300 hover:text-white"
              >
                Terms of Service
              </a>{' '}
              and{' '}
              <a
                href="/pages/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-gray-300 hover:text-white"
              >
                Privacy Policy
              </a>
            </div>
          )}

          <div className="text-center">
            <button
              type="button"
              onClick={handleSignInClick}
              className="font-medium text-gray-300 hover:text-white"
            >
              Already have an account? Sign in
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
