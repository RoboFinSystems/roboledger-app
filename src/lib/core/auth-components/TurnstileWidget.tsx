'use client'

import React, { useCallback, useEffect, useRef } from 'react'

export interface TurnstileWidgetProps {
  /** Cloudflare Turnstile site key obtained from dashboard */
  siteKey: string
  /** Callback fired when CAPTCHA verification succeeds */
  onVerify: (token: string) => void
  /** Callback fired when CAPTCHA verification fails */
  onError?: (error: string) => void
  /** Callback fired when CAPTCHA token expires */
  onExpire?: () => void
  /** Callback fired when Turnstile script loads successfully */
  onLoad?: () => void
  /** Widget theme - matches your site's color scheme */
  theme?: 'light' | 'dark' | 'auto'
  /** Widget size - use 'compact' for mobile-friendly layouts */
  size?: 'normal' | 'compact'
  /** Language code for widget text (e.g., 'en', 'es', 'fr') */
  language?: string
  /** Additional CSS classes for styling the widget container */
  className?: string
  /** Whether the widget should be disabled (prevents interaction) */
  disabled?: boolean
}

export interface TurnstileWidgetRef {
  /** Reset the widget to its initial state, clearing any verification */
  reset: () => void
  /** Get the current verification token if available */
  getResponse: () => string | undefined
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        element: HTMLElement | string,
        options: {
          sitekey: string
          callback?: (token: string) => void
          'error-callback'?: (error: string) => void
          'expired-callback'?: () => void
          theme?: 'light' | 'dark' | 'auto'
          size?: 'normal' | 'compact'
          language?: string
        }
      ) => string
      reset: (widgetId?: string) => void
      remove: (widgetId?: string) => void
      getResponse: (widgetId?: string) => string | undefined
    }
  }
}

/**
 * TurnstileWidget - A React component for Cloudflare Turnstile CAPTCHA
 *
 * This component provides a secure, privacy-focused CAPTCHA solution that:
 * - Automatically loads the Turnstile script when needed
 * - Handles widget lifecycle (render, reset, cleanup)
 * - Provides TypeScript support with comprehensive types
 * - Supports themes, languages, and different sizes
 * - Prevents memory leaks with proper cleanup
 *
 * @example
 * ```tsx
 * <TurnstileWidget
 *   siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
 *   onVerify={(token) => console.log('Verified:', token)}
 *   theme="dark"
 * />
 * ```
 */
export const TurnstileWidget = React.forwardRef<
  TurnstileWidgetRef,
  TurnstileWidgetProps
>(
  (
    {
      siteKey,
      onVerify,
      onError,
      onExpire,
      onLoad,
      theme = 'auto',
      size = 'normal',
      language,
      className = '',
      disabled = false,
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const widgetIdRef = useRef<string | null>(null)
    const scriptLoadedRef = useRef<boolean>(false)

    const loadTurnstileScript = useCallback(() => {
      if (
        scriptLoadedRef.current ||
        document.querySelector('script[src*="challenges.cloudflare.com"]')
      ) {
        return Promise.resolve()
      }

      return new Promise<void>((resolve, reject) => {
        const script = document.createElement('script')
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
        script.async = true
        script.defer = true

        script.onload = () => {
          scriptLoadedRef.current = true
          onLoad?.()
          resolve()
        }

        script.onerror = () => {
          reject(new Error('Failed to load Turnstile script'))
        }

        document.head.appendChild(script)
      })
    }, [onLoad])

    const renderWidget = useCallback(() => {
      if (!containerRef.current || !window.turnstile || !siteKey || disabled) {
        return
      }

      // Remove existing widget if present
      if (widgetIdRef.current) {
        try {
          window.turnstile.remove(widgetIdRef.current)
        } catch (error) {
          console.warn('Failed to remove existing Turnstile widget:', error)
        }
        widgetIdRef.current = null
      }

      // Clear container
      containerRef.current.innerHTML = ''

      try {
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token: string) => {
            onVerify(token)
          },
          'error-callback': (error: string) => {
            onError?.(error)
          },
          'expired-callback': () => {
            onExpire?.()
          },
          theme: theme as 'light' | 'dark' | 'auto',
          size: size as 'normal' | 'compact',
          language,
        })
      } catch (error) {
        console.error('Failed to render Turnstile widget:', error)
        onError?.('Failed to render CAPTCHA widget')
      }
    }, [siteKey, onVerify, onError, onExpire, theme, size, language, disabled])

    const reset = useCallback(() => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.reset(widgetIdRef.current)
        } catch (error) {
          console.warn('Failed to reset Turnstile widget:', error)
        }
      }
    }, [])

    const getResponse = useCallback(() => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          return window.turnstile.getResponse(widgetIdRef.current)
        } catch (error) {
          console.warn('Failed to get Turnstile response:', error)
        }
      }
      return undefined
    }, [])

    useEffect(() => {
      if (!siteKey || disabled) {
        return
      }

      const initWidget = async () => {
        try {
          await loadTurnstileScript()

          // Wait a bit for the script to fully initialize
          setTimeout(() => {
            if (window.turnstile) {
              renderWidget()
            }
          }, 100)
        } catch (error) {
          console.error('Failed to initialize Turnstile:', error)
          onError?.('Failed to load CAPTCHA')
        }
      }

      initWidget()

      return () => {
        if (widgetIdRef.current && window.turnstile) {
          try {
            window.turnstile.remove(widgetIdRef.current)
          } catch (error) {
            console.warn('Failed to cleanup Turnstile widget:', error)
          }
        }
        widgetIdRef.current = null
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [siteKey, disabled])

    // Re-render widget ONLY when theme, size, or language actually changes
    // Remove renderWidget from dependencies to prevent infinite loop
    useEffect(() => {
      if (widgetIdRef.current && window.turnstile && !disabled) {
        renderWidget()
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [theme, size, language, disabled])

    // Expose reset and getResponse methods via ref
    React.useImperativeHandle(
      ref,
      () => ({
        reset,
        getResponse,
      }),
      [reset, getResponse]
    )

    if (!siteKey || disabled) {
      return null
    }

    return (
      <div className={className}>
        <div
          ref={containerRef}
          className="flex justify-center"
          data-testid="turnstile-widget"
        />
      </div>
    )
  }
)

TurnstileWidget.displayName = 'TurnstileWidget'

/**
 * useTurnstile - React hook for simplified Turnstile integration
 *
 * This hook manages the Turnstile widget state and provides:
 * - Automatic token management
 * - Error and expiration handling
 * - Loading state tracking
 * - Pre-configured TurnstileWidget component
 *
 * @param siteKey - Your Cloudflare Turnstile site key
 * @returns Object containing token, error, loading state, and configured widget
 *
 * @example
 * ```tsx
 * const { token, error, isLoading, TurnstileWidget } = useTurnstile(siteKey)
 *
 * return (
 *   <form onSubmit={handleSubmit}>
 *     <TurnstileWidget theme="dark" />
 *     <button disabled={!token}>Submit</button>
 *   </form>
 * )
 * ```
 */
export function useTurnstile(siteKey: string) {
  const [token, setToken] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const [isExpired, setIsExpired] = React.useState(false)

  const handleVerify = useCallback((verifiedToken: string) => {
    setToken(verifiedToken)
    setError(null)
    setIsExpired(false)
    setIsLoading(false)
  }, [])

  const handleError = useCallback((errorMessage: string) => {
    setError(errorMessage)
    setToken(null)
    setIsExpired(false)
    setIsLoading(false)
  }, [])

  const handleExpire = useCallback(() => {
    setIsExpired(true)
    setToken(null)
    setError(null)
    setIsLoading(false)
  }, [])

  const handleLoad = useCallback(() => {
    setIsLoading(false)
    setError(null)
  }, [])

  const reset = useCallback(() => {
    setToken(null)
    setError(null)
    setIsExpired(false)
    setIsLoading(true)
  }, [])

  return {
    token,
    error,
    isLoading,
    isExpired,
    reset,
    TurnstileWidget: React.useCallback(
      (
        props: Omit<
          TurnstileWidgetProps,
          'siteKey' | 'onVerify' | 'onError' | 'onExpire' | 'onLoad'
        >
      ) => (
        <TurnstileWidget
          siteKey={siteKey}
          onVerify={handleVerify}
          onError={handleError}
          onExpire={handleExpire}
          onLoad={handleLoad}
          {...props}
        />
      ),
      [siteKey, handleVerify, handleError, handleExpire, handleLoad]
    ),
  }
}
