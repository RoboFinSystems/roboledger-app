'use client'

import { clients, LoadingState } from '@robosystems/core'
import {
  Alert,
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from 'flowbite-react'
import type { FC } from 'react'
import { useCallback, useEffect, useState } from 'react'
import { HiExclamationCircle, HiTrash } from 'react-icons/hi'
import BlockView from './blockview/BlockView'
import type { EnvelopeBlock } from './blockview/types'
import type { ViewMode } from './ViewModeToggle'

interface SchedulePanelProps {
  graphId: string
  structureId: string
  viewMode: ViewMode
  onDeleted?: () => void
}

/**
 * Thin orchestration shell around the schedule envelope. Owns the
 * envelope fetch and delegates all rendering to `BlockView`, which
 * dispatches to the schedule `Rendering` projection (or the uniform
 * `FactTable` projection in facts mode). Closing entries are created on
 * the period-close page (Current Period Status), not the schedule view.
 * The one write this panel owns is delete — the undo for a schedule
 * that was just created wrong (voids pending obligations server-side).
 */
const SchedulePanel: FC<SchedulePanelProps> = ({
  graphId,
  structureId,
  viewMode,
  onDeleted,
}) => {
  const [envelope, setEnvelope] = useState<EnvelopeBlock | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const loadEnvelope = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const block = await clients.ledger.getInformationBlock(
        graphId,
        structureId
      )
      setEnvelope(block ?? null)
    } catch (err) {
      console.error('Error loading schedule envelope:', err)
      setError('Failed to load schedule facts.')
    } finally {
      setIsLoading(false)
    }
  }, [graphId, structureId])

  useEffect(() => {
    loadEnvelope()
  }, [loadEnvelope])

  const handleDelete = useCallback(async () => {
    setDeleting(true)
    setDeleteError(null)
    try {
      await clients.ledger.deleteSchedule(graphId, structureId)
      setConfirmDeleteOpen(false)
      onDeleted?.()
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Failed to delete schedule.'
      setDeleteError(msg)
    } finally {
      setDeleting(false)
    }
  }, [graphId, structureId, onDeleted])

  if (isLoading) {
    return <LoadingState />
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 py-8 text-red-500">
        <HiExclamationCircle className="h-5 w-5" />
        <span>{error}</span>
      </div>
    )
  }

  if (!envelope) {
    return (
      <div className="py-12 text-center text-gray-500 dark:text-gray-400">
        No facts found for this schedule.
      </div>
    )
  }

  // Read-only rollforward. Closing entries are created on the period-close
  // page (Current Period Status), which is sequence-aware and guards against
  // already-closed / not-yet-due periods — the schedule view has no such
  // guard (every one of its periods rendered an Entry button, 422-ing on
  // closed months), so entry creation is funneled there.
  return (
    <div>
      {onDeleted && (
        <div className="mb-2 flex justify-end">
          <Button
            size="xs"
            color="light"
            onClick={() => setConfirmDeleteOpen(true)}
            title="Delete this schedule and void its pending entries"
          >
            <HiTrash className="mr-1 h-3 w-3" />
            Delete schedule
          </Button>
        </div>
      )}

      <BlockView envelope={envelope} viewMode={viewMode} />

      <Modal
        show={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        size="md"
      >
        <ModalHeader>Delete schedule</ModalHeader>
        <ModalBody>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Delete <span className="font-semibold">{envelope.name}</span>?
            Pending future entries are voided; entries already posted in closed
            periods are not affected.
          </p>
          {deleteError && (
            <Alert color="failure" className="mt-3">
              {deleteError}
            </Alert>
          )}
        </ModalBody>
        <ModalFooter>
          <Button
            color="gray"
            onClick={() => setConfirmDeleteOpen(false)}
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button color="failure" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Deleting…' : 'Delete'}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}

export default SchedulePanel
