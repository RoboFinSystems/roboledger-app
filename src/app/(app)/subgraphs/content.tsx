'use client'

import { customTheme, useGraphContext, useToast } from '@/lib/core'
import { useOperationMonitoring } from '@/lib/core/task-monitoring/operationHooks'
import type {
  ListSubgraphsResponse,
  SubgraphSummary,
} from '@robosystems/client'
import {
  createBackup,
  deleteSubgraph,
  listSubgraphs,
} from '@robosystems/client'
import {
  Alert,
  Badge,
  Button,
  Card,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from 'flowbite-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  HiChip,
  HiDatabase,
  HiExclamationCircle,
  HiPlus,
  HiTrash,
} from 'react-icons/hi'

export function SubgraphsContent() {
  const router = useRouter()
  const { state } = useGraphContext()
  const { showSuccess, showError, showInfo } = useToast()
  const currentGraphId = state.currentGraphId
  const [subgraphs, setSubgraphs] = useState<SubgraphSummary[]>([])
  const [listResponse, setListResponse] =
    useState<ListSubgraphsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [subgraphToDelete, setSubgraphToDelete] =
    useState<SubgraphSummary | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [backingUpId, setBackingUpId] = useState<string | null>(null)
  const backupOperationMonitor = useOperationMonitoring()

  const handleBackupClick = async (subgraph: SubgraphSummary) => {
    setBackingUpId(subgraph.graph_id)
    try {
      const response = await createBackup({
        path: { graph_id: subgraph.graph_id },
        body: {
          backup_format: 'full_dump',
          encryption: false,
          retention_days: 90,
        },
      })

      if (response.data) {
        const operationId = (response.data as any).operation_id
        showInfo('Backup started...', 3000)
        await backupOperationMonitor.startMonitoring(operationId)
        showSuccess(
          `Backup created for ${subgraph.display_name}. View it on the Backups page.`
        )
        backupOperationMonitor.reset()
      } else {
        throw new Error('Failed to create backup')
      }
    } catch (err: any) {
      console.error('Subgraph backup error:', err)
      if (err.status === 403) {
        showError('Backup creation is currently disabled.', 5000)
      } else {
        showError(err.message || 'Failed to create backup', 5000)
      }
    } finally {
      setBackingUpId(null)
    }
  }

  const fetchSubgraphs = async () => {
    if (!currentGraphId) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      // Fetch subgraphs list
      const response = await listSubgraphs({
        path: { graph_id: currentGraphId },
      })

      if (response.data) {
        setListResponse(response.data)
        setSubgraphs(response.data.subgraphs || [])
      }
    } catch (error: any) {
      console.error('Failed to fetch subgraphs:', error)
      showError('Failed to load subgraphs')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSubgraphs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentGraphId])

  const handleDeleteClick = (subgraph: SubgraphSummary) => {
    setSubgraphToDelete(subgraph)
    setDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!subgraphToDelete || !currentGraphId) return

    setIsDeleting(true)
    try {
      await deleteSubgraph({
        path: {
          graph_id: currentGraphId,
          subgraph_name: subgraphToDelete.subgraph_name,
        },
        body: {
          force: true,
          backup_first: false,
        },
      })

      showSuccess(
        `Subgraph "${subgraphToDelete.display_name}" deleted successfully`
      )
      setDeleteModalOpen(false)
      setSubgraphToDelete(null)
      fetchSubgraphs()
    } catch (error: any) {
      console.error('Failed to delete subgraph:', error)
      showError(error.message || 'Failed to delete subgraph')
    } finally {
      setIsDeleting(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const formatSize = (sizeMb: number | null | undefined) => {
    if (!sizeMb) return 'N/A'
    if (sizeMb < 1) return `${(sizeMb * 1024).toFixed(0)} KB`
    if (sizeMb >= 1024) return `${(sizeMb / 1024).toFixed(2)} GB`
    return `${sizeMb.toFixed(2)} MB`
  }

  // No graph selected state
  if (!currentGraphId) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <Alert color="warning" icon={HiExclamationCircle}>
          <span className="font-medium">No graph selected</span>
          <p className="mt-1 text-sm">
            Please select a graph from the home page to view its subgraphs.
          </p>
        </Alert>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <Spinner size="xl" />
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              Loading subgraphs...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 p-3">
            <HiChip className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="font-heading text-3xl font-bold text-gray-900 dark:text-white">
              Subgraphs
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Manage subgraphs for{' '}
              {listResponse?.parent_graph_name || 'selected graph'}
            </p>
          </div>
        </div>
        <Button onClick={() => router.push('/subgraphs/new')}>
          <HiPlus className="mr-2 h-4 w-4" />
          Create Subgraph
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4 md:gap-6">
        <Card theme={customTheme.card}>
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Subgraphs
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {listResponse?.subgraph_count ?? subgraphs.length}
            </div>
          </div>
        </Card>

        <Card theme={customTheme.card}>
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Quota
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {listResponse?.max_subgraphs
                ? `${listResponse.subgraph_count}/${listResponse.max_subgraphs}`
                : 'Unlimited'}
            </div>
          </div>
        </Card>

        <Card theme={customTheme.card}>
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Total Size
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatSize(listResponse?.total_size_mb)}
            </div>
          </div>
        </Card>

        <Card theme={customTheme.card}>
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Tier
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {listResponse?.parent_graph_tier
                ? listResponse.parent_graph_tier
                    .split('-')
                    .slice(-1)[0]
                    .toUpperCase()
                : 'N/A'}
            </div>
          </div>
        </Card>
      </div>

      {/* Subgraphs List - Mobile Optimized */}
      {subgraphs.length > 0 ? (
        <div className="space-y-4">
          {/* Desktop Table View */}
          <Card theme={customTheme.card} className="hidden md:block">
            <div className="w-full">
              <Table>
                <TableHead>
                  <TableHeadCell>Subgraph</TableHeadCell>
                  <TableHeadCell>Type</TableHeadCell>
                  <TableHeadCell>Status</TableHeadCell>
                  <TableHeadCell>Size</TableHeadCell>
                  <TableHeadCell>Created</TableHeadCell>
                  <TableHeadCell className="text-right">Actions</TableHeadCell>
                </TableHead>
                <TableBody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {subgraphs.map((subgraph) => (
                    <TableRow
                      key={subgraph.graph_id}
                      className="bg-white dark:bg-zinc-800"
                    >
                      <TableCell className="font-medium text-gray-900 dark:text-white">
                        <div className="flex items-center gap-3">
                          <div className="shrink-0 rounded-lg bg-blue-100 p-2 dark:bg-blue-900">
                            <HiChip className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold">
                              {subgraph.display_name}
                            </div>
                            <div
                              className="max-w-xs truncate font-mono text-xs text-gray-500 dark:text-gray-400"
                              title={subgraph.graph_id}
                            >
                              {subgraph.subgraph_name}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge color="purple" size="sm">
                          {subgraph.subgraph_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          color={
                            subgraph.status === 'active' ? 'success' : 'gray'
                          }
                          size="sm"
                        >
                          {subgraph.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-500 dark:text-gray-400">
                        <span className="text-xs">
                          {formatSize(subgraph.size_mb)}
                        </span>
                      </TableCell>
                      <TableCell className="text-gray-500 dark:text-gray-400">
                        {formatDate(subgraph.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            color="gray"
                            onClick={() => handleBackupClick(subgraph)}
                            disabled={backingUpId === subgraph.graph_id}
                            className="px-3 transition-all hover:scale-110"
                          >
                            {backingUpId === subgraph.graph_id ? (
                              <Spinner size="sm" />
                            ) : (
                              <HiDatabase className="h-5 w-5" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            color="failure"
                            onClick={() => handleDeleteClick(subgraph)}
                            className="px-3 transition-all hover:scale-110"
                          >
                            <HiTrash className="h-5 w-5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* Mobile Card View */}
          <div className="space-y-4 md:hidden">
            {subgraphs.map((subgraph) => (
              <Card
                key={subgraph.graph_id}
                theme={customTheme.card}
                className="p-4"
              >
                <div className="space-y-3">
                  {/* Header with name */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900">
                        <HiChip className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {subgraph.display_name}
                        </h3>
                        <p className="mt-1 font-mono text-xs text-gray-500 dark:text-gray-400">
                          {subgraph.subgraph_name}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Type and Status */}
                  <div className="flex flex-wrap gap-1.5">
                    <Badge color="purple" size="sm">
                      {subgraph.subgraph_type}
                    </Badge>
                    <Badge
                      color={subgraph.status === 'active' ? 'success' : 'gray'}
                      size="sm"
                    >
                      {subgraph.status}
                    </Badge>
                  </div>

                  {/* Details */}
                  <div className="space-y-2">
                    <div className="rounded-lg bg-gray-50 p-2 dark:bg-zinc-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Size
                      </p>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {formatSize(subgraph.size_mb)}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Created {formatDate(subgraph.created_at)}
                    </p>
                    {subgraph.last_accessed && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Last accessed {formatDate(subgraph.last_accessed)}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      size="sm"
                      color="gray"
                      onClick={() => handleBackupClick(subgraph)}
                      disabled={backingUpId === subgraph.graph_id}
                      className="px-4 transition-all hover:scale-110"
                    >
                      {backingUpId === subgraph.graph_id ? (
                        <Spinner size="sm" />
                      ) : (
                        <HiDatabase className="h-5 w-5" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      color="failure"
                      onClick={() => handleDeleteClick(subgraph)}
                      className="px-4 transition-all hover:scale-110"
                    >
                      <HiTrash className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <Card theme={customTheme.card}>
          <div className="py-12 text-center">
            <HiChip className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              No subgraphs found
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Get started by creating your first subgraph.
            </p>
          </div>
        </Card>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        show={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        size="md"
        theme={{
          content: {
            base: 'relative h-full w-full p-4 md:h-auto',
            inner: 'relative rounded-lg bg-white shadow dark:bg-gray-800',
          },
        }}
      >
        <ModalHeader className="border-b border-gray-200 dark:border-gray-700">
          <span className="text-gray-900 dark:text-white">Delete Subgraph</span>
        </ModalHeader>
        <ModalBody className="bg-white dark:bg-gray-800">
          <div className="space-y-4">
            <div className="rounded-lg border-2 border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-900/20">
              <div className="flex items-start gap-3">
                <HiExclamationCircle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
                <div>
                  <p className="font-semibold text-red-800 dark:text-red-300">
                    This action is permanent
                  </p>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Are you sure you want to delete the subgraph{' '}
              <strong className="text-gray-900 dark:text-white">
                {subgraphToDelete?.display_name}
              </strong>
              ?
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              All data in this subgraph will be permanently deleted.
            </p>
          </div>
        </ModalBody>
        <ModalFooter className="border-t border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex w-full justify-end gap-3">
            <Button
              color="gray"
              onClick={() => setDeleteModalOpen(false)}
              className="bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 text-white hover:bg-red-700 focus:ring-4 focus:ring-red-300 disabled:opacity-50 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-900"
            >
              {isDeleting ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Deleting...
                </>
              ) : (
                <>
                  <HiTrash className="mr-2 h-5 w-5" />
                  Delete Subgraph
                </>
              )}
            </Button>
          </div>
        </ModalFooter>
      </Modal>
    </div>
  )
}
