'use client'

import {
  addMonths,
  currentPeriod,
  formatPeriod,
} from '@/components/FiscalCalendarSetupModal'
import { friendlyError } from '@/lib/ledger/errors'
import type { LedgerFiscalCalendar } from '@robosystems/client/clients'
import { clients } from '@robosystems/core'
import {
  Alert,
  Button,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  TextInput,
} from '@robosystems/core/ui'
import { type FC, type FormEvent, useEffect, useState } from 'react'

interface SetCloseTargetModalProps {
  graphId: string
  /** A subsidiary's id, or null for the group parent. */
  entityId: string | null
  calendar: LedgerFiscalCalendar
  open: boolean
  onClose: () => void
  onSet: (calendar: LedgerFiscalCalendar) => void
}

/**
 * The month the close is working toward. Setting it closes nothing: it is
 * how far the catch-up sequence runs, and a close that reaches it moves it
 * on. A completed month, at or after the last one closed.
 */
const SetCloseTargetModal: FC<SetCloseTargetModalProps> = ({
  graphId,
  entityId,
  calendar,
  open,
  onClose,
  onSet,
}) => {
  const latest = addMonths(currentPeriod(), -1)
  const earliest = calendar.closedThrough ?? null
  const [period, setPeriod] = useState(calendar.closeTarget ?? latest)
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setPeriod(calendar.closeTarget ?? latest)
    setNote('')
    setError(null)
    setSubmitting(false)
  }, [open, calendar.closeTarget, latest])

  const invalid =
    !/^\d{4}-(0[1-9]|1[0-2])$/.test(period) ||
    period > latest ||
    (earliest !== null && period < earliest)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (invalid || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      const updated = await clients.ledger.setCloseTarget(
        graphId,
        period,
        note.trim() || null,
        { entityId }
      )
      onSet(updated)
    } catch (err) {
      setError(
        friendlyError(
          err instanceof Error ? err.message : 'Failed to set the close target.'
        ).message
      )
      setSubmitting(false)
    }
  }

  return (
    <Modal show={open} onClose={() => !submitting && onClose()} size="md">
      <ModalHeader>Close target</ModalHeader>
      <form onSubmit={handleSubmit}>
        <ModalBody>
          <div className="space-y-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              The month you are working toward. Setting it closes nothing: the
              months up to it are the ones the close lists, in order, and a
              close that reaches it moves it on.
            </p>
            {error && <Alert color="failure">{error}</Alert>}
            <div>
              <Label htmlFor="close-target-month" className="mb-1 block">
                Close through
              </Label>
              <TextInput
                id="close-target-month"
                type="month"
                sizing="sm"
                className="max-w-48"
                value={period}
                min={earliest ?? undefined}
                max={latest}
                disabled={submitting}
                onChange={(e) => setPeriod(e.target.value)}
              />
              {invalid && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                  {earliest
                    ? `Pick a month from ${formatPeriod(earliest)} to ${formatPeriod(latest)}.`
                    : `Pick ${formatPeriod(latest)} or earlier.`}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="close-target-note" className="mb-1 block">
                Note (optional)
              </Label>
              <TextInput
                id="close-target-note"
                sizing="sm"
                value={note}
                disabled={submitting}
                placeholder="Q3 close for the board pack"
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button type="submit" color="blue" disabled={invalid || submitting}>
            {submitting ? 'Saving…' : 'Set close target'}
          </Button>
          <Button color="light" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}

export default SetCloseTargetModal
