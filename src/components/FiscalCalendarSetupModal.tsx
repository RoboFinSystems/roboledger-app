'use client'

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
  Radio,
  Select,
  TextInput,
} from 'flowbite-react'
import { type FC, type FormEvent, useEffect, useState } from 'react'

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

/** `YYYY-MM` shifted by `delta` months. */
export function addMonths(period: string, delta: number): string {
  const [year, month] = period.split('-').map(Number)
  const index = year * 12 + (month - 1) + delta
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, '0')}`
}

export function currentPeriod(today: Date = new Date()): string {
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
}

/** Months from `from` through `to`, inclusive; 0 when `from` is later. */
export function monthsBetween(from: string, to: string): number {
  const [fy, fm] = from.split('-').map(Number)
  const [ty, tm] = to.split('-').map(Number)
  return Math.max(0, ty * 12 + tm - (fy * 12 + fm) + 1)
}

export function formatPeriod(period: string): string {
  const [year, month] = period.split('-').map(Number)
  return `${MONTHS[month - 1]} ${year}`
}

type StartMode = 'first_open' | 'closed_through'

interface FiscalCalendarSetupModalProps {
  graphId: string
  /** A subsidiary's id, or null for the group parent. */
  entityId: string | null
  entityName: string
  open: boolean
  onClose: () => void
  onInitialized: (calendar: LedgerFiscalCalendar) => void
}

/**
 * One-time setup of a company's fiscal calendar. The choice that matters is
 * where its books start, and it cannot be changed afterwards, so the dialog
 * asks for it outright and shows what the first close will be.
 */
const FiscalCalendarSetupModal: FC<FiscalCalendarSetupModalProps> = ({
  graphId,
  entityId,
  entityName,
  open,
  onClose,
  onInitialized,
}) => {
  const current = currentPeriod()
  const lastCompleted = addMonths(current, -1)

  const [mode, setMode] = useState<StartMode>('first_open')
  const [firstOpen, setFirstOpen] = useState(lastCompleted)
  const [closedThrough, setClosedThrough] = useState(addMonths(current, -2))
  const [fyStart, setFyStart] = useState(1)
  // A subsidiary takes the group's fiscal year: the parent's, once it has one.
  const [groupFyStart, setGroupFyStart] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setMode('first_open')
    setFirstOpen(lastCompleted)
    setClosedThrough(addMonths(current, -2))
    setFyStart(1)
    setGroupFyStart(null)
    setError(null)
    setSubmitting(false)
    if (!entityId) return
    let cancelled = false
    clients.ledger
      .getFiscalCalendar(graphId)
      .then((parent) => {
        if (cancelled || !parent) return
        setGroupFyStart(parent.fiscalYearStartMonth)
        setFyStart(parent.fiscalYearStartMonth)
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [open, current, lastCompleted, graphId, entityId])

  const month = mode === 'first_open' ? firstOpen : closedThrough
  const maxMonth = mode === 'first_open' ? current : lastCompleted
  const monthInvalid =
    !/^\d{4}-(0[1-9]|1[0-2])$/.test(month) || month > maxMonth
  const firstClose =
    mode === 'first_open' ? firstOpen : addMonths(closedThrough, 1)
  // Every month before last month has to close before last month can.
  const backlog = monthInvalid ? 0 : monthsBetween(firstClose, lastCompleted)
  const canSubmit = !monthInvalid && !submitting

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      const result = await clients.ledger.initializeLedger(graphId, {
        entityId,
        fiscalYearStartMonth: fyStart,
        ...(mode === 'first_open'
          ? { earliestDataPeriod: firstOpen }
          : { closedThrough }),
      })
      onInitialized(result.fiscalCalendar)
    } catch (err) {
      setError(
        friendlyError(
          err instanceof Error ? err.message : 'Failed to set up the calendar.'
        ).message
      )
      setSubmitting(false)
    }
  }

  return (
    <Modal show={open} onClose={onClose} size="lg">
      <ModalHeader>Set up the fiscal calendar</ModalHeader>
      <form onSubmit={handleSubmit}>
        <ModalBody>
          <div className="space-y-5">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Where do <span className="font-medium">{entityName}</span>
              &apos;s books start in RoboLedger? Months close in order from
              there. This is set once and can&apos;t be moved later.
            </p>

            {error && <Alert color="failure">{error}</Alert>}

            <fieldset className="space-y-3">
              <legend className="sr-only">Where the books start</legend>
              <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                <div className="flex items-start gap-3">
                  <Radio
                    id="calendar-mode-first-open"
                    name="calendar-mode"
                    checked={mode === 'first_open'}
                    onChange={() => setMode('first_open')}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <Label htmlFor="calendar-mode-first-open">
                      New books, or moving over at a month-end
                    </Label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      The first month these books close. Opening balances go in
                      this month, so it starts open.
                    </p>
                    {mode === 'first_open' && (
                      <TextInput
                        id="calendar-first-open"
                        aria-label="First month to close"
                        type="month"
                        sizing="sm"
                        className="mt-2 max-w-48"
                        value={firstOpen}
                        max={current}
                        onChange={(e) => setFirstOpen(e.target.value)}
                      />
                    )}
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                <div className="flex items-start gap-3">
                  <Radio
                    id="calendar-mode-closed-through"
                    name="calendar-mode"
                    checked={mode === 'closed_through'}
                    onChange={() => setMode('closed_through')}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <Label htmlFor="calendar-mode-closed-through">
                      History already closed in another system
                    </Label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      The last month closed there. It and every month before it
                      are locked; the first close is the month after.
                    </p>
                    {mode === 'closed_through' && (
                      <TextInput
                        id="calendar-closed-through"
                        aria-label="Last month closed elsewhere"
                        type="month"
                        sizing="sm"
                        className="mt-2 max-w-48"
                        value={closedThrough}
                        max={lastCompleted}
                        onChange={(e) => setClosedThrough(e.target.value)}
                      />
                    )}
                  </div>
                </div>
              </div>
            </fieldset>

            <div>
              <Label htmlFor="calendar-fy-start" className="mb-1 block">
                Fiscal year starts in
              </Label>
              <Select
                id="calendar-fy-start"
                sizing="sm"
                className="max-w-48"
                value={fyStart}
                disabled={groupFyStart != null}
                onChange={(e) => setFyStart(Number(e.target.value))}
              >
                {MONTHS.map((name, i) => (
                  <option key={name} value={i + 1}>
                    {name}
                  </option>
                ))}
              </Select>
              {groupFyStart != null && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Every company in the group shares the group&apos;s fiscal
                  year.
                </p>
              )}
            </div>

            <div
              className="rounded-lg bg-gray-50 p-3 text-sm dark:bg-gray-800"
              data-testid="calendar-setup-preview"
            >
              {monthInvalid ? (
                <span className="text-red-600 dark:text-red-400">
                  {mode === 'first_open'
                    ? `Pick ${formatPeriod(current)} or earlier.`
                    : `Pick ${formatPeriod(lastCompleted)} or earlier.`}
                </span>
              ) : (
                <>
                  <p className="text-gray-900 dark:text-white">
                    First close:{' '}
                    <span className="font-semibold">
                      {formatPeriod(firstClose)}
                    </span>
                  </p>
                  {backlog > 1 && (
                    <p className="mt-1 text-amber-700 dark:text-amber-400">
                      {backlog} months have to close, in order, to catch up to{' '}
                      {formatPeriod(lastCompleted)}.
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button type="submit" color="blue" disabled={!canSubmit}>
            {submitting ? 'Setting up…' : 'Set up calendar'}
          </Button>
          <Button color="light" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}

export default FiscalCalendarSetupModal
