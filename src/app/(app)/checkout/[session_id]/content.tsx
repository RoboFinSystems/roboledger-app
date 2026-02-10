'use client'

import {
  isUUID,
  PageLayout,
  useApiError,
  useGraphContext,
  useToast,
} from '@/lib/core'
import * as SDK from '@robosystems/client'
import { Alert, Button, Card, Progress, Spinner } from 'flowbite-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  HiCheckCircle,
  HiExclamationCircle,
  HiRefresh,
  HiXCircle,
} from 'react-icons/hi'

interface CheckoutContentProps {
  sessionId: string
}

type CheckoutStatus =
  | 'pending_payment'
  | 'provisioning'
  | 'active'
  | 'failed'
  | 'canceled'
  | 'unknown'

export function CheckoutContent({ sessionId }: CheckoutContentProps) {
  const router = useRouter()
  const { handleApiError } = useApiError()
  const { showError, showSuccess, ToastContainer } = useToast()
  const { setCurrentGraph, refreshGraphs } = useGraphContext()
  const [status, setStatus] = useState<CheckoutStatus>('pending_payment')
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null)
  const [resourceId, setResourceId] = useState<string | null>(null)
  const [operationId, setOperationId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
  }, [])

  const checkStatus = useCallback(async () => {
    try {
      const response = await SDK.getCheckoutStatus({
        path: { session_id: sessionId },
      })

      if (response.error) {
        const errorMsg =
          typeof response.error === 'object' && 'detail' in response.error
            ? String(response.error.detail)
            : 'Failed to get checkout status'
        throw new Error(errorMsg)
      }

      if (response.data) {
        const checkoutStatus = response.data.status as CheckoutStatus
        setStatus(checkoutStatus)
        setSubscriptionId(response.data.subscription_id || null)
        const currentResourceId = response.data.resource_id || null
        setResourceId(currentResourceId)
        setOperationId(response.data.operation_id || null)
        setError(response.data.error || null)

        if (
          checkoutStatus === 'active' ||
          checkoutStatus === 'failed' ||
          checkoutStatus === 'canceled'
        ) {
          stopPolling()

          if (checkoutStatus === 'active') {
            // Determine redirect based on resource type
            // Repository IDs are typically lowercase names (e.g., 'sec', 'industry')
            // Graph IDs are UUIDs
            const isRepository = currentResourceId && !isUUID(currentResourceId)

            // For repositories, refresh graphs and redirect (no select call needed)
            if (isRepository && currentResourceId) {
              const setupAndRedirect = async () => {
                try {
                  // Refresh graphs list to include new repository
                  await refreshGraphs()

                  // Small delay to ensure state updates
                  setTimeout(() => {
                    window.location.href = `/repositories/${currentResourceId}/getting-started`
                  }, 500)
                } catch (err) {
                  console.error('Failed to set up repository context:', err)
                  // Fallback to getting started page anyway
                  window.location.href = `/repositories/${currentResourceId}/getting-started`
                }
              }

              showSuccess(
                'Payment successful! Setting up your repository access...'
              )
              setupAndRedirect()
            } else {
              // Graph subscription - redirect to dashboard
              showSuccess('Payment successful! Redirecting to dashboard...')
              setTimeout(() => {
                window.location.href = '/dashboard'
              }, 2000)
            }
          } else if (checkoutStatus === 'failed') {
            showError('Payment processing failed. Please try again.')
          }
        }
      }
    } catch (err) {
      console.error('Checkout status error:', err)
      handleApiError(err, 'Failed to check payment status')
    } finally {
      setLoading(false)
    }
  }, [
    sessionId,
    stopPolling,
    showSuccess,
    showError,
    handleApiError,
    refreshGraphs,
    setCurrentGraph,
  ])

  useEffect(() => {
    checkStatus()

    pollingRef.current = setInterval(checkStatus, 3000)

    return () => {
      stopPolling()
    }
    // Only run on mount — sessionId won't change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId])

  const getStatusMessage = () => {
    switch (status) {
      case 'pending_payment':
        return 'Waiting for payment confirmation...'
      case 'provisioning':
        return 'Payment confirmed! Setting up your resources...'
      case 'active':
        return 'All done! Your subscription is active.'
      case 'failed':
        return 'Payment processing failed.'
      case 'canceled':
        return 'Payment was canceled.'
      default:
        return 'Checking payment status...'
    }
  }

  const getProgressValue = () => {
    switch (status) {
      case 'pending_payment':
        return 25
      case 'provisioning':
        return 75
      case 'active':
        return 100
      default:
        return 0
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'active':
        return <HiCheckCircle className="h-16 w-16 text-green-500" />
      case 'failed':
      case 'canceled':
        return <HiXCircle className="h-16 w-16 text-red-500" />
      case 'provisioning':
        return <Spinner size="xl" />
      default:
        return <Spinner size="xl" />
    }
  }

  const handleRetry = () => {
    router.push('/billing')
  }

  const handleCancel = () => {
    // Determine redirect based on resource type
    const isRepository = resourceId && !isUUID(resourceId)
    window.location.href = isRepository ? '/console' : '/dashboard'
  }

  if (loading && status === 'pending_payment') {
    return (
      <PageLayout>
        <div className="mx-auto flex h-96 max-w-7xl items-center justify-center">
          <Spinner size="xl" />
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <ToastContainer />

      <div className="mx-auto max-w-2xl">
        <Card>
          <div className="space-y-6 text-center">
            <div className="flex justify-center">{getStatusIcon()}</div>

            <div>
              <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
                {getStatusMessage()}
              </h1>
              {status === 'provisioning' && operationId && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  This may take a few moments. You can safely close this page
                  and return later.
                </p>
              )}
            </div>

            {status !== 'active' &&
              status !== 'failed' &&
              status !== 'canceled' && (
                <div className="space-y-2">
                  <Progress
                    progress={getProgressValue()}
                    size="lg"
                    color="blue"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {status === 'pending_payment'
                      ? 'Processing payment...'
                      : 'Provisioning resources...'}
                  </p>
                </div>
              )}

            {error && (
              <Alert color="failure" icon={HiExclamationCircle}>
                <span className="font-medium">Error:</span> {error}
              </Alert>
            )}

            {resourceId && (
              <div className="rounded-lg bg-gray-50 p-4 text-left dark:bg-gray-800">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Resource
                </p>
                <p className="font-mono text-sm text-gray-900 dark:text-white">
                  {isUUID(resourceId) ? resourceId : resourceId.toUpperCase()}
                </p>
              </div>
            )}

            {status === 'active' && (
              <Button
                color="blue"
                onClick={() => {
                  const isRepository = resourceId && !isUUID(resourceId)
                  window.location.href = isRepository
                    ? `/repositories/${resourceId}/getting-started`
                    : '/dashboard'
                }}
                className="w-full"
              >
                {resourceId && !isUUID(resourceId)
                  ? 'Get Started'
                  : 'Go to Dashboard'}
              </Button>
            )}

            {(status === 'failed' || status === 'canceled') && (
              <div className="flex gap-3">
                <Button color="blue" onClick={handleRetry} className="flex-1">
                  <HiRefresh className="mr-2 h-5 w-5" />
                  Try Again
                </Button>
                <Button color="gray" onClick={handleCancel} className="flex-1">
                  Cancel
                </Button>
              </div>
            )}

            {status === 'provisioning' && (
              <Button color="gray" onClick={handleCancel}>
                Continue in Background
              </Button>
            )}
          </div>
        </Card>

        {status === 'provisioning' && operationId && (
          <Card className="mt-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                What's happening?
              </h3>
              <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li>✓ Payment confirmed</li>
                <li className="flex items-center">
                  <Spinner size="sm" className="mr-2" />
                  Setting up your graph database
                </li>
                <li className="text-gray-400">Initializing resources</li>
                <li className="text-gray-400">Configuring access</li>
              </ul>
            </div>
          </Card>
        )}
      </div>
    </PageLayout>
  )
}
