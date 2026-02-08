'use client'

import { customTheme, useGraphContext, useIsRepository } from '@/lib/core'
import { useToast } from '@/lib/core/hooks/use-toast'
import { useOperationMonitoring } from '@/lib/core/task-monitoring/operationHooks'
import type { BackupResponse, BackupStatsResponse } from '@robosystems/client'
import {
  createBackup,
  getBackupDownloadUrl,
  getBackupStats,
  listBackups,
  listSubgraphs,
  restoreBackup,
} from '@robosystems/client'
import {
  Badge,
  Button,
  Card,
  Checkbox,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Progress,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
  TextInput,
  Tooltip,
} from 'flowbite-react'
import { useCallback, useEffect, useState } from 'react'
import {
  HiCheckCircle,
  HiDatabase,
  HiDownload,
  HiExclamation,
  HiInformationCircle,
  HiPlus,
  HiRefresh,
  HiUpload,
} from 'react-icons/hi'

interface DownloadQuota {
  limit_per_day: number
  used_today: number
  remaining: number
  resets_at: string
}

export default function BackupManagementContent() {
  const { state: graphState } = useGraphContext()
  const selectedGraphId = graphState.currentGraphId
  const { isRepository } = useIsRepository()
  const { showSuccess, showError, showInfo, ToastContainer } = useToast()

  const [backups, setBackups] = useState<BackupResponse[]>([])
  const [backupStats, setBackupStats] = useState<BackupStatsResponse | null>(
    null
  )
  const [selectedBackup, setSelectedBackup] = useState<BackupResponse | null>(
    null
  )
  const [downloadQuota, setDownloadQuota] = useState<DownloadQuota | null>(null)
  const [graphIdToName, setGraphIdToName] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showRestoreModal, setShowRestoreModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  const [createFormEncryption, setCreateFormEncryption] = useState(false)
  const [createFormRetentionDays, setCreateFormRetentionDays] = useState(90)

  const [restoreFormVerify, setRestoreFormVerify] = useState(true)

  const createOperationMonitor = useOperationMonitoring()
  const restoreOperationMonitor = useOperationMonitoring()

  const fetchBackupData = useCallback(async () => {
    if (!selectedGraphId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Fetch parent graph backups
      const backupsResponse = await listBackups({
        path: { graph_id: selectedGraphId },
      })

      if (!backupsResponse.data) {
        const errorMsg = (backupsResponse as any).error
          ? typeof (backupsResponse as any).error === 'object'
            ? JSON.stringify((backupsResponse as any).error)
            : String((backupsResponse as any).error)
          : 'Unknown error occurred'
        throw new Error(`Failed to fetch backups: ${errorMsg}`)
      }

      let allBackups = [...(backupsResponse.data?.backups || [])]
      const nameMap: Record<string, string> = {
        [selectedGraphId]: 'Parent',
      }

      // Set download quota for shared repositories
      if ((backupsResponse.data as any)?.download_quota) {
        setDownloadQuota((backupsResponse.data as any).download_quota)
      } else {
        setDownloadQuota(null)
      }

      // Fetch subgraph backups for non-repository graphs
      if (!isRepository) {
        try {
          const subgraphsResponse = await listSubgraphs({
            path: { graph_id: selectedGraphId },
          })

          const subgraphs = subgraphsResponse.data?.subgraphs || []

          if (subgraphs.length > 0) {
            // Build name map
            for (const sg of subgraphs) {
              nameMap[sg.graph_id] = sg.display_name
            }

            // Fetch backups for each subgraph in parallel
            const subgraphBackupResults = await Promise.allSettled(
              subgraphs.map((sg) =>
                listBackups({ path: { graph_id: sg.graph_id } })
              )
            )

            for (const result of subgraphBackupResults) {
              if (result.status === 'fulfilled' && result.value.data?.backups) {
                allBackups.push(...result.value.data.backups)
              }
            }
          }
        } catch (sgErr) {
          // Silently skip - subgraphs may not be available
          console.warn('Could not fetch subgraph backups:', sgErr)
        }
      }

      // Sort all backups by created_at descending
      allBackups.sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0
        return dateB - dateA
      })

      setBackups(allBackups)
      setGraphIdToName(nameMap)

      try {
        const statsResponse = await getBackupStats({
          path: { graph_id: selectedGraphId },
        })
        if (statsResponse.data) {
          setBackupStats(statsResponse.data)
        }
      } catch (statsErr) {
        console.warn('Backup statistics not available:', statsErr)
        setBackupStats(null)
      }
    } catch (err) {
      console.error('Backup data fetch error:', err)
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load backup data'
      setError(errorMessage)
      showError(`Failed to load backup data: ${errorMessage}`, 8000)
    } finally {
      setLoading(false)
    }
  }, [selectedGraphId, isRepository, showError])

  useEffect(() => {
    fetchBackupData()
  }, [fetchBackupData])

  useEffect(() => {
    if (
      createOperationMonitor.progress === 100 &&
      createOperationMonitor.operationId &&
      !createOperationMonitor.error
    ) {
      const timer = setTimeout(() => {
        fetchBackupData()
        setCreateFormEncryption(false)
        setCreateFormRetentionDays(90)
        createOperationMonitor.reset()
        setShowCreateModal(false)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [
    createOperationMonitor,
    fetchBackupData,
    setCreateFormEncryption,
    setCreateFormRetentionDays,
    setShowCreateModal,
  ])

  useEffect(() => {
    if (
      restoreOperationMonitor.progress === 100 &&
      restoreOperationMonitor.operationId &&
      !restoreOperationMonitor.error
    ) {
      const timer = setTimeout(() => {
        showSuccess('Backup restored successfully!', 5000)
        fetchBackupData()
        setShowRestoreModal(false)
        setRestoreFormVerify(true)
        restoreOperationMonitor.reset()
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [
    restoreOperationMonitor,
    fetchBackupData,
    showSuccess,
    setShowRestoreModal,
    setRestoreFormVerify,
  ])

  useEffect(() => {
    if (createOperationMonitor.error) {
      showError(`Backup Creation Failed: ${createOperationMonitor.error}`, 8000)
    }
  }, [createOperationMonitor.error, showError])

  useEffect(() => {
    if (restoreOperationMonitor.error) {
      showError(`Restore Failed: ${restoreOperationMonitor.error}`, 8000)
    }
  }, [restoreOperationMonitor.error, showError])

  const handleCloseCreateModal = () => {
    if (
      !createOperationMonitor.isMonitoring ||
      createOperationMonitor.progress === 100
    ) {
      setShowCreateModal(false)
      setCreateFormEncryption(false)
      setCreateFormRetentionDays(90)
      createOperationMonitor.reset()
    }
  }

  const handleCreateBackup = async () => {
    if (!selectedGraphId) return

    try {
      const response = await createBackup({
        path: { graph_id: selectedGraphId },
        body: {
          backup_format: 'full_dump',
          encryption: createFormEncryption,
          retention_days: createFormRetentionDays,
        },
      })

      if (response.data) {
        const operationId = (response.data as any).operation_id
        showInfo('Backup creation started...', 3000)
        await createOperationMonitor.startMonitoring(operationId)
        showSuccess('Backup operation completed successfully!')
        fetchBackupData()
      } else {
        throw new Error('Failed to create backup')
      }
    } catch (err: any) {
      console.error('Backup creation error:', err)

      if (err.status === 403) {
        showError(
          'Backup creation is currently disabled. Please contact support if you need assistance.',
          8000
        )
      } else {
        showError(err.message || 'Failed to create backup', 5000)
      }
    }
  }

  const handleRestoreBackup = async () => {
    if (!selectedBackup || !selectedGraphId) return

    try {
      const response = await restoreBackup({
        path: {
          graph_id: selectedBackup.graph_id,
          backup_id: selectedBackup.backup_id,
        },
        body: {
          verify_after_restore: restoreFormVerify,
        },
      })

      if (response.data) {
        const operationId = (response.data as any).operation_id
        await restoreOperationMonitor.startMonitoring(operationId)
        // Success/failure handled by useEffect hooks monitoring restoreOperationMonitor
        // Modal will auto-close on success
      } else {
        throw new Error('Failed to start restore')
      }
    } catch (err) {
      console.error('Restore error:', err)
      showError('Failed to restore backup', 5000)
    }
  }

  const handleDownloadBackup = async (backup: BackupResponse) => {
    if (!selectedGraphId) return

    if (backup.encryption_enabled) {
      showError(
        'Encrypted backups cannot be downloaded for security reasons',
        5000
      )
      return
    }

    try {
      const response = await getBackupDownloadUrl({
        path: {
          graph_id: backup.graph_id,
          backup_id: backup.backup_id,
        },
        query: { expires_in: 3600 },
      })

      if (response.data?.download_url) {
        window.open(response.data.download_url, '_blank')
        showSuccess('Download started', 3000)
      } else {
        throw new Error('Failed to get download URL')
      }
    } catch (err) {
      console.error('Download error:', err)
      showError('Failed to download backup', 5000)
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i)) + ' ' + sizes[i]
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleString()
  }

  const getStatusBadge = (status: string) => {
    const statusColors: { [key: string]: string } = {
      completed: 'success',
      in_progress: 'warning',
      failed: 'failure',
      pending: 'info',
    }
    return (
      <Badge color={statusColors[status] || 'gray'} size="sm">
        {status}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <Spinner size="xl" />
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Loading backups...
          </p>
        </div>
      </div>
    )
  }

  if (!selectedGraphId) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <Card theme={customTheme.card}>
          <div className="py-12 text-center">
            <HiDatabase className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              No graph selected
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Please select a graph to manage backups.
            </p>
          </div>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <Card theme={customTheme.card}>
          <div className="py-12 text-center">
            <HiExclamation className="mx-auto h-12 w-12 text-red-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              Error loading backups
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {error}
            </p>
            <Button onClick={fetchBackupData} className="mt-4">
              <HiRefresh className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 p-3">
            <HiDatabase className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="font-heading text-3xl font-bold text-gray-900 dark:text-white">
              Backups
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Manage database backups and restores
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button color="gray" onClick={fetchBackupData}>
            <HiRefresh className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          {!isRepository && (
            <Button
              onClick={() => {
                setCreateFormEncryption(false)
                setCreateFormRetentionDays(90)
                createOperationMonitor.reset()
                setShowCreateModal(true)
              }}
            >
              <HiPlus className="mr-2 h-4 w-4" />
              Create Backup
            </Button>
          )}
        </div>
      </div>

      {/* Download Quota Card for Shared Repositories */}
      {isRepository && downloadQuota && (
        <Card theme={customTheme.card}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900">
                <HiDownload className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  Daily Download Quota
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Resets at {new Date(downloadQuota.resets_at).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {downloadQuota.remaining} / {downloadQuota.limit_per_day}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                downloads remaining
              </div>
            </div>
          </div>
          {downloadQuota.remaining === 0 && (
            <div className="mt-3 rounded-lg bg-yellow-50 p-3 dark:bg-yellow-900/20">
              <div className="flex items-center gap-2 text-sm text-yellow-800 dark:text-yellow-300">
                <HiExclamation className="h-4 w-4" />
                <span>
                  Daily download limit reached. Limit resets at{' '}
                  {new Date(downloadQuota.resets_at).toLocaleTimeString()}.
                </span>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Stats Cards - Only for user graphs */}
      {!isRepository && backupStats && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card theme={customTheme.card}>
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-500 dark:text-gray-300">
                Total Backups
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {backupStats.total_backups}
              </div>
            </div>
          </Card>
          <Card theme={customTheme.card}>
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-500 dark:text-gray-300">
                Success Rate
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {backupStats.success_rate}%
              </div>
            </div>
          </Card>
          <Card theme={customTheme.card}>
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-500 dark:text-gray-300">
                Total Size
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatBytes(backupStats.total_compressed_size_bytes)}
              </div>
            </div>
          </Card>
          <Card theme={customTheme.card}>
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-500 dark:text-gray-300">
                Space Saved
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatBytes(backupStats.storage_saved_bytes)}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Backups Table */}
      <Card theme={customTheme.card}>
        <Table>
          <TableHead>
            <TableHeadCell>Created</TableHeadCell>
            {Object.keys(graphIdToName).length > 1 && (
              <TableHeadCell>Source</TableHeadCell>
            )}
            <TableHeadCell>Status</TableHeadCell>
            <TableHeadCell>Size</TableHeadCell>
            <TableHeadCell>Encrypted</TableHeadCell>
            <TableHeadCell>Actions</TableHeadCell>
          </TableHead>
          <TableBody className="divide-y">
            {backups.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={Object.keys(graphIdToName).length > 1 ? 6 : 5}
                  className="py-12 text-center"
                >
                  <div className="text-gray-500 dark:text-gray-300">
                    <HiDatabase className="mx-auto mb-4 h-12 w-12 text-gray-400 dark:text-gray-500" />
                    <p className="font-medium text-gray-700 dark:text-gray-200">
                      No backups found
                    </p>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      {isRepository
                        ? 'No backups available yet. System backups are generated periodically.'
                        : 'Create your first backup to get started'}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              backups.map((backup) => (
                <TableRow
                  key={backup.backup_id}
                  className="bg-white dark:border-gray-700 dark:bg-zinc-800"
                >
                  <TableCell className="font-medium">
                    {formatDate(backup.created_at)}
                  </TableCell>
                  {Object.keys(graphIdToName).length > 1 && (
                    <TableCell>
                      <Badge
                        color={
                          backup.graph_id === selectedGraphId
                            ? 'gray'
                            : 'purple'
                        }
                        size="sm"
                      >
                        {graphIdToName[backup.graph_id] || backup.graph_id}
                      </Badge>
                    </TableCell>
                  )}
                  <TableCell>{getStatusBadge(backup.status)}</TableCell>
                  <TableCell>
                    {formatBytes(backup.compressed_size_bytes)}
                  </TableCell>
                  <TableCell>
                    {backup.encryption_enabled ? (
                      <Badge color="success" size="sm">
                        Yes
                      </Badge>
                    ) : (
                      <Badge color="gray" size="sm">
                        No
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Tooltip content="View details">
                        <Button
                          size="sm"
                          color="gray"
                          onClick={() => {
                            setSelectedBackup(backup)
                            setShowDetailsModal(true)
                          }}
                        >
                          <HiInformationCircle className="h-4 w-4" />
                        </Button>
                      </Tooltip>
                      {!backup.encryption_enabled && (
                        <Tooltip
                          content={
                            isRepository && downloadQuota?.remaining === 0
                              ? 'Daily download limit reached'
                              : 'Download backup'
                          }
                        >
                          <Button
                            size="sm"
                            color="gray"
                            onClick={() => handleDownloadBackup(backup)}
                            disabled={
                              isRepository && downloadQuota?.remaining === 0
                            }
                          >
                            <HiDownload className="h-4 w-4" />
                          </Button>
                        </Tooltip>
                      )}
                      {/* Restore button - only for user graphs with encrypted backups */}
                      {!isRepository && backup.encryption_enabled && (
                        <Tooltip content="Restore backup">
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedBackup(backup)
                              setShowRestoreModal(true)
                            }}
                          >
                            <HiUpload className="h-4 w-4" />
                          </Button>
                        </Tooltip>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Create Backup Modal */}
      <Modal show={showCreateModal} onClose={handleCloseCreateModal} size="md">
        <ModalHeader>Create Backup</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <div>
              <Label>Backup Format</Label>
              <TextInput value="Full Database (.lbug)" disabled />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Complete database backup
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="encryption"
                checked={createFormEncryption}
                onChange={(e) => setCreateFormEncryption(e.target.checked)}
              />
              <Label htmlFor="encryption">
                Enable encryption (recommended)
              </Label>
            </div>
            <div>
              <Label htmlFor="retention">Retention Days</Label>
              <TextInput
                id="retention"
                type="number"
                min={1}
                max={2555}
                value={createFormRetentionDays}
                onChange={(e) =>
                  setCreateFormRetentionDays(parseInt(e.target.value))
                }
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                How long to keep the backup (1-2555 days)
              </p>
            </div>
            {createOperationMonitor.isMonitoring && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300">
                  <span>Progress</span>
                  <span>{createOperationMonitor.progress}%</span>
                </div>
                <Progress
                  progress={createOperationMonitor.progress}
                  color="blue"
                />
                {createOperationMonitor.currentStep && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {createOperationMonitor.currentStep}
                  </p>
                )}
              </div>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            onClick={handleCreateBackup}
            disabled={
              createOperationMonitor.isMonitoring &&
              createOperationMonitor.progress !== 100
            }
          >
            {createOperationMonitor.isMonitoring &&
            createOperationMonitor.progress !== 100 ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Creating...
              </>
            ) : (
              <>
                <HiPlus className="mr-2 h-4 w-4" />
                Create Backup
              </>
            )}
          </Button>
          <Button
            color="gray"
            onClick={handleCloseCreateModal}
            disabled={
              createOperationMonitor.isMonitoring &&
              createOperationMonitor.progress !== 100
            }
          >
            Cancel
          </Button>
        </ModalFooter>
      </Modal>

      {/* Restore Modal */}
      <Modal
        show={showRestoreModal}
        onClose={() => setShowRestoreModal(false)}
        size="md"
      >
        <ModalHeader>Restore Backup</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <div className="rounded-lg bg-yellow-50 p-4 dark:bg-yellow-900/20">
              <div className="flex gap-2">
                <HiExclamation className="h-5 w-5 text-yellow-600" />
                <div>
                  <h4 className="font-medium text-yellow-800 dark:text-yellow-300">
                    Warning
                  </h4>
                  <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-400">
                    This will replace your current database with the backup.
                    This operation cannot be undone.
                  </p>
                </div>
              </div>
            </div>
            {selectedBackup && (
              <div>
                <Label>Backup Details</Label>
                <div className="mt-2 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">
                      Created:
                    </span>
                    <span className="text-gray-900 dark:text-white">
                      {formatDate(selectedBackup.created_at)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">
                      Size:
                    </span>
                    <span className="text-gray-900 dark:text-white">
                      {formatBytes(selectedBackup.compressed_size_bytes)}
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Checkbox
                id="verify"
                checked={restoreFormVerify}
                onChange={(e) => setRestoreFormVerify(e.target.checked)}
              />
              <Label htmlFor="verify">Verify database after restore</Label>
            </div>
            {restoreOperationMonitor.isMonitoring && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300">
                  <span>Progress</span>
                  <span>{restoreOperationMonitor.progress}%</span>
                </div>
                <Progress
                  progress={restoreOperationMonitor.progress}
                  color="blue"
                />
                {restoreOperationMonitor.currentStep && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {restoreOperationMonitor.currentStep}
                  </p>
                )}
              </div>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            onClick={handleRestoreBackup}
            disabled={
              restoreOperationMonitor.isMonitoring &&
              restoreOperationMonitor.progress !== 100
            }
            color="gray"
          >
            {restoreOperationMonitor.isMonitoring &&
            restoreOperationMonitor.progress !== 100 ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Restoring...
              </>
            ) : (
              <>
                <HiCheckCircle className="mr-2 h-4 w-4" />
                Restore Backup
              </>
            )}
          </Button>
          <Button
            color="gray"
            onClick={() => {
              setShowRestoreModal(false)
              setRestoreFormVerify(true)
              restoreOperationMonitor.reset()
            }}
            disabled={
              restoreOperationMonitor.isMonitoring &&
              restoreOperationMonitor.progress !== 100
            }
          >
            {restoreOperationMonitor.progress === 100 ? 'Close' : 'Cancel'}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Details Modal */}
      <Modal
        show={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        size="lg"
      >
        <ModalHeader>Backup Details</ModalHeader>
        <ModalBody>
          {selectedBackup && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Backup ID</Label>
                  <p className="mt-1 font-mono text-sm text-gray-900 dark:text-gray-100">
                    {selectedBackup.backup_id}
                  </p>
                </div>
                <div>
                  <Label>Status</Label>
                  <div className="mt-1">
                    {getStatusBadge(selectedBackup.status)}
                  </div>
                </div>
                <div>
                  <Label>Created</Label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                    {formatDate(selectedBackup.created_at)}
                  </p>
                </div>
                <div>
                  <Label>Completed</Label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                    {formatDate(selectedBackup.completed_at)}
                  </p>
                </div>
                <div>
                  <Label>Original Size</Label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                    {formatBytes(selectedBackup.original_size_bytes)}
                  </p>
                </div>
                <div>
                  <Label>Compressed Size</Label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                    {formatBytes(selectedBackup.compressed_size_bytes)}
                  </p>
                </div>
                <div>
                  <Label>Compression Ratio</Label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                    {(selectedBackup.compression_ratio * 100).toFixed(1)}%
                  </p>
                </div>
                <div>
                  <Label>Duration</Label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                    {selectedBackup.backup_duration_seconds.toFixed(1)}s
                  </p>
                </div>
                <div>
                  <Label>Nodes</Label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                    {selectedBackup.node_count?.toLocaleString() || 0}
                  </p>
                </div>
                <div>
                  <Label>Relationships</Label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                    {selectedBackup.relationship_count?.toLocaleString() || 0}
                  </p>
                </div>
                <div>
                  <Label>Encryption</Label>
                  <p className="mt-1">
                    {selectedBackup.encryption_enabled ? (
                      <Badge color="success">Enabled</Badge>
                    ) : (
                      <Badge color="gray">Disabled</Badge>
                    )}
                  </p>
                </div>
                <div>
                  <Label>Compression</Label>
                  <p className="mt-1">
                    {selectedBackup.compression_enabled ? (
                      <Badge color="success">Enabled</Badge>
                    ) : (
                      <Badge color="gray">Disabled</Badge>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button color="gray" onClick={() => setShowDetailsModal(false)}>
            Close
          </Button>
        </ModalFooter>
      </Modal>

      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  )
}
