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
import { useCallback, useEffect, useState } from 'react'
import { HiLink, HiPlus } from 'react-icons/hi'

import ConnectionCard, {
  type ConnectionData,
  type ConnectionStatus,
} from './components/ConnectionCard'
import QuickBooksSetupForm from './components/QuickBooksSetupForm'
import SecSetupForm from './components/SecSetupForm'

interface TaskStatus {
  task_id: string
  status:
    | 'pending'
    | 'in_progress'
    | 'completed'
    | 'failed'
    | 'retrying'
    | 'cancelled'
  message: string
  progress?: number
  step?: string
  error?: string
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
  const [activeTasks, setActiveTasks] = useState<Map<string, TaskStatus>>(
    new Map()
  )
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [connectionToDelete, setConnectionToDelete] =
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

  // ── Load connections (all providers) ──

  const loadConnections = useCallback(async () => {
    try {
      setLoading(true)
      if (!currentGraphId) return

      const response = await SDK.listConnections({
        path: { graph_id: currentGraphId },
      })

      const list = Array.isArray(response.data) ? response.data : []
      setConnections(list as ConnectionData[])
      setError(null)
    } catch (err) {
      const errorMsg = 'Failed to load connections'
      setError(errorMsg)
      showError(errorMsg)
      console.error('Error loading connections:', err)
    } finally {
      setLoading(false)
    }
  }, [currentGraphId, showError])

  useEffect(() => {
    if (currentGraphId) {
      loadConnections()
    }
  }, [loadConnections, currentGraphId])

  // ── Poll active tasks ──

  useEffect(() => {
    if (activeTasks.size === 0) return

    const interval = setInterval(async () => {
      const updatedTasks = new Map(activeTasks)
      let hasUpdates = false

      for (const [taskId, taskStatus] of activeTasks) {
        if (
          taskStatus.status === 'pending' ||
          taskStatus.status === 'in_progress' ||
          taskStatus.status === 'retrying'
        ) {
          try {
            const response = await SDK.getOperationStatus({
              path: { operation_id: taskId },
            })
            if (response.data) {
              const taskData: TaskStatus = {
                task_id: (response.data as any).task_id || taskId,
                status: (response.data as any).status as TaskStatus['status'],
                message: (response.data as any).message || '',
                progress: (response.data as any).progress || 0,
                step: (response.data as any).step || '',
                error: (response.data as any).error || null,
              }
              updatedTasks.set(taskId, taskData)
              hasUpdates = true

              if (response.data.status === 'completed') {
                setTimeout(() => {
                  loadConnections()
                  updatedTasks.delete(taskId)
                  setActiveTasks(new Map(updatedTasks))
                }, 1000)
              }
            }
          } catch (err) {
            console.error(`Failed to get task status for ${taskId}:`, err)
          }
        }
      }

      if (hasUpdates) {
        setActiveTasks(updatedTasks)
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [activeTasks, loadConnections])

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

  const handleSetupSuccess = (connectionId: string) => {
    showSuccess('Connection created successfully')
    closeMarketplace()
    loadConnections()
  }

  // ── Sync ──

  const handleSync = async (connectionId: string) => {
    try {
      if (!currentGraphId) {
        showError('No graph selected')
        return
      }

      const syncResponse = await SDK.syncConnection({
        path: {
          graph_id: currentGraphId,
          connection_id: connectionId,
        },
        body: { full_sync: true },
      })

      const syncData = syncResponse.data as any
      if (syncData?.task_id) {
        setActiveTasks((prev) =>
          new Map(prev).set(syncData.task_id, {
            task_id: syncData.task_id,
            status: syncData.status || 'pending',
            message: syncData.message || 'Sync started...',
          })
        )
        showSuccess('Sync started successfully')
      } else {
        showError('Failed to start sync')
      }
    } catch (err) {
      showError('Failed to start sync')
      console.error('Error syncing:', err)
    }
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
    // Check if there's an active task for this connection
    for (const task of activeTasks.values()) {
      if (
        task.message.toLowerCase().includes(connection.provider.toLowerCase())
      ) {
        return {
          status: task.status === 'in_progress' ? 'syncing' : task.status,
          message: task.message,
          progress: task.progress,
          step: task.step,
          error: task.error,
        }
      }
    }

    return {
      status: connection.status,
      message: connection.last_sync
        ? `Last sync: ${new Date(connection.last_sync).toLocaleString()}`
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
              onSync={() => handleSync(connection.connection_id)}
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
                <p className="mb-6 max-w-md text-center text-sm text-gray-500 dark:text-gray-400">
                  Connect your data sources to automatically import
                  transactions, chart of accounts, and other financial data.
                </p>
                <Button
                  color="primary"
                  theme={customTheme.button}
                  onClick={openMarketplace}
                  size="lg"
                >
                  <HiPlus className="mr-2 h-5 w-5" />
                  Add Connection
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* ── Marketplace / Setup Modal ── */}
        <Modal show={marketplaceOpen} onClose={closeMarketplace} size="2xl">
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

        {/* ── Delete Confirmation Modal ── */}
        <Modal show={deleteModalOpen} onClose={() => setDeleteModalOpen(false)}>
          <ModalHeader>Delete Connection</ModalHeader>
          <ModalBody>
            <p className="text-gray-700 dark:text-gray-300">
              Are you sure you want to delete the{' '}
              <strong>{connectionToDelete?.provider}</strong> connection? This
              action cannot be undone.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button
              color="gray"
              onClick={() => setDeleteModalOpen(false)}
              theme={customTheme.button}
            >
              Cancel
            </Button>
            <Button
              color="failure"
              onClick={handleDeleteConnection}
              theme={customTheme.button}
            >
              Delete Connection
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
