'use client'

import { Alert, Button } from 'flowbite-react'
import { useRouter } from 'next/navigation'
import React, { useEffect } from 'react'
import { HiExclamation } from 'react-icons/hi'
import { useCreditContext } from '../contexts/credit-context'
import { useToast } from '../hooks/use-toast'

interface CreditAlert {
  type: 'warning' | 'danger' | 'info'
  threshold: number
  message: string
  action?: string
}

const CREDIT_ALERTS: CreditAlert[] = [
  {
    type: 'danger',
    threshold: 0.95,
    message: 'Critical: You have used 95% of your credits!',
    action: 'upgrade',
  },
  {
    type: 'warning',
    threshold: 0.8,
    message: 'Warning: You have used 80% of your credits.',
    action: 'view',
  },
  {
    type: 'info',
    threshold: 0.5,
    message: 'You have used 50% of your monthly credits.',
  },
]

export function CreditAlerts() {
  const { currentGraphCredits, consumptionRate } = useCreditContext()
  const { showError, showWarning, showInfo } = useToast()
  const router = useRouter()
  const [dismissedAlerts, setDismissedAlerts] = React.useState<Set<string>>(
    new Set()
  )

  const showAlert = React.useCallback(
    (alert: CreditAlert, usageRatio: number) => {
      const message = `${alert.message} ${alert.action ? `Click to ${alert.action === 'upgrade' ? 'upgrade' : 'view details'}.` : ''}`

      switch (alert.type) {
        case 'danger':
          showError(message)
          break
        case 'warning':
          showWarning(message)
          break
        case 'info':
          showInfo(message)
          break
      }

      // Navigate after showing the message if action is specified
      if (alert.action) {
        setTimeout(() => {
          if (alert.action === 'upgrade') {
            router.push('/billing?tab=upgrade')
          } else {
            router.push('/billing')
          }
        }, 3000)
      }
    },
    [showError, showWarning, showInfo, router]
  )

  useEffect(() => {
    if (!currentGraphCredits) return

    const usageRatio =
      currentGraphCredits.consumed_this_month /
      currentGraphCredits.monthly_allocation

    // Check each alert threshold
    CREDIT_ALERTS.forEach((alert) => {
      const alertKey = `${currentGraphCredits.graph_id}-${alert.threshold}`

      if (usageRatio >= alert.threshold && !dismissedAlerts.has(alertKey)) {
        showAlert(alert, usageRatio)
        setDismissedAlerts((prev) => new Set(prev).add(alertKey))
      }
    })

    // Check consumption rate alerts
    if (consumptionRate > 0) {
      const remainingDays = getRemainingDaysInMonth()
      const projectedUsage =
        currentGraphCredits.consumed_this_month +
        consumptionRate * 24 * remainingDays

      if (projectedUsage > currentGraphCredits.monthly_allocation * 1.2) {
        showWarning(
          `At current rate (${consumptionRate.toFixed(1)}/hr), you'll exceed your credit limit by ${((projectedUsage / currentGraphCredits.monthly_allocation - 1) * 100).toFixed(0)}%`
        )
      }
    }
  }, [
    currentGraphCredits,
    consumptionRate,
    dismissedAlerts,
    showAlert,
    showWarning,
  ])

  if (!currentGraphCredits) return null

  const usageRatio =
    currentGraphCredits.consumed_this_month /
    currentGraphCredits.monthly_allocation

  // Show inline alert for critical situations
  if (usageRatio >= 0.95) {
    return (
      <Alert
        color="failure"
        icon={HiExclamation}
        className="mb-4"
        onDismiss={() => {}}
      >
        <div className="flex items-center justify-between">
          <div>
            <span className="font-medium">Credit Limit Alert!</span>
            <p className="mt-1 text-sm">
              You have {currentGraphCredits.current_balance.toFixed(0)} credits
              remaining ({((1 - usageRatio) * 100).toFixed(0)}% of monthly
              allocation).
            </p>
          </div>
          <Button
            size="sm"
            color="failure"
            onClick={() => router.push('/billing?tab=upgrade')}
          >
            Upgrade Plan
          </Button>
        </div>
      </Alert>
    )
  }

  return null
}

export function CreditLowBanner() {
  const { currentGraphCredits } = useCreditContext()
  const router = useRouter()
  const [dismissed, setDismissed] = React.useState(false)

  if (!currentGraphCredits || dismissed) return null

  const remainingPercentage =
    (currentGraphCredits.current_balance /
      currentGraphCredits.monthly_allocation) *
    100

  if (remainingPercentage > 10) return null

  return (
    <div className="border-b border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
      <div className="mx-auto max-w-7xl px-3 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between">
          <div className="flex w-0 flex-1 items-center">
            <span className="flex rounded-lg bg-red-100 p-2 dark:bg-red-800">
              <HiExclamation className="h-6 w-6 text-red-600 dark:text-red-200" />
            </span>
            <p className="ml-3 truncate font-medium text-red-900 dark:text-red-200">
              <span className="md:hidden">Low credits!</span>
              <span className="hidden md:inline">
                Low credit balance:{' '}
                {currentGraphCredits.current_balance.toFixed(0)} credits
                remaining
              </span>
            </p>
          </div>
          <div className="order-3 mt-2 w-full shrink-0 sm:order-2 sm:mt-0 sm:w-auto">
            <Button
              size="sm"
              color="red"
              onClick={() => router.push('/billing')}
            >
              Add Credits
            </Button>
          </div>
          <div className="order-2 shrink-0 sm:order-3 sm:ml-3">
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="-mr-1 flex rounded-md p-2 hover:bg-red-100 focus:ring-2 focus:ring-white focus:outline-hidden sm:-mr-2 dark:hover:bg-red-800"
            >
              <span className="sr-only">Dismiss</span>
              <svg
                className="h-6 w-6 text-red-600 dark:text-red-200"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function getRemainingDaysInMonth(): number {
  const now = new Date()
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return lastDay.getDate() - now.getDate()
}
