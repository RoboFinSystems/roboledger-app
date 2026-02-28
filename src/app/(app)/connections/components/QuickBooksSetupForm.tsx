'use client'

import { customTheme, SDK, useGraphContext } from '@/lib/core'
import { Spinner } from '@/lib/core/ui-components'
import { Alert, Button } from 'flowbite-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface QuickBooksSetupFormProps {
  onCancel: () => void
}

export default function QuickBooksSetupForm({
  onCancel,
}: QuickBooksSetupFormProps) {
  const router = useRouter()
  const {
    state: { currentGraphId },
  } = useGraphContext()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConnect = async () => {
    if (!currentGraphId) {
      setError('No graph selected')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Create the connection first
      const createResponse = await SDK.createConnection({
        path: { graph_id: currentGraphId },
        body: {
          provider: 'quickbooks',
          entity_id: currentGraphId,
        },
      })

      const connectionId = (createResponse.data as any)?.connection_id
      if (!connectionId) {
        throw new Error('Failed to create QuickBooks connection')
      }

      // Initiate OAuth flow
      const oauthResponse = await SDK.initOAuth({
        path: { graph_id: currentGraphId },
        body: {
          connection_id: connectionId,
          redirect_uri: `${window.location.origin}/connections/qb-callback`,
        },
      })

      const authUrl = (oauthResponse.data as any)?.auth_url
      if (!authUrl) {
        throw new Error('Failed to get QuickBooks authorization URL')
      }

      // Redirect to QuickBooks OAuth
      router.push(authUrl)
    } catch (err: any) {
      console.error('QuickBooks connection error:', err)
      setError(err.message || 'Failed to connect to QuickBooks')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Connect QuickBooks
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Sign in with your QuickBooks account to import your chart of accounts,
          transactions, and journal entries.
        </p>
      </div>

      {error && <Alert color="failure">{error}</Alert>}

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center dark:border-gray-700 dark:bg-gray-800/50">
        <Image
          src="/images/qb_connect.png"
          alt="QuickBooks"
          width={120}
          height={48}
          className="mx-auto mb-4 rounded"
        />
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          You will be redirected to Intuit to authorize access to your
          QuickBooks data. Admin permissions in QuickBooks are required.
        </p>
        {loading ? (
          <div className="flex items-center justify-center gap-2">
            <Spinner size="sm" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Redirecting to QuickBooks...
            </span>
          </div>
        ) : (
          <Button
            color="primary"
            theme={customTheme.button}
            onClick={handleConnect}
          >
            Sign in with QuickBooks
          </Button>
        )}
      </div>

      <div className="flex justify-end pt-2">
        <Button
          color="gray"
          theme={customTheme.button}
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
      </div>
    </div>
  )
}
