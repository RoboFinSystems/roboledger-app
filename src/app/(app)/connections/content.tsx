// @ts-nocheck - connections functionality removed from SDK, pending overhaul
'use client'

/* eslint-disable react/prop-types */
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
  Progress,
} from 'flowbite-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { FaTrash } from 'react-icons/fa'
import {
  HiCheckCircle,
  HiClock,
  HiExclamationCircle,
  HiLink,
  HiPlus,
  HiRefresh,
} from 'react-icons/hi'

interface Connection {
  id: string
  connection: {
    properties: {
      provider: string
      status: 'connected' | 'disconnected' | 'syncing' | 'error'
      lastSync?: string
      companyName?: string
      connectionId?: string
      error?: string
    }
  }
}

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

interface ApiResponse<T> {
  data: T
}

interface ConnectionsResponse {
  connections: any[]
}

interface ConnectionProviderInfo {
  provider: string
  display_name: string
  description: string
  auth_type: 'none' | 'oauth' | 'link' | 'api_key'
  auth_flow?: string | null
  features: string[]
  data_types: string[]
  setup_instructions?: string | null
  documentation_url?: string | null
}

const AUTH_TYPE_LABELS: Record<string, string> = {
  oauth: 'OAuth',
  link: 'Link',
  api_key: 'API Key',
  none: 'No Auth',
}

export default function ModernConnectionsContent() {
  const [connections, setConnections] = useState<Connection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTasks, setActiveTasks] = useState<Map<string, TaskStatus>>(
    new Map()
  )
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [connectionToDelete, setConnectionToDelete] =
    useState<Connection | null>(null)
  const [marketplaceOpen, setMarketplaceOpen] = useState(false)
  const [availableProviders, setAvailableProviders] = useState<
    ConnectionProviderInfo[]
  >([])
  const [providersLoading, setProvidersLoading] = useState(false)
  const [connectingProvider, setConnectingProvider] = useState<string | null>(
    null
  )
  const { showError, showSuccess, ToastContainer } = useToast()
  const { state: graphState } = useGraphContext()
  const { currentGraphId } = graphState
  const router = useRouter()

  const loadConnections = useCallback(async () => {
    try {
      setLoading(true)

      if (!currentGraphId) {
        return
      }

      const qbConnections = await SDK.listConnections({
        path: { graph_id: currentGraphId },
        query: {
          entity_id: currentGraphId,
          provider: 'quickbooks',
        },
      }).catch((error) => {
        console.error('Failed to load connections:', error)
        return {
          data: { connections: [] },
        } as ApiResponse<ConnectionsResponse>
      })

      const qbList = Array.isArray(qbConnections.data) ? qbConnections.data : []

      const allConnections = qbList.map((conn: any, index: number) => ({
        id: `qb_${index}`,
        connection: {
          properties: {
            provider: 'QuickBooks',
            status:
              (conn.status as Connection['connection']['properties']['status']) ||
              'connected',
            lastSync: conn.last_sync,
            companyName: conn.metadata?.entity_name,
            connectionId: conn.connection_id,
          },
        },
      }))

      setConnections(allConnections)
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

  // Poll active tasks for status updates
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

  const loadAvailableProviders = async () => {
    if (!currentGraphId) return

    setProvidersLoading(true)
    try {
      const response = await SDK.getConnectionOptions({
        path: { graph_id: currentGraphId },
      })
      if (response.data?.providers) {
        setAvailableProviders(response.data.providers)
      }
    } catch (err) {
      console.error('Failed to load connection options:', err)
      showError('Failed to load available connections')
    } finally {
      setProvidersLoading(false)
    }
  }

  const openMarketplace = () => {
    setMarketplaceOpen(true)
    loadAvailableProviders()
  }

  const handleConnectProvider = async (provider: ConnectionProviderInfo) => {
    if (!currentGraphId) {
      showError('No graph selected')
      return
    }

    setConnectingProvider(provider.provider)

    try {
      // Create the connection
      const createResponse = await SDK.createConnection({
        path: { graph_id: currentGraphId },
        body: {
          entity_id: currentGraphId,
          provider: provider.provider,
        },
      })

      const connectionId = (createResponse.data as any)?.connection_id
      if (!connectionId) {
        throw new Error(`Failed to create ${provider.display_name} connection`)
      }

      // Handle OAuth-based providers
      if (provider.auth_type === 'oauth') {
        const oauthResponse = await SDK.initOAuth({
          path: { graph_id: currentGraphId },
          body: {
            connection_id: connectionId,
            redirect_uri: `${window.location.origin}/connections/qb-callback`,
          },
        })

        if ((oauthResponse.data as any)?.auth_url) {
          router.push((oauthResponse.data as any).auth_url)
          return
        } else {
          throw new Error(
            `Failed to initiate ${provider.display_name} OAuth flow`
          )
        }
      }

      // For non-OAuth providers, refresh and close
      showSuccess(`${provider.display_name} connection created`)
      setMarketplaceOpen(false)
      loadConnections()
    } catch (error) {
      console.error('Connection error:', error)
      showError(`Failed to connect to ${provider.display_name}`)
    } finally {
      setConnectingProvider(null)
    }
  }

  const handleSync = async (connectionId?: string) => {
    try {
      if (!currentGraphId) {
        showError('No graph selected')
        return
      }

      const syncResponse = await SDK.syncConnection({
        path: {
          graph_id: currentGraphId,
          connection_id: connectionId || 'default',
        },
        body: { full_sync: true },
      })

      if (syncResponse.data?.task_id) {
        setActiveTasks((prev) =>
          new Map(prev).set(syncResponse.data.task_id, {
            task_id: syncResponse.data.task_id,
            status: syncResponse.data.status || 'pending',
            message: syncResponse.data.message || 'Sync started...',
          })
        )
        showSuccess('Sync started successfully')
      } else {
        const errorMsg = syncResponse.data?.error || 'Failed to start sync'
        setError(errorMsg)
        showError(errorMsg)
      }
    } catch (err: any) {
      const errorMsg = 'Failed to start sync'
      setError(errorMsg)
      showError(errorMsg)
      console.error('Error syncing:', err)
    }
  }

  const handleDeleteConnection = async () => {
    if (!connectionToDelete) return

    try {
      if (!currentGraphId) {
        showError('No graph selected')
        return
      }

      const connectionId = connectionToDelete.connection.properties.connectionId
      if (!connectionId) {
        showError('Connection ID not found')
        return
      }

      await SDK.deleteConnection({
        path: {
          graph_id: currentGraphId,
          connection_id: connectionId,
        },
      })
      showSuccess('Connection deleted successfully')
      loadConnections()
    } catch (err: any) {
      console.error('Delete connection error:', err)
      showError('Failed to delete connection')
    } finally {
      setDeleteModalOpen(false)
      setConnectionToDelete(null)
    }
  }

  const confirmDeleteConnection = (connection: Connection) => {
    setConnectionToDelete(connection)
    setDeleteModalOpen(true)
  }

  const getConnectionStatus = (connection: Connection) => {
    const props = connection.connection.properties

    for (const task of activeTasks.values()) {
      if (task.message.toLowerCase().includes(props.provider.toLowerCase())) {
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
      status: props.status,
      message:
        props.error ||
        (props.lastSync
          ? `Last sync: ${new Date(props.lastSync).toLocaleString()}`
          : 'Never synced'),
      progress: undefined,
      step: undefined,
      error: props.error,
    }
  }

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
          {connections.map((connection, index) => {
            const status = getConnectionStatus(connection)

            return (
              <ConnectionCard
                key={connection.id || index}
                status={status}
                connection={connection}
                onSync={() =>
                  handleSync(connection.connection.properties.connectionId)
                }
                onDelete={() => confirmDeleteConnection(connection)}
              />
            )
          })}

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

        {/* Connection Marketplace Modal */}
        <Modal
          show={marketplaceOpen}
          onClose={() => setMarketplaceOpen(false)}
          size="2xl"
        >
          <ModalHeader>
            <div className="flex items-center gap-3">
              <HiLink className="h-5 w-5 text-gray-500" />
              <span>Connection Marketplace</span>
            </div>
          </ModalHeader>
          <ModalBody>
            {providersLoading ? (
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
                    onConnect={() => handleConnectProvider(provider)}
                    isConnecting={connectingProvider === provider.provider}
                  />
                ))}
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              color="gray"
              theme={customTheme.button}
              onClick={() => setMarketplaceOpen(false)}
            >
              Close
            </Button>
          </ModalFooter>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal show={deleteModalOpen} onClose={() => setDeleteModalOpen(false)}>
          <ModalHeader>Delete Connection</ModalHeader>
          <ModalBody>
            <p className="text-gray-700 dark:text-gray-300">
              Are you sure you want to delete the{' '}
              <strong>
                {connectionToDelete?.connection.properties.provider}
              </strong>{' '}
              connection? This action cannot be undone.
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

// --- Provider Row (Marketplace) ---

interface ProviderRowProps {
  provider: ConnectionProviderInfo
  onConnect: () => void
  isConnecting: boolean
}

function ProviderRow({ provider, onConnect, isConnecting }: ProviderRowProps) {
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
          disabled={isConnecting}
        >
          {isConnecting ? (
            <>
              <Spinner size="sm" className="mr-2" />
              Connecting...
            </>
          ) : (
            'Connect'
          )}
        </Button>
      </div>
    </div>
  )
}

// --- Connection Card (Existing Connections) ---

interface ConnectionCardProps {
  status: {
    status: string
    message: string
    progress?: number
    step?: string
    error?: string
  }
  connection: Connection
  onSync: () => void
  onDelete: () => void
}

function ConnectionCard({
  status,
  connection,
  onSync,
  onDelete,
}: ConnectionCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
      case 'completed':
        return 'success'
      case 'syncing':
      case 'in_progress':
      case 'pending':
        return 'warning'
      case 'error':
      case 'failed':
        return 'failure'
      default:
        return 'gray'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
      case 'completed':
        return HiCheckCircle
      case 'syncing':
      case 'in_progress':
      case 'pending':
        return HiClock
      case 'error':
      case 'failed':
        return HiExclamationCircle
      default:
        return undefined
    }
  }

  const props = connection.connection.properties

  return (
    <Card theme={customTheme.card}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Image
            src="/images/qb_connect.png"
            alt="QuickBooks"
            width={60}
            height={32}
            className="rounded"
          />

          <div className="flex-1">
            <h3 className="font-heading mb-2 text-xl font-bold dark:text-white">
              {props.provider} Integration
            </h3>

            <div className="mb-2 flex items-center gap-2">
              <Badge
                color={getStatusColor(status.status)}
                icon={getStatusIcon(status.status)}
                className="flex items-center gap-1"
              >
                {status.status.charAt(0).toUpperCase() + status.status.slice(1)}
              </Badge>
            </div>

            {props.companyName && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p>Company: {props.companyName}</p>
              </div>
            )}

            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {status.message}
            </p>

            {status.step && (
              <p className="mt-1 text-sm text-blue-600 dark:text-blue-400">
                Current step: {status.step}
              </p>
            )}

            {status.progress !== undefined && (
              <div className="mt-3">
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Progress
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {Math.round(status.progress)}%
                  </span>
                </div>
                <Progress progress={status.progress} color="blue" />
              </div>
            )}

            {status.error && (
              <Alert color="failure" className="mt-3">
                {status.error}
              </Alert>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            color="primary"
            theme={customTheme.button}
            onClick={onSync}
            disabled={
              status.status === 'syncing' ||
              status.status === 'in_progress' ||
              status.status === 'pending'
            }
          >
            <HiRefresh className="mr-2 h-4 w-4" />
            {status.status === 'syncing' ||
            status.status === 'in_progress' ||
            status.status === 'pending'
              ? 'Syncing...'
              : 'Sync Now'}
          </Button>
          <Button
            size="sm"
            color="failure"
            theme={customTheme.button}
            onClick={onDelete}
            disabled={
              status.status === 'syncing' ||
              status.status === 'in_progress' ||
              status.status === 'pending'
            }
            title="Delete connection"
          >
            <FaTrash className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </Card>
  )
}
