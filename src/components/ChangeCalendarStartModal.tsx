'use client'

import { formatPeriod } from '@/components/FiscalCalendarSetupModal'
import { friendlyError } from '@/lib/ledger/errors'
import { clients } from '@robosystems/core'
import {
  Alert,
  Button,
  HelperText,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Spinner,
  TextInput,
} from 'flowbite-react'
import { type FC, type FormEvent, useEffect, useState } from 'react'

interface ChangeCalendarStartModalProps {
  graphId: string
  /** A subsidiary's id, or null for the group parent. */
  entityId: string | null
  entityName: string
  open: boolean
  onClose: () => void
  onChanged: () => void
}

/**
 * Move a calendar's first open month. Only until the entity's first close:
 * earlier opens months back to it, so history dated before the old start has
 * a month to post into; later removes the leading months, refused while they
 * hold any entry.
 */
const ChangeCalendarStartModal: FC<ChangeCalendarStartModalProps> = ({
  graphId,
  entityId,
  entityName,
  open,
  onClose,
  onChanged,
}) => {
  const [firstOpen, setFirstOpen] = useState<string | null>(null)
  const [month, setMonth] = useState('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setError(null)
    setDone(null)
    void (async () => {
      try {
        const calendar = await clients.ledger.getFiscalCalendar(graphId, {
          entityId,
        })
        if (cancelled) return
        const names = (calendar?.periods ?? []).map((p) => p.name).sort()
        setFirstOpen(names[0] ?? null)
        setMonth(names[0] ?? '')
      } catch (err) {
        if (!cancelled)
          setError(
            friendlyError(
              err instanceof Error ? err.message : 'The calendar did not load.'
            ).message
          )
      }
    })()
    return () => {
      cancelled = true
    }
  }, [graphId, entityId, open])

  const ready = /^\d{4}-\d{2}$/.test(month) && month !== firstOpen

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!ready) return
    try {
      setSubmitting(true)
      setError(null)
      const result = await clients.ledger.changeCalendarStart(graphId, month, {
        entityId,
        note: note.trim() || null,
      })
      setFirstOpen(month)
      setDone(
        result.periodsCreated > 0
          ? `The calendar now opens at ${formatPeriod(month)}: ${result.periodsCreated} earlier ${result.periodsCreated === 1 ? 'month' : 'months'} added.`
          : `The calendar now opens at ${formatPeriod(month)}: ${result.periodsRemoved} leading ${result.periodsRemoved === 1 ? 'month' : 'months'} removed.`
      )
      onChanged()
    } catch (err) {
      setError(
        friendlyError(
          err instanceof Error ? err.message : 'The start did not move.'
        ).message
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal show={open} onClose={onClose} size="md">
      <form onSubmit={handleSubmit}>
        <ModalHeader>
          Change where {entityName}&apos;s calendar starts
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {firstOpen
                ? `It opens at ${formatPeriod(firstOpen)}. `
                : 'Reading the calendar… '}
              Move it earlier when history before that month needs a period to
              post into. This is possible only until the first close.
            </p>
            <div>
              <Label htmlFor="calendar-first-open">First open month</Label>
              <TextInput
                id="calendar-first-open"
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              />
              <HelperText>
                Moving it later is refused while the months it would remove hold
                any entry.
              </HelperText>
            </div>
            <div>
              <Label htmlFor="calendar-start-note">Note (optional)</Label>
              <TextInput
                id="calendar-start-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
            {error && <Alert color="failure">{error}</Alert>}
            {done && <Alert color="success">{done}</Alert>}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button type="submit" color="primary" disabled={!ready || submitting}>
            {submitting && <Spinner size="sm" className="mr-2 text-white" />}
            Move the start
          </Button>
          <Button color="light" onClick={onClose}>
            {done ? 'Done' : 'Cancel'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}

export default ChangeCalendarStartModal
