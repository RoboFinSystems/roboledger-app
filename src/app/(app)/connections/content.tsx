'use client'

import { PageHeader } from '@/components/PageHeader'
import {
  customTheme,
  PageLayout,
  SDK,
  useGraphContext,
  useToast,
} from '@/lib/core'
import { Spinner } from '@/lib/core/ui-components'
import {
  Alert,
  Badge,
  Button,
  Card,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from 'flowbite-react'
import { useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { HiLink, HiPlus } from 'react-icons/hi'

import ConnectionCard, {
  type ConnectionData,
  type ConnectionStatus,
} from './components/ConnectionCard'
import QuickBooksSetupForm from './components/QuickBooksSetupForm'
import SecSetupForm from './components/SecSetupForm'
import SyncOptionsModal, {
  type SyncOptions,
} from './components/SyncOptionsModal'

// How long to keep polling for a sync to complete before giving up.
const SYNC_POLL_INTERVAL_MS = 3000
const SYNC_POLL_TIMEOUT_MS = 90_000

interface SyncWatch {
  // ms-since-epoch when we started watching this connection. We treat the
  // sync as complete when ``last_sync`` is non-null AND parses to a value
  // newer than this. Avoids "completing" instantly because of a stale
  // last_sync from a previous run.
  startedAt: number
}

// The backend serializes ``last_sync`` as a tz-less ISO string
// (``"2026-04-30T16:23:34.146326"``) but the value is always UTC.
// ``Date.parse`` of a tz-less ISO string is interpreted as LOCAL time,
// so for users in negative-offset zones (CDT, etc.) the parsed value
// drifts hours into the future. Force-UTC by appending ``Z`` when no
// tz designator is present.
function parseUtcMs(iso: string): number {
  const hasTz = /[Z+-]\d{0,2}:?\d{0,2}$/i.test(iso) || iso.endsWith('Z')
  return Date.parse(hasTz ? iso : iso + 'Z')
}

interface ConnectionProviderInfo {
  provider: string
  display_name: string
  description: string
  auth_type: 'none' | 'oauth' | 'link' | 'api_key'
  features: string[]
  data_types: string[]
}

const AUTH_TYPE_LABELS: Record<string, string> = {
  oauth: 'OAuth',
  link: 'Link',
  api_key: 'API Key',
  none: 'No Auth',
}

export default function ModernConnectionsContent() {
  const [connections, setConnections] = useState<ConnectionData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // Connections we're actively watching for sync completion. The polling
  // effect compares each connection's ``last_sync`` against ``startedAt``
  // and removes the entry when it advances.
  const [syncWatches, setSyncWatches] = useState<Map<string, SyncWatch>>(
    new Map()
  )
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [connectionToDelete, setConnectionToDelete] =
    useState<ConnectionData | null>(null)
  const [syncOptionsOpen, setSyncOptionsOpen] = useState(false)
  const [connectionToSync, setConnectionToSync] =
    useState<ConnectionData | null>(null)
  const [marketplaceOpen, setMarketplaceOpen] = useState(false)
  const [availableProviders, setAvailableProviders] = useState<
    ConnectionProviderInfo[]
  >([])
  const [providersLoading, setProvidersLoading] = useState(false)
  // Which provider setup form to show (null = provider list)
  const [setupProvider, setSetupProvider] = useState<string | null>(null)
  const { showError, showSuccess, ToastContainer } = useToast()
  const { state: graphState } = useGraphContext()
  const { currentGraphId } = graphState
  const searchParams = useSearchParams()
  const shownSuccessRef = useRef(false)
  const oauthWatchSeededRef = useRef(false)

  // Show success toast when redirected from OAuth callback
  useEffect(() => {
    const success = searchParams.get('success')
    if (success && !shownSuccessRef.current) {
      shownSuccessRef.current = true
      const provider = success.replace('-connected', '').replace('-', ' ')
      showSuccess(
        `${provider.charAt(0).toUpperCase() + provider.slice(1)} connected successfully`
      )
      // Clean up URL
      window.history.replaceState({}, '', '/connections')
    }
  }, [searchParams, showSuccess])

  // ── Load connections (all providers) ──

  const loadConnections = useCallback(
    async ({ background = false }: { background?: boolean } = {}) => {
      try {
        if (!background) setLoading(true)
        if (!currentGraphId) return [] as ConnectionData[]

        const response = await SDK.listConnections({
          path: { graph_id: currentGraphId },
        })

        const list = (
          Array.isArray(response.data) ? response.data : []
        ) as ConnectionData[]
        setConnections(list)
        setError(null)
        return list
      } catch (err) {
        const errorMsg = 'Failed to load connections'
        if (!background) {
          setError(errorMsg)
          showError(errorMsg)
        }
        console.error('Error loading connections:', err)
        return [] as ConnectionData[]
      } finally {
        if (!background) setLoading(false)
      }
    },
    [currentGraphId, showError]
  )

  useEffect(() => {
    if (!currentGraphId) return
    loadConnections()
  }, [loadConnections, currentGraphId])

  // After arriving from the OAuth callback, the backend has just kicked off
  // an auto-sync. We can't poll the SSE operation surface (Dagster ops for
  // QB aren't wired to emit OPERATION_COMPLETED), so we watch the
  // connection's ``last_sync`` field instead — see the polling effect below.
  useEffect(() => {
    if (!currentGraphId) return
    if (oauthWatchSeededRef.current) return
    const success = searchParams.get('success')
    if (!success) return
    oauthWatchSeededRef.current = true

    let cancelled = false
    const startedAt = Date.now()
    ;(async () => {
      // Give the backend a moment to register the connection record.
      await new Promise((resolve) => setTimeout(resolve, 1500))
      if (cancelled) return
      const list = await loadConnections()
      if (cancelled || list.length === 0) return
      // Track every connection that hasn't synced yet — typically just the
      // one from this OAuth flow.
      setSyncWatches((prev) => {
        const next = new Map(prev)
        for (const c of list) {
          if (!c.last_sync && !next.has(c.connection_id)) {
            next.set(c.connection_id, { startedAt })
          }
        }
        return next
      })
    })()

    return () => {
      cancelled = true
    }
  }, [searchParams, currentGraphId, loadConnections])

  // ── Poll watched syncs by reloading the connections list ──

  useEffect(() => {
    if (syncWatches.size === 0) return

    const interval = setInterval(async () => {
      const list = await loadConnections({ background: true })
      const now = Date.now()
      setSyncWatches((prev) => {
        const next = new Map(prev)
        for (const [connectionId, watch] of prev) {
          const conn = list.find((c) => c.connection_id === connectionId)
          if (!conn) {
            // Connection deleted while we were watching — stop tracking.
            next.delete(connectionId)
            continue
          }
          const completed =
            conn.last_sync && parseUtcMs(conn.last_sync) >= watch.startedAt
          if (completed) {
            next.delete(connectionId)
            showSuccess(
              `${conn.provider.charAt(0).toUpperCase()}${conn.provider.slice(1)} sync complete`
            )
            continue
          }
          if (now - watch.startedAt > SYNC_POLL_TIMEOUT_MS) {
            // Give up silently — the user can refresh manually if needed.
            next.delete(connectionId)
          }
        }
        return next
      })
    }, SYNC_POLL_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [syncWatches, loadConnections, showSuccess])

  // ── Marketplace ──

  const loadAvailableProviders = async () => {
    if (!currentGraphId) return
    setProvidersLoading(true)
    try {
      const response = await SDK.getConnectionOptions({
        path: { graph_id: currentGraphId },
      })
      if (response.data?.providers) {
        setAvailableProviders(
          response.data.providers as ConnectionProviderInfo[]
        )
      }
    } catch (err) {
      console.error('Failed to load connection options:', err)
      showError('Failed to load available connections')
    } finally {
      setProvidersLoading(false)
    }
  }

  const openMarketplace = () => {
    setSetupProvider(null)
    setMarketplaceOpen(true)
    loadAvailableProviders()
  }

  const closeMarketplace = () => {
    setMarketplaceOpen(false)
    setSetupProvider(null)
  }

  // ── Provider setup callbacks ──

  const handleSetupSuccess = () => {
    showSuccess('Connection created successfully')
    closeMarketplace()
    loadConnections()
  }

  // ── Sync ──

  const openSyncOptions = (connection: ConnectionData) => {
    setConnectionToSync(connection)
    setSyncOptionsOpen(true)
  }

  const closeSyncOptions = () => {
    setSyncOptionsOpen(false)
    setConnectionToSync(null)
  }

  const handleSync = async (connectionId: string, options: SyncOptions) => {
    try {
      if (!currentGraphId) {
        showError('No graph selected')
        return
      }

      const startedAt = Date.now()
      await SDK.syncConnection({
        path: {
          graph_id: currentGraphId,
          connection_id: connectionId,
        },
        body: options,
      })

      // Watch the connection list for ``last_sync`` to advance past
      // ``startedAt`` — the SSE operation surface isn't wired up for QB
      // (Dagster ops don't emit OPERATION_COMPLETED), so we poll the
      // connection record directly.
      setSyncWatches((prev) => new Map(prev).set(connectionId, { startedAt }))
      showSuccess('Sync started successfully')
    } catch (err) {
      showError('Failed to start sync')
      console.error('Error syncing:', err)
    }
  }

  const handleSyncOptionsSubmit = (options: SyncOptions) => {
    if (!connectionToSync) return
    const connectionId = connectionToSync.connection_id
    closeSyncOptions()
    void handleSync(connectionId, options)
  }

  // ── Delete ──

  const handleDeleteConnection = async () => {
    if (!connectionToDelete || !currentGraphId) return

    try {
      await SDK.deleteConnection({
        path: {
          graph_id: currentGraphId,
          connection_id: connectionToDelete.connection_id,
        },
      })
      showSuccess('Connection deleted successfully')
      loadConnections()
    } catch (err) {
      console.error('Delete connection error:', err)
      showError('Failed to delete connection')
    } finally {
      setDeleteModalOpen(false)
      setConnectionToDelete(null)
    }
  }

  // ── Status helper ──

  const getConnectionStatus = (
    connection: ConnectionData
  ): ConnectionStatus => {
    if (syncWatches.has(connection.connection_id)) {
      return {
        status: 'syncing',
        message: 'Syncing…',
      }
    }

    return {
      status: connection.status,
      message: connection.last_sync
        ? `Last sync: ${new Date(parseUtcMs(connection.last_sync)).toLocaleString()}`
        : 'Never synced',
    }
  }

  // ── Render ──

  if (loading) {
    return <Spinner size="xl" fullScreen />
  }

  return (
    <>
      <ToastContainer />
      <PageLayout>
        <PageHeader
          icon={HiLink}
          title="Data Connections"
          description="Connect external data sources to automatically import transactions and financial data"
          gradient="from-cyan-500 to-blue-600"
          actions={
            <Button
              size="sm"
              color="primary"
              theme={customTheme.button}
              onClick={openMarketplace}
            >
              <HiPlus className="mr-2 h-4 w-4" />
              Add Connection
            </Button>
          }
        />

        {error && <Alert color="failure">{error}</Alert>}

        <div className="grid grid-cols-1 gap-y-4">
          {connections.map((connection) => (
            <ConnectionCard
              key={connection.connection_id}
              connection={connection}
              status={getConnectionStatus(connection)}
              onSync={() => openSyncOptions(connection)}
              onDelete={() => {
                setConnectionToDelete(connection)
                setDeleteModalOpen(true)
              }}
            />
          ))}

          {connections.length === 0 && (
            <Card theme={customTheme.card}>
              <div className="flex flex-col items-center py-12">
                <HiLink className="mb-4 h-12 w-12 text-gray-400" />
                <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
                  No connections yet
                </h3>
                <p className="max-w-md text-center text-sm text-gray-500 dark:text-gray-400">
                  Connect your data sources to automatically import
                  transactions, chart of accounts, and other financial data.
                </p>
              </div>
            </Card>
          )}
        </div>

        {/* ── Marketplace / Setup Modal ── */}
        <Modal
          theme={customTheme.modal}
          show={marketplaceOpen}
          onClose={closeMarketplace}
          size="2xl"
        >
          <ModalHeader>
            <div className="flex items-center gap-3">
              <HiLink className="h-5 w-5 text-gray-500" />
              <span>
                {setupProvider ? 'Set Up Connection' : 'Connection Marketplace'}
              </span>
            </div>
          </ModalHeader>
          <ModalBody>
            {setupProvider === 'sec' ? (
              <SecSetupForm
                onSuccess={handleSetupSuccess}
                onCancel={() => setSetupProvider(null)}
              />
            ) : setupProvider === 'quickbooks' ? (
              <QuickBooksSetupForm onCancel={() => setSetupProvider(null)} />
            ) : providersLoading ? (
              <div className="flex items-center justify-center py-12">
                <Spinner size="lg" />
              </div>
            ) : availableProviders.length === 0 ? (
              <div className="py-12 text-center">
                <HiLink className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                <p className="text-gray-500 dark:text-gray-400">
                  No connection providers available
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {availableProviders.map((provider) => (
                  <ProviderRow
                    key={provider.provider}
                    provider={provider}
                    onConnect={() => setSetupProvider(provider.provider)}
                  />
                ))}
              </div>
            )}
          </ModalBody>
          {!setupProvider && (
            <ModalFooter>
              <Button
                color="gray"
                theme={customTheme.button}
                onClick={closeMarketplace}
              >
                Close
              </Button>
            </ModalFooter>
          )}
        </Modal>

        {/* ── Sync Options Modal ── */}
        <SyncOptionsModal
          isOpen={syncOptionsOpen}
          onClose={closeSyncOptions}
          onSubmit={handleSyncOptionsSubmit}
          providerLabel={connectionToSync?.provider ?? 'connection'}
        />

        {/* ── Delete Confirmation Modal ── */}
        <Modal
          theme={customTheme.modal}
          show={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
        >
          <ModalHeader>Delete Connection</ModalHeader>
          <ModalBody>
            <p className="text-gray-700 dark:text-gray-300">
              Are you sure you want to delete the{' '}
              <strong>{connectionToDelete?.provider}</strong> connection? This
              action cannot be undone.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button color="failure" onClick={handleDeleteConnection}>
              Delete Connection
            </Button>
            <Button color="gray" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
          </ModalFooter>
        </Modal>
      </PageLayout>
    </>
  )
}

// ── Provider Row (Marketplace list) ──

interface ProviderRowProps {
  provider: ConnectionProviderInfo
  onConnect: () => void
}

function ProviderRow({ provider, onConnect }: ProviderRowProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800/50">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="font-heading text-base font-bold text-gray-900 dark:text-white">
            {provider.display_name}
          </h3>
          <Badge color="gray" size="sm">
            {AUTH_TYPE_LABELS[provider.auth_type] || provider.auth_type}
          </Badge>
        </div>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {provider.description}
        </p>
        {provider.data_types.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {provider.data_types.map((dt) => (
              <Badge key={dt} color="purple" size="sm">
                {dt}
              </Badge>
            ))}
          </div>
        )}
      </div>
      <div className="ml-4 shrink-0">
        <Button
          size="sm"
          color="primary"
          theme={customTheme.button}
          onClick={onConnect}
        >
          Connect
        </Button>
      </div>
    </div>
  )
}
