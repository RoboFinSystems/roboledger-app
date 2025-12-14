'use client'

import { PageHeader } from '@/components/PageHeader'
import { customTheme, PageLayout, SDK, useGraphContext } from '@/lib/core'
import { Spinner } from '@/lib/core/ui-components'
import { Button, Card, Modal, ModalBody, ModalHeader } from 'flowbite-react'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState, type FC } from 'react'
import { FaPlus } from 'react-icons/fa'
import { HiLink } from 'react-icons/hi'

interface ConnectionPageData {
  connections: Array<{
    provider: string
    description: string
    connectionUrl: string
    image?: string
  }>
}

const CompanyConnectionsPageContent: FC<ConnectionPageData> = function ({
  connections,
}) {
  const {
    state: { currentGraphId },
  } = useGraphContext()
  const [connectionsData, setConnectionsData] = useState(null)
  const [connectionsLoading, setConnectionsLoading] = useState(true)

  useEffect(() => {
    const loadConnections = async () => {
      try {
        if (!currentGraphId) {
          setConnectionsData({ connections: [] })
          setConnectionsLoading(false)
          return
        }

        // Call backend connection APIs directly (with automatic authentication)
        const [qbConnections, plaidConnections, secConnections] =
          await Promise.all([
            SDK.listConnections({
              path: { graph_id: currentGraphId },
              query: {
                entity_id: currentGraphId,
                provider: 'quickbooks',
              },
            }).catch(() => ({ data: { connections: [] } })),
            SDK.listConnections({
              path: { graph_id: currentGraphId },
              query: {
                entity_id: currentGraphId,
                provider: 'plaid',
              },
            }).catch(() => ({ data: { connections: [] } })),
            SDK.listConnections({
              path: { graph_id: currentGraphId },
              query: {
                entity_id: currentGraphId,
                provider: 'sec',
              },
            }).catch(() => ({ data: { connections: [] } })),
          ])

        // Combine and format connections (same format as API route)
        const allConnections = [
          ...((qbConnections.data as any)?.connections || []).map(
            (conn: any, index: number) => ({
              id: `qb_${index}`,
              connection: {
                properties: {
                  provider: 'QuickBooks',
                  status: conn.status || 'connected',
                  lastSync: conn.last_sync,
                  companyName: conn.company_name,
                },
              },
            })
          ),
          ...((plaidConnections.data as any)?.connections || []).map(
            (conn: any, index: number) => ({
              id: `plaid_${index}`,
              connection: {
                properties: {
                  provider: 'Plaid',
                  status: conn.status || 'connected',
                  lastSync: conn.last_sync,
                  itemId: conn.item_id,
                  institutionName: conn.institution_name,
                },
              },
            })
          ),
          ...((secConnections.data as any)?.connections || []).map(
            (conn: any, index: number) => ({
              id: `sec_${index}`,
              connection: {
                properties: {
                  provider: 'SEC',
                  status: conn.status || 'connected',
                  lastSync: conn.last_sync,
                  cik: conn.cik,
                  companyName: conn.company_name,
                },
              },
            })
          ),
        ]

        setConnectionsData({ connections: allConnections })
      } catch (error) {
        console.error('Error loading connections:', error)
        setConnectionsData({ connections: [] })
      } finally {
        setConnectionsLoading(false)
      }
    }

    loadConnections()
  }, [currentGraphId])

  if (connectionsLoading) return <Spinner size="xl" fullScreen />

  return (
    <PageLayout>
      <PageHeader
        icon={HiLink}
        title="Connections"
        description="Manage your data source connections"
        gradient="from-cyan-500 to-blue-600"
        actions={<NewConnectionsModal connections={connections} />}
      />

      <div className="space-y-6">
        {connectionsData.connections.map((con: any, index: number) =>
          con.connection.properties.provider === 'QuickBooks' ? (
            <QuickBooksCard key={index} />
          ) : con.connection.properties.provider === 'SEC' ? (
            <SECCard key={index} />
          ) : con.connection.properties.provider === 'Plaid' ? (
            <PlaidCard key={index} />
          ) : null
        )}
      </div>
    </PageLayout>
  )
}

const QuickBooksCard: FC = function () {
  const {
    state: { currentGraphId },
  } = useGraphContext()

  const handleQuickBooksConnect = async () => {
    try {
      if (!currentGraphId) {
        alert('Please select a graph first')
        return
      }

      // Step 1: Create QuickBooks connection
      const createResponse = await SDK.createConnection({
        path: {
          graph_id: currentGraphId,
        },
        body: {
          entity_id: currentGraphId,
          provider: 'quickbooks',
        },
      })

      const connectionId = (createResponse.data as any)?.connection_id
      if (!connectionId) {
        throw new Error('Failed to create QuickBooks connection')
      }

      // Step 2: Initialize OAuth flow
      const oauthResponse = await SDK.initOAuth({
        path: {
          graph_id: currentGraphId,
        },
        body: {
          connection_id: connectionId,
          redirect_uri: `${window.location.origin}/connections/qb-callback`,
        },
      })

      if ((oauthResponse.data as any)?.auth_url) {
        // Redirect to QuickBooks OAuth
        window.location.href = (oauthResponse.data as any).auth_url
      } else {
        alert('Failed to initiate QuickBooks connection')
      }
    } catch (error) {
      console.error('QuickBooks connection error:', error)
      alert('Failed to connect to QuickBooks')
    }
  }

  return (
    <Card theme={customTheme.card}>
      <h3 className="font-heading mb-4 text-xl font-bold dark:text-white">
        QuickBooks Integration
      </h3>
      <div className="grid grid-cols-1 gap-6">
        <button onClick={handleQuickBooksConnect} className="cursor-pointer">
          <Image
            className="rounded-full"
            width={293}
            height={51}
            src="/images/qb_connect.png"
            alt="Connect to QuickBooks"
          />
        </button>
      </div>
    </Card>
  )
}

const SECCard: FC = function () {
  return (
    <Card theme={customTheme.card}>
      <h3 className="font-heading mb-4 text-xl font-bold dark:text-white">
        SEC Integration
      </h3>
      <div className="grid grid-cols-1 gap-6">
        <Link href="/connections/sec/setup" passHref>
          <Button color="primary" theme={customTheme.button} size="lg">
            Connect to SEC
          </Button>
        </Link>
      </div>
    </Card>
  )
}

const PlaidCard: FC = function () {
  return (
    <Card theme={customTheme.card}>
      <h3 className="font-heading mb-4 text-xl font-bold dark:text-white">
        Bank Account Integration
      </h3>
      <div className="grid grid-cols-1 gap-6">
        <Link href="/plaid-connect" passHref>
          <Button color="primary" theme={customTheme.button} size="lg">
            Connect Bank Accounts
          </Button>
        </Link>
      </div>
    </Card>
  )
}

const NewConnectionsModal: FC<ConnectionPageData> = function (connections) {
  const [isOpen, setOpen] = useState(false)
  const {
    state: { currentGraphId },
  } = useGraphContext()

  const handleConnectionClick = async (provider: string) => {
    try {
      if (!currentGraphId) {
        alert('Please select a graph first')
        return
      }

      setOpen(false) // Close modal

      if (provider === 'QuickBooks') {
        // Handle QuickBooks OAuth
        const response = await SDK.createConnection({
          path: {
            graph_id: currentGraphId,
          },
          body: {
            entity_id: currentGraphId,
            provider: 'quickbooks',
          },
        })

        if ((response.data as any)?.auth_url) {
          window.location.href = (response.data as any).auth_url
        } else {
          alert('Failed to initiate QuickBooks connection')
        }
      } else if (provider === 'Plaid') {
        // Navigate to Plaid connect page
        window.location.href = '/plaid-connect'
      } else if (provider === 'SEC') {
        // Navigate to SEC setup page
        window.location.href = '/connections/sec/setup'
      }
    } catch (error) {
      console.error('Connection error:', error)
      alert(`Failed to connect to ${provider}`)
    }
  }

  return (
    <>
      <Button
        size="sm"
        color="primary"
        theme={customTheme.button}
        onClick={() => setOpen(!isOpen)}
      >
        <FaPlus className="mr-2 h-5 w-5" />
        Add Connections
      </Button>
      <Modal onClose={() => setOpen(false)} show={isOpen}>
        <ModalHeader>Add Connections</ModalHeader>
        <ModalBody>
          {connections.connections.map((con: any, index: number) => (
            <Card key={index} className="mb-4" theme={customTheme.card}>
              <h3 className="font-heading mb-4 text-xl font-bold dark:text-white">
                {con.provider}
              </h3>
              <p className="mb-4 text-lg dark:text-white">{con.description}</p>
              <button
                onClick={() => handleConnectionClick(con.provider)}
                className="cursor-pointer"
              >
                {con.image ? (
                  <Image
                    className="rounded-full"
                    width={293}
                    height={51}
                    src={con.image}
                    alt={`Connect to ${con.provider}`}
                  />
                ) : (
                  <Button color="primary" theme={customTheme.button}>
                    Connect to {con.provider}
                  </Button>
                )}
              </button>
            </Card>
          ))}
        </ModalBody>
      </Modal>
    </>
  )
}

export default CompanyConnectionsPageContent
