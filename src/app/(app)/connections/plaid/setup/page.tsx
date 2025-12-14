'use client'

import { customTheme } from '@/lib/core'
import { Alert, Breadcrumb, BreadcrumbItem, Button, Card } from 'flowbite-react'
import { useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'
import { HiArrowLeft, HiHome } from 'react-icons/hi'

export default function PlaidSetupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // TODO: Implement Plaid Link integration
  // This would require:
  // 1. Creating a link token via backend API
  // 2. Loading Plaid Link script
  // 3. Handling the Link flow
  // 4. Exchanging public token for access token

  const handleConnectAccount = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Redirect to the proper Plaid Link flow
      router.push('/plaid-connect')
    } catch (err: any) {
      setError(err.message || 'Failed to connect bank account')
    } finally {
      setLoading(false)
    }
  }, [router])

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card theme={customTheme.card} className="w-full max-w-md">
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
            <h2 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
              Bank Account Connected!
            </h2>
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              Your bank accounts have been successfully connected. You can now
              sync transactions automatically.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Redirecting to connections page...
            </p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <>
      <div className="mb-4 grid grid-cols-1 gap-y-6 px-4 pt-6">
        <div className="col-span-full">
          <Breadcrumb className="mb-5">
            <BreadcrumbItem href="/home">
              <div className="flex items-center gap-x-3">
                <HiHome className="text-xl" />
                <span className="dark:text-white">Home</span>
              </div>
            </BreadcrumbItem>
            <BreadcrumbItem href="/connections">Connections</BreadcrumbItem>
            <BreadcrumbItem>Plaid Setup</BreadcrumbItem>
          </Breadcrumb>

          <div className="mb-6 flex items-center gap-4">
            <Button
              color="gray"
              theme={customTheme.button}
              onClick={() => router.back()}
            >
              <HiArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <h1 className="font-heading text-xl font-semibold text-gray-900 sm:text-2xl dark:text-white">
              Bank Account Connection Setup
            </h1>
          </div>
        </div>
      </div>

      <div className="px-4 pb-6">
        <div className="mx-auto max-w-2xl">
          <Card theme={customTheme.card}>
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <span className="text-lg font-bold text-green-600">PLAID</span>
              </div>
              <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
                Connect Your Bank Accounts
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Securely connect your bank accounts to automatically import
                transactions and account balances.
              </p>
            </div>

            {error && (
              <Alert color="failure" className="mb-4">
                {error}
              </Alert>
            )}

            <div className="mb-6 space-y-4">
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                <h4 className="mb-2 font-medium text-blue-900 dark:text-blue-100">
                  What happens next:
                </h4>
                <ul className="list-inside list-disc space-y-1 text-sm text-blue-800 dark:text-blue-200">
                  <li>You'll be redirected to your bank's secure login page</li>
                  <li>Enter your online banking credentials</li>
                  <li>Select which accounts you want to connect</li>
                  <li>Your transaction data will be automatically imported</li>
                </ul>
              </div>

              <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
                <h4 className="mb-2 font-medium text-green-900 dark:text-green-100">
                  Security & Privacy:
                </h4>
                <ul className="list-inside list-disc space-y-1 text-sm text-green-800 dark:text-green-200">
                  <li>Bank-level 256-bit encryption</li>
                  <li>Read-only access - we cannot make transactions</li>
                  <li>Your credentials are never stored</li>
                  <li>Powered by Plaid - trusted by millions</li>
                </ul>
              </div>
            </div>

            <div className="text-center">
              <Button
                size="lg"
                color="primary"
                theme={customTheme.button}
                onClick={handleConnectAccount}
                disabled={loading}
                className="w-full sm:w-auto"
              >
                {loading ? 'Connecting...' : 'Connect Bank Account'}
              </Button>

              <div className="mt-4">
                <Button
                  color="gray"
                  theme={customTheme.button}
                  onClick={() => router.back()}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </div>

            <div className="mt-6 border-t border-gray-200 pt-4 dark:border-gray-700">
              <p className="text-center text-xs text-gray-500 dark:text-gray-400">
                By connecting your account, you agree to Plaid's Terms of
                Service and Privacy Policy. Your bank credentials are encrypted
                and never stored by RoboLedger.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}
