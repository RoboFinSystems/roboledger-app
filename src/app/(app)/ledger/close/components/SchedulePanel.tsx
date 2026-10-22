'use client'

import { formatPeriod } from '@/components/FiscalCalendarSetupModal'
import { friendlyError } from '@/lib/ledger/errors'
import {
  monthEnd,
  readScheduleMechanics,
  scheduleFactsFallback,
  terminateSchedule,
} from '@/lib/ledger/schedules'
import { clients, LoadingState } from '@robosystems/core'
import {
  Alert,
  Button,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Select,
  Textarea,
} from 'flowbite-react'
import type { FC } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { HiExclamationCircle, HiPencil, HiStop, HiTrash } from 'react-icons/hi'
import BlockView from './blockview/BlockView'
import type { EnvelopeBlock } from './blockview/types'
import { ScheduleModal, type EditingSchedule } from './ScheduleModal'
import type { ViewMode } from './ViewModeToggle'

interface SchedulePanelProps {
  graphId: string
  structureId: string
  viewMode: ViewMode
  onDeleted?: () => void
  /** The schedule was edited in place (its name may have changed). */
  onChanged?: () => void
}

/** The `YYYY-MM` months a schedule's facts cover, oldest first. */
export function scheduleMonths(envelope: EnvelopeBlock): string[] {
  const months = new Set<string>()
  for (const fact of envelope.facts) {
    if (fact.periodEnd) months.add(fact.periodEnd.slice(0, 7))
  }
  return [...months].sort()
}

/**
 * Thin orchestration shell around the schedule envelope. Owns the
 * envelope fetch and delegates all rendering to `BlockView`, which
 * dispatches to the schedule `Rendering` projection (or the uniform
 * `FactTable` projection in facts mode). Closing entries are created on
 * the period-close page (Current Period Status), not the schedule view.
 * The panel's writes are edit — the definition loaded back into the form
 * and saved through a rebuild while nothing has posted — delete, the undo
 * for a schedule that was just created wrong, and end, which stops a
 * schedule early at a month-end without booking anything (a prepaid
 * refunded, an asset transferred by an entry already posted).
 */
const SchedulePanel: FC<SchedulePanelProps> = ({
  graphId,
  structureId,
  viewMode,
  onDeleted,
  onChanged,
}) => {
  const [envelope, setEnvelope] = useState<EnvelopeBlock | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [endOpen, setEndOpen] = useState(false)
  const [endMonth, setEndMonth] = useState('')
  const [endReason, setEndReason] = useState('')
  const [ending, setEnding] = useState(false)
  const [endError, setEndError] = useState<string | null>(null)

  // Sequence guard: drops a response once a newer load has started, so switching
  // schedules mid-fetch can't render the previous structure's facts.
  const loadSeq = useRef(0)

  const loadEnvelope = useCallback(async () => {
    const seq = ++loadSeq.current
    try {
      setIsLoading(true)
      setError(null)
      const block = await clients.ledger.getInformationBlock(
        graphId,
        structureId
      )
      if (seq !== loadSeq.current) return
      setEnvelope(block ?? null)
    } catch (err) {
      if (seq !== loadSeq.current) return
      console.error('Error loading schedule envelope:', err)
      setError('Failed to load schedule facts.')
    } finally {
      if (seq === loadSeq.current) setIsLoading(false)
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

  // The definition the form loads back, when the envelope carries one.
  const editing = useMemo<EditingSchedule | null>(() => {
    if (!envelope) return null
    const mechanics = readScheduleMechanics(envelope)
    if (!mechanics) return null
    return {
      structureId,
      name: envelope.name,
      mechanics,
      fallback: scheduleFactsFallback(envelope),
    }
  }, [envelope, structureId])

  const handleSaved = useCallback(async () => {
    await loadEnvelope()
    onChanged?.()
  }, [loadEnvelope, onChanged])

  // A schedule ends after one of its months and before its last.
  const endChoices = useMemo(
    () => (envelope ? scheduleMonths(envelope).slice(0, -1) : []),
    [envelope]
  )

  const openEnd = () => {
    setEndMonth(endChoices[endChoices.length - 1] ?? '')
    setEndReason('')
    setEndError(null)
    setEndOpen(true)
  }

  const handleEnd = async () => {
    if (!endMonth || !endReason.trim()) return
    setEnding(true)
    setEndError(null)
    try {
      await terminateSchedule(
        graphId,
        structureId,
        monthEnd(endMonth),
        endReason.trim()
      )
      setEndOpen(false)
      await loadEnvelope()
    } catch (err) {
      setEndError(
        friendlyError(
          err instanceof Error ? err.message : 'Failed to end the schedule.'
        ).message
      )
    } finally {
      setEnding(false)
    }
  }

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
      {(editing || onDeleted || endChoices.length > 0) && (
        <div className="mb-2 flex justify-end gap-2">
          {editing && (
            <Button
              size="xs"
              color="light"
              onClick={() => setEditOpen(true)}
              title="Load the definition into the form; saved as a rebuild while nothing has posted"
            >
              <HiPencil className="mr-1 h-3 w-3" />
              Edit schedule
            </Button>
          )}
          {endChoices.length > 0 && (
            <Button
              size="xs"
              color="light"
              onClick={openEnd}
              title="End this schedule early, at a month-end"
            >
              <HiStop className="mr-1 h-3 w-3" />
              End schedule
            </Button>
          )}
          {onDeleted && (
            <Button
              size="xs"
              color="light"
              onClick={() => setConfirmDeleteOpen(true)}
              title="Delete this schedule and void its pending entries"
            >
              <HiTrash className="mr-1 h-3 w-3" />
              Delete schedule
            </Button>
          )}
        </div>
      )}

      <BlockView envelope={envelope} viewMode={viewMode} />

      {editing && (
        <ScheduleModal
          graphId={graphId}
          entityId={envelope.entityId ?? null}
          open={editOpen}
          onClose={() => setEditOpen(false)}
          onSaved={handleSaved}
          editing={editing}
        />
      )}

      <Modal show={endOpen} onClose={() => setEndOpen(false)} size="md">
        <ModalHeader>End schedule</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              End <span className="font-semibold">{envelope.name}</span> after
              the month you pick. Its later months lose their entries-to-be and
              nothing is booked: use this when the effect is already in the
              books (a prepaid refunded, an asset moved by an entry) or none is
              wanted. To book a disposal, record the asset&apos;s disposal
              instead. A month that has already posted cannot be undone here.
            </p>
            <div>
              <Label htmlFor="schedule-end-month" className="mb-1 block">
                Last month the schedule covers
              </Label>
              <Select
                id="schedule-end-month"
                sizing="sm"
                value={endMonth}
                disabled={ending}
                onChange={(e) => setEndMonth(e.target.value)}
              >
                {endChoices.map((month) => (
                  <option key={month} value={month}>
                    {formatPeriod(month)}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="schedule-end-reason" className="mb-1 block">
                Why it ends early
              </Label>
              <Textarea
                id="schedule-end-reason"
                rows={2}
                value={endReason}
                disabled={ending}
                placeholder="Lease terminated; deposit refunded"
                onChange={(e) => setEndReason(e.target.value)}
              />
            </div>
            {endError && <Alert color="failure">{endError}</Alert>}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            color="gray"
            onClick={() => setEndOpen(false)}
            disabled={ending}
          >
            Cancel
          </Button>
          <Button
            color="failure"
            onClick={handleEnd}
            disabled={ending || !endMonth || !endReason.trim()}
          >
            {ending ? 'Ending…' : 'End schedule'}
          </Button>
        </ModalFooter>
      </Modal>

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
