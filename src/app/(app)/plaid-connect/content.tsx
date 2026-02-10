// @ts-nocheck - connections functionality removed from SDK, pending overhaul
'use client'

import { PageHeader } from '@/components/PageHeader'
import { customTheme, PageLayout, SDK, useGraphContext } from '@/lib/core'
import { Button, Card, Spinner } from 'flowbite-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { HiCreditCard } from 'react-icons/hi'
import { usePlaidLink } from 'react-plaid-link'

export default function PlaidConnectContent() {
  const router = useRouter()
  const {
    state: { currentGraphId },
  } = useGraphContext()
  const [linkToken, setLinkToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const createLinkToken = async () => {
      try {
        // Check graph selection
        if (!currentGraphId) {
          setError('No graph selected')
          setLoading(false)
          return
        }

        // Call backend SDK directly to create Plaid Link token
        const response = await SDK.createLinkToken({
          path: { graph_id: currentGraphId },
          body: {
            entity_id: currentGraphId,
            user_id: currentGraphId, // Use graph ID as user ID for now
          },
        })

        if ((response.data as any)?.link_token) {
          setLinkToken((response.data as any).link_token)
        } else {
          throw new Error('No link token received from backend')
        }
      } catch (err: any) {
        setError(err.message || 'Failed to initialize Plaid')
      } finally {
        setLoading(false)
      }
    }

    createLinkToken()
  }, [currentGraphId])

  const onSuccess = useCallback(
    async (public_token: string, metadata: any) => {
      try {
        // Check graph selection
        if (!currentGraphId) {
          setError('No graph selected')
          return
        }

        // Step 1: Create Plaid connection
        const createResponse = await SDK.createConnection({
          path: { graph_id: currentGraphId },
          body: {
            entity_id: currentGraphId,
            provider: 'plaid',
            plaid_config: {
              institution: metadata?.institution || null,
              accounts: metadata?.accounts || null,
            },
          },
        })

        const connectionId = (createResponse.data as any)?.connection_id
        if (!connectionId) {
          throw new Error('Failed to create Plaid connection')
        }

        // Step 2: Exchange public token for access token
        const response = await SDK.exchangeLinkToken({
          path: { graph_id: currentGraphId },
          body: {
            connection_id: connectionId,
            public_token,
            metadata: {
              institution: metadata?.institution || null,
              accounts: metadata?.accounts || null,
            },
          },
        })

        if ((response.data as any)?.success) {
          router.push('/connections')
        } else {
          throw new Error('Token exchange failed')
        }
      } catch (err: any) {
        setError(err.message || 'Failed to connect bank account')
      }
    },
    [router, currentGraphId]
  )

  const config = {
    token: linkToken,
    onSuccess,
    onExit: (err: any) => {
      if (err != null) {
        setError(err.error_message || 'Connection cancelled')
      }
      router.push('/connections')
    },
  }

  const { open, ready } = usePlaidLink(config)

  useEffect(() => {
    if (ready) {
      open()
    }
  }, [ready, open])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner aria-label="Loading Plaid..." size="xl" />
      </div>
    )
  }

  return (
    <PageLayout>
      <PageHeader
        icon={HiCreditCard}
        title="Connect Bank Accounts"
        description="Securely link your bank accounts with Plaid"
        gradient="from-green-500 to-teal-600"
      />

      <Card theme={customTheme.card} className="max-w-2xl">
        <h3 className="font-heading mb-4 text-lg font-bold dark:text-white">
          Securely Connect with Plaid
        </h3>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-800 dark:bg-red-900 dark:text-red-200">
            {error}
          </div>
        )}

        <p className="mb-6 text-gray-600 dark:text-gray-400">
          We use Plaid to securely connect to your bank accounts. Your
          credentials are never stored on our servers.
        </p>

        <div className="flex gap-4">
          <Button onClick={() => open()} disabled={!ready}>
            {ready ? 'Connect Bank Account' : 'Initializing...'}
          </Button>
          <Button
            color="secondary"
            theme={customTheme.button}
            onClick={() => router.push('/connections')}
          >
            Cancel
          </Button>
        </div>
      </Card>
    </PageLayout>
  )
}
