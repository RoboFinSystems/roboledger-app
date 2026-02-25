// @ts-nocheck - connections functionality removed from SDK, pending overhaul
'use client'

/* eslint-disable react/prop-types */
import { customTheme, SDK, useGraphContext, useToast } from '@/lib/core'
import { Spinner } from '@/lib/core/ui-components'
import {
  Alert,
  Badge,
  Breadcrumb,
  BreadcrumbItem,
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
import { FaPlus, FaTrash } from 'react-icons/fa'
import {
  HiCheckCircle,
  HiClock,
  HiExclamationCircle,
  HiHome,
  HiRefresh,
} from 'react-icons/hi'

interface Connection {
  id: string
  connection: {
    properties: {
      provider: 'QuickBooks' | 'SEC' | 'Plaid'
      status: 'connected' | 'disconnected' | 'syncing' | 'error'
      lastSync?: string
      companyName?: string
      cik?: string
      itemId?: string
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

interface QuickBooksConnection {
  id?: string
  connection_id?: string
  status?: string
  last_sync?: string
  company_name?: string
}

interface PlaidConnection {
  status?: string
  last_sync?: string
  item_id?: string
  institution_name?: string
}

interface SecConnection {
  status?: string
  last_sync?: string
  cik?: string
  company_name?: string
}

interface ConnectionsResponse {
  connections: QuickBooksConnection[] | PlaidConnection[] | SecConnection[]
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
  const { showError, showSuccess, ToastContainer } = useToast()
  const { state: graphState } = useGraphContext()
  const { currentGraphId } = graphState
  const router = useRouter()

  const loadConnections = useCallback(async () => {
    try {
      setLoading(true)

      // Get current graph selection
      if (!currentGraphId) {
        console.log('Graph check failed:', { currentGraphId })
        showError('No graph selected')
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
          }).catch((error) => {
            console.error('Failed to load QuickBooks connections:', error)
            return {
              data: { connections: [] },
            } as ApiResponse<ConnectionsResponse>
          }),
          SDK.listConnections({
            path: { graph_id: currentGraphId },
            query: {
              entity_id: currentGraphId,
              provider: 'plaid',
            },
          }).catch((error) => {
            console.error('Failed to load Plaid connections:', error)
            return {
              data: { connections: [] },
            } as ApiResponse<ConnectionsResponse>
          }),
          SDK.listConnections({
            path: { graph_id: currentGraphId },
            query: {
              entity_id: currentGraphId,
              provider: 'sec',
            },
          }).catch((error) => {
            console.error('Failed to load SEC connections:', error)
            return {
              data: { connections: [] },
            } as ApiResponse<ConnectionsResponse>
          }),
        ])

      // Combine and format connections
      // API returns array directly, not { connections: [...] }
      const qbList = Array.isArray(qbConnections.data) ? qbConnections.data : []
      const plaidList = Array.isArray(plaidConnections.data)
        ? plaidConnections.data
        : []
      const secList = Array.isArray(secConnections.data)
        ? secConnections.data
        : []

      const allConnections = [
        ...qbList.map((conn: any, index: number) => ({
          id: `qb_${index}`,
          connection: {
            properties: {
              provider: 'QuickBooks' as const,
              status:
                (conn.status as Connection['connection']['properties']['status']) ||
                'connected',
              lastSync: conn.last_sync,
              companyName: conn.metadata?.entity_name,
              connectionId: conn.connection_id,
              realmId: conn.metadata?.realm_id,
            },
          },
        })),
        ...plaidList.map((conn: any, index: number) => ({
          id: `plaid_${index}`,
          connection: {
            properties: {
              provider: 'Plaid' as const,
              status:
                (conn.status as Connection['connection']['properties']['status']) ||
                'connected',
              lastSync: conn.last_sync,
              itemId: conn.metadata?.item_id,
              institutionName: conn.metadata?.institution_name,
            },
          },
        })),
        ...secList.map((conn: any, index: number) => ({
          id: `sec_${index}`,
          connection: {
            properties: {
              provider: 'SEC' as const,
              status:
                (conn.status as Connection['connection']['properties']['status']) ||
                'connected',
              lastSync: conn.last_sync,
              cik: conn.metadata?.cik,
              companyName: conn.metadata?.entity_name,
            },
          },
        })),
      ]

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

  // Load connections when graph is available
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
              // Ensure the status from SDK matches our expected types
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

              // If task completed, refresh connections
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
    }, 2000) // Poll every 2 seconds

    return () => clearInterval(interval)
  }, [activeTasks, loadConnections])

  const handleSync = async (
    provider: string,
    itemId?: string,
    connectionId?: string
  ) => {
    try {
      // Get current graph selection
      if (!currentGraphId) {
        console.log('Graph check failed in handler:', {
          currentGraphId,
        })
        showError('No graph selected')
        return
      }

      // Call backend sync APIs directly based on provider
      let syncResponse: any

      switch (provider) {
        case 'QuickBooks': {
          syncResponse = await SDK.syncConnection({
            path: {
              graph_id: currentGraphId,
              connection_id: connectionId || 'default',
            },
            body: {
              full_sync: true,
            },
          })
          break
        }
        case 'SEC': {
          syncResponse = await SDK.syncConnection({
            path: {
              graph_id: currentGraphId,
              connection_id: connectionId || 'default',
            },
            body: {
              full_sync: true,
            },
          })
          break
        }
        case 'Plaid': {
          if (!itemId) {
            const errorMsg = 'Item ID required for Plaid sync'
            setError(errorMsg)
            showError(errorMsg)
            return
          }
          syncResponse = await SDK.syncConnection({
            path: {
              graph_id: currentGraphId,
              connection_id: itemId || 'default',
            },
            body: {
              full_sync: true,
            },
          })
          break
        }
        default: {
          const errorMsg = 'Unknown provider'
          setError(errorMsg)
          showError(errorMsg)
          return
        }
      }

      if (syncResponse.data?.task_id) {
        // Add task to active tasks for monitoring
        setActiveTasks((prev) =>
          new Map(prev).set(syncResponse.data.task_id, {
            task_id: syncResponse.data.task_id,
            status: syncResponse.data.status || 'pending',
            message: syncResponse.data.message || 'Sync started...',
          })
        )
        showSuccess(`${provider} sync started successfully`)
      } else {
        const errorMsg =
          syncResponse.data?.error || `Failed to start ${provider} sync`
        setError(errorMsg)
        showError(errorMsg)
      }
    } catch (err: any) {
      const errorMsg = `Failed to start ${provider} sync`
      setError(errorMsg)
      showError(errorMsg)
      console.error(`Error syncing ${provider}:`, err)
    }
  }

  const handleDeleteConnection = async () => {
    if (!connectionToDelete) return

    try {
      // Check graph selection
      if (!currentGraphId) {
        showError('No graph selected')
        return
      }
      const provider = connectionToDelete.connection.properties.provider

      // Call appropriate delete API based on provider
      switch (provider) {
        case 'QuickBooks': {
          const connectionId =
            connectionToDelete.connection.properties.connectionId
          if (!connectionId) {
            showError('QuickBooks connection ID not found')
            break
          }
          await SDK.deleteConnection({
            path: {
              graph_id: currentGraphId,
              connection_id: connectionId,
            },
          })
          showSuccess('QuickBooks connection deleted successfully')
          break
        }
        case 'SEC': {
          await SDK.deleteConnection({
            path: {
              graph_id: currentGraphId,
              connection_id: 'sec-' + currentGraphId,
            },
          })
          showSuccess('SEC connection deleted successfully')
          break
        }
        case 'Plaid': {
          const itemId = connectionToDelete.connection.properties.itemId
          if (!itemId) {
            showError('Plaid item ID not found')
            break
          }
          await SDK.deleteConnection({
            path: {
              graph_id: currentGraphId,
              connection_id: itemId,
            },
          })
          showSuccess('Plaid connection deleted successfully')
          break
        }
        default: {
          showError('Unknown provider type')
          return
        }
      }

      // Refresh connections list
      loadConnections()
    } catch (err: any) {
      console.error('Delete connection error:', err)
      showError(
        `Failed to delete ${connectionToDelete.connection.properties.provider} connection`
      )
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

    // Check if there's an active task for this provider
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
      <div className="mb-4 grid grid-cols-1 gap-y-6 px-4 pt-6 xl:grid-cols-2 xl:gap-4 dark:border-gray-700">
        <div className="col-span-full xl:mb-2">
          <Breadcrumb className="mb-5">
            <BreadcrumbItem href="/home">
              <div className="flex items-center gap-x-3">
                <HiHome className="text-xl" />
                <span className="dark:text-white">Home</span>
              </div>
            </BreadcrumbItem>
            <BreadcrumbItem href="/companies">Company</BreadcrumbItem>
            <BreadcrumbItem>Connections</BreadcrumbItem>
          </Breadcrumb>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-heading text-xl font-semibold text-gray-900 sm:text-2xl dark:text-white">
                Data Connections
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Connect external data sources to automatically import
                transactions and financial data
              </p>
            </div>
            <div className="flex gap-3">
              <AddConnectionButton />
            </div>
          </div>
          {error && (
            <Alert color="failure" className="mt-4">
              {error}
            </Alert>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-y-4 px-4 pb-1">
        {connections.map((connection, index) => {
          const status = getConnectionStatus(connection)
          const provider = connection.connection.properties.provider

          return (
            <ConnectionCard
              key={connection.id || index}
              provider={provider}
              status={status}
              connection={connection}
              onSync={() =>
                handleSync(
                  provider,
                  connection.connection.properties.itemId,
                  connection.connection.properties.connectionId
                )
              }
              onDelete={() => confirmDeleteConnection(connection)}
            />
          )
        })}

        {connections.length === 0 && (
          <Card theme={customTheme.card}>
            <div className="py-8 text-center">
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                No connections found. Set up your first data connection to get
                started.
              </p>
              <div className="flex justify-center gap-4">
                <NewConnectionButtons />
              </div>
            </div>
          </Card>
        )}
      </div>

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
    </>
  )
}

interface ConnectionCardProps {
  provider: 'QuickBooks' | 'SEC' | 'Plaid'
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
  provider,
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

  const renderProviderDetails = () => {
    const props = connection.connection.properties

    switch (provider) {
      case 'QuickBooks':
        return (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {props.companyName && <p>Company: {props.companyName}</p>}
          </div>
        )
      case 'SEC':
        return (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {props.cik && <p>CIK: {props.cik}</p>}
          </div>
        )
      case 'Plaid':
        return (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {props.itemId && <p>Item ID: {props.itemId}</p>}
          </div>
        )
      default:
        return null
    }
  }

  return (
    <Card theme={customTheme.card}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          {provider === 'QuickBooks' && (
            <Image
              src="/images/qb_connect.png"
              alt="QuickBooks"
              width={60}
              height={32}
              className="rounded"
            />
          )}
          {provider === 'SEC' && (
            <div className="flex h-8 items-center justify-center rounded bg-blue-600">
              <span className="text-sm font-bold text-white">SEC</span>
            </div>
          )}
          {provider === 'Plaid' && (
            <div className="flex h-8 items-center justify-center rounded bg-green-600">
              <span className="text-sm font-bold text-white">PLAID</span>
            </div>
          )}

          <div className="flex-1">
            <h3 className="font-heading mb-2 text-xl font-bold dark:text-white">
              {provider} Integration
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

            {renderProviderDetails()}

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

function NewConnectionButtons() {
  const { showError } = useToast()
  const { state: graphState } = useGraphContext()
  const { currentGraphId } = graphState
  const router = useRouter()

  const handleConnectionClick = async (provider: string) => {
    try {
      // Get current graph selection
      if (!currentGraphId) {
        console.log('Graph check failed in handler:', {
          currentGraphId,
        })
        showError('No graph selected')
        return
      }

      if (provider === 'QuickBooks') {
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
          router.push((oauthResponse.data as any).auth_url)
        } else {
          showError('Failed to initiate QuickBooks connection')
        }
      } else if (provider === 'Plaid') {
        // Navigate to Plaid connect page
        router.push('/plaid-connect')
      } else if (provider === 'SEC') {
        // Navigate to SEC setup page
        router.push('/connections/sec/setup')
      }
    } catch (error) {
      console.error('Connection error:', error)
      showError(`Failed to connect to ${provider}`)
    }
  }

  return (
    <>
      <Button
        color="primary"
        theme={customTheme.button}
        onClick={() => handleConnectionClick('QuickBooks')}
      >
        Connect QuickBooks
      </Button>
      <Button
        color="primary"
        theme={customTheme.button}
        onClick={() => handleConnectionClick('Plaid')}
      >
        Connect Bank Account
      </Button>
      <Button
        color="primary"
        theme={customTheme.button}
        onClick={() => handleConnectionClick('SEC')}
      >
        Connect SEC Filings
      </Button>
    </>
  )
}

function AddConnectionButton() {
  const [showDropdown, setShowDropdown] = useState(false)
  const { showError } = useToast()
  const { state: graphState } = useGraphContext()
  const { currentGraphId } = graphState
  const router = useRouter()

  const handleConnectionClick = async (provider: string) => {
    try {
      // Get current graph selection
      if (!currentGraphId) {
        console.log('Graph check failed in handler:', {
          currentGraphId,
        })
        showError('No graph selected')
        return
      }

      setShowDropdown(false) // Close dropdown

      if (provider === 'QuickBooks') {
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
          router.push((oauthResponse.data as any).auth_url)
        } else {
          showError('Failed to initiate QuickBooks connection')
        }
      } else if (provider === 'Plaid') {
        // Navigate to Plaid connect page
        router.push('/plaid-connect')
      } else if (provider === 'SEC') {
        // Navigate to SEC setup page
        router.push('/connections/sec/setup')
      }
    } catch (error) {
      console.error('Connection error:', error)
      showError(`Failed to connect to ${provider}`)
    }
  }

  return (
    <div className="relative">
      <Button
        size="sm"
        color="primary"
        theme={customTheme.button}
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <FaPlus className="mr-2 h-4 w-4" />
        Add Connection
      </Button>

      {showDropdown && (
        <div className="absolute top-full right-0 z-10 mt-2 w-48 rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-800">
          <div className="py-1">
            <button
              onClick={() => handleConnectionClick('QuickBooks')}
              className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <Image
                src="/images/qb_connect.png"
                alt="QuickBooks"
                width={20}
                height={12}
                className="mr-3 rounded"
              />
              QuickBooks
            </button>
            <button
              onClick={() => handleConnectionClick('Plaid')}
              className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <div className="mr-3 flex h-3 w-5 items-center justify-center rounded bg-green-600">
                <span className="text-xs font-bold text-white">P</span>
              </div>
              Bank Account (Plaid)
            </button>
            <button
              onClick={() => handleConnectionClick('SEC')}
              className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <div className="mr-3 flex h-3 w-5 items-center justify-center rounded bg-blue-600">
                <span className="text-xs font-bold text-white">S</span>
              </div>
              SEC Filings
            </button>
          </div>
        </div>
      )}

      {showDropdown && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowDropdown(false)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setShowDropdown(false)
            }
          }}
          role="button"
          tabIndex={0}
        />
      )}
    </div>
  )
}
