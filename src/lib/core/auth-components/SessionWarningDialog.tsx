'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from './AuthProvider'

export function SessionWarningDialog() {
  const { sessionWarning, refreshSession, logout } = useAuth()
  const [countdown, setCountdown] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    if (sessionWarning.show && sessionWarning.timeLeft > 0) {
      setCountdown(sessionWarning.timeLeft)
    }
  }, [sessionWarning])

  useEffect(() => {
    if (!sessionWarning.show || countdown <= 0) return

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Time's up, logout
          logout()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [sessionWarning.show, countdown, logout])

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await refreshSession(true) // Force refresh to bypass cooldown
      // Success - dialog will be hidden by AuthProvider
    } catch (error) {
      console.error('Failed to refresh session:', error)
      // Error handling - user will see the error
    } finally {
      setIsRefreshing(false)
    }
  }, [refreshSession])

  const handleLogout = useCallback(async () => {
    await logout()
  }, [logout])

  if (!sessionWarning.show) return null

  const minutes = Math.floor(countdown / 60)
  const seconds = countdown % 60

  return (
    <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
      <div className="mx-4 max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
        <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
          Session Expiring Soon
        </h2>
        <p className="mb-6 text-gray-600 dark:text-gray-300">
          Your session will expire in{' '}
          <span className="font-semibold text-red-600 dark:text-red-400">
            {minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`}
          </span>
          . Would you like to stay logged in?
        </p>
        <div className="flex gap-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex-1 rounded-lg bg-blue-700 px-4 py-2 text-white hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 focus:outline-none disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
          >
            {isRefreshing ? 'Refreshing...' : 'Stay Logged In'}
          </button>
          <button
            onClick={handleLogout}
            className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 dark:focus:ring-gray-700"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}
