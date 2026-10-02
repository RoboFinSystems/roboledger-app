'use client'

import { extractDetail } from '@/lib/ledger/errors'
import {
  formatDate,
  formatDateTime,
  formatDollars,
} from '@/lib/ledger/formatters'
import type {
  LedgerReconciliation,
  LedgerReconciliationList,
} from '@robosystems/client/clients'
import { clients, LoadingState } from '@robosystems/core'
import {
  Badge,
  Button,
  Select,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from 'flowbite-react'
import type { FC } from 'react'
import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import { HiExclamationCircle, HiPlus, HiRefresh } from 'react-icons/hi'
import RecordStatementModal from './RecordStatementModal'

/** The API's own words for a refusal, or a fallback when there are none. */
const describeError = (err: unknown, fallback: string): string =>
  err instanceof Error ? extractDetail(err.message) : fallback

// ── Constants ──────────────────────────────────────────────────────────

const STATUS_BADGES: Record<string, { label: string; color: string }> = {
  not_started: { label: 'Not run', color: 'gray' },
  unreconciled: { label: 'Does not tie', color: 'failure' },
  // The books changed after it was compared; running them again clears it.
  stale: { label: 'Out of date', color: 'warning' },
  reconciled: { label: 'Reconciled', color: 'success' },
  reviewed: { label: 'Reviewed', color: 'info' },
}

const METHOD_LABELS: Record<string, string> = {
  source_ledger: 'Against the synced books',
  schedule_register: 'Against its schedules',
  statement: 'Against its statement',
}

// ── Helpers ────────────────────────────────────────────────────────────

function formatPeriod(period: string): string {
  const [yearStr, monthStr] = period.split('-')
  const date = new Date(Number(yearStr), Number(monthStr) - 1, 1)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
}

function currentPeriod(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function money(value: number | null): string {
  return value === null ? '—' : formatDollars(value)
}

// ── Component ──────────────────────────────────────────────────────────

interface ReconciliationsPanelProps {
  graphId: string
}

/**
 * The period's reconciliation worklist: each check that ties the ledger to
 * something outside it, where it stands, and the actions on it.
 */
const ReconciliationsPanel: FC<ReconciliationsPanelProps> = ({ graphId }) => {
  const [periods, setPeriods] = useState<string[]>([])
  const [period, setPeriod] = useState<string | null>(null)
  const [list, setList] = useState<LedgerReconciliationList | null>(null)
  const [notes, setNotes] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRunning, setIsRunning] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [statementOpen, setStatementOpen] = useState(false)

  // Sequence guard: drops a response once a newer load has started.
  const loadSeq = useRef(0)

  // The fiscal calendar gives the periods to choose from, and the default:
  // the next period to close is the one whose reconciliations matter now.
  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const calendar = await clients.ledger.getFiscalCalendar(graphId)
        if (cancelled) return
        const names = (calendar?.periods ?? []).map((p) => p.name)
        const start =
          calendar?.catchUpSequence[0] ??
          calendar?.closedThrough ??
          currentPeriod()
        setPeriods(names.includes(start) ? names : [...names, start])
        setPeriod(start)
      } catch {
        if (cancelled) return
        setPeriods([currentPeriod()])
        setPeriod(currentPeriod())
      }
    })()
    return () => {
      cancelled = true
    }
  }, [graphId])

  const load = useCallback(async () => {
    if (!period) return
    const seq = ++loadSeq.current
    try {
      setIsLoading(true)
      setError(null)
      const result = await clients.ledger.listReconciliations(graphId, period)
      if (seq !== loadSeq.current) return
      setList(result)
    } catch (err) {
      if (seq !== loadSeq.current) return
      setError(describeError(err, 'Failed to load reconciliations.'))
    } finally {
      if (seq === loadSeq.current) setIsLoading(false)
    }
  }, [graphId, period])

  useEffect(() => {
    setNotes([])
    load()
  }, [load])

  const handleRun = useCallback(async () => {
    if (!period) return
    // The same ticket a load takes: a run that finishes after the period
    // changed must not put its results under the new period.
    const seq = ++loadSeq.current
    try {
      setIsRunning(true)
      setError(null)
      const result = await clients.ledger.refreshReconciliations(
        graphId,
        period
      )
      if (seq !== loadSeq.current) return
      setList(result)
      setNotes(result.notes)
    } catch (err) {
      if (seq !== loadSeq.current) return
      setError(describeError(err, 'Reconciliations could not be run.'))
    } finally {
      setIsRunning(false)
    }
  }, [graphId, period])

  const handleSignOff = useCallback(
    async (rec: LedgerReconciliation) => {
      if (!period) return
      try {
        setBusyId(rec.structureId)
        setError(null)
        // The row's own period: the sign-off is for what the row shows.
        await clients.ledger.signOffReconciliation(
          graphId,
          rec.structureId,
          rec.period
        )
        await load()
      } catch (err) {
        setError(describeError(err, 'The sign-off was not recorded.'))
      } finally {
        setBusyId(null)
      }
    },
    [graphId, period, load]
  )

  const handleToggleRequired = useCallback(
    async (rec: LedgerReconciliation) => {
      try {
        setBusyId(rec.structureId)
        setError(null)
        await clients.ledger.setReconciliationPolicy(graphId, rec.structureId, {
          requiredForClose: !rec.requiredForClose,
        })
        await load()
      } catch (err) {
        setError(describeError(err, 'The policy was not changed.'))
      } finally {
        setBusyId(null)
      }
    },
    [graphId, load]
  )

  // A statement lands in the period it ends in, which may not be the one
  // on screen.
  const handleStatementRecorded = useCallback(
    (rec: LedgerReconciliation) => {
      setStatementOpen(false)
      if (rec.period === period) {
        load()
      } else {
        setPeriods((current) =>
          current.includes(rec.period) ? current : [...current, rec.period]
        )
        setPeriod(rec.period)
      }
    },
    [period, load]
  )

  // Only rows for the period on screen: while another period loads, the
  // last one's rows are not shown under its name.
  const shown = list && list.period === period ? list : null
  const reconciliations = shown?.reconciliations ?? []

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Reconciliations
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Each check ties the ledger to something outside it at the period
            end.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            id="reconciliation-period"
            sizing="sm"
            value={period ?? ''}
            onChange={(e) => setPeriod(e.target.value)}
          >
            {periods.map((p) => (
              <option key={p} value={p}>
                {formatPeriod(p)}
              </option>
            ))}
          </Select>
          <Button
            size="sm"
            color="light"
            onClick={() => setStatementOpen(true)}
          >
            <HiPlus className="mr-1 h-4 w-4" />
            Record statement
          </Button>
          <Button
            size="sm"
            color="primary"
            disabled={isRunning || !period}
            onClick={handleRun}
          >
            {isRunning ? (
              <Spinner size="sm" className="mr-2 text-white" />
            ) : (
              <HiRefresh className="mr-1 h-4 w-4" />
            )}
            Run reconciliations
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/30 dark:text-red-300">
          <HiExclamationCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {notes.map((note) => (
        <div
          key={note}
          className="rounded-lg border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-800 dark:border-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-200"
        >
          {note}
        </div>
      ))}

      {isLoading && !shown ? (
        <LoadingState size="lg" className="py-16" />
      ) : reconciliations.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500 dark:border-gray-600 dark:text-gray-400">
          <p className="font-medium text-gray-700 dark:text-gray-200">
            Nothing has been reconciled yet.
          </p>
          <p className="mx-auto mt-2 max-w-xl">
            Running reconciliations compares the ledger with the books it was
            synced from, and each asset account a schedule carries a balance on
            with its schedules. A check that ties starts holding the
            period&apos;s close until you release it. Record a statement to
            reconcile a bank account, a card or a loan.
          </p>
        </div>
      ) : (
        <Table>
          <TableHead>
            <tr>
              <TableHeadCell>Reconciliation</TableHeadCell>
              <TableHeadCell>Status</TableHeadCell>
              <TableHeadCell>Ledger</TableHeadCell>
              <TableHeadCell>Outside the ledger</TableHeadCell>
              <TableHeadCell>Difference</TableHeadCell>
              <TableHeadCell>Holds the close</TableHeadCell>
              <TableHeadCell>Review</TableHeadCell>
            </tr>
          </TableHead>
          <TableBody>
            {reconciliations.map((rec) => {
              const badge = STATUS_BADGES[rec.status] ?? {
                label: rec.status,
                color: 'gray',
              }
              const busy = busyId === rec.structureId
              const isOpen = expanded === rec.structureId
              return (
                <Fragment key={rec.structureId}>
                  <TableRow>
                    <TableCell>
                      <button
                        type="button"
                        className="text-left font-medium text-gray-900 hover:underline dark:text-white"
                        onClick={() =>
                          setExpanded(isOpen ? null : rec.structureId)
                        }
                      >
                        {rec.name}
                      </button>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {METHOD_LABELS[rec.method] ?? rec.method}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge color={badge.color}>{badge.label}</Badge>
                    </TableCell>
                    <TableCell>{money(rec.ledgerBalance)}</TableCell>
                    <TableCell>{money(rec.independentBalance)}</TableCell>
                    <TableCell>{money(rec.unreconciledDifference)}</TableCell>
                    <TableCell>
                      <input
                        type="checkbox"
                        aria-label={`${rec.name} holds the close`}
                        checked={rec.requiredForClose}
                        disabled={busy}
                        onChange={() => handleToggleRequired(rec)}
                        className="rounded border-gray-300"
                      />
                    </TableCell>
                    <TableCell>
                      {rec.status === 'reviewed' ? (
                        <span className="text-xs text-gray-600 dark:text-gray-300">
                          Signed off {formatDateTime(rec.reviewedAt)}
                          {rec.selfReviewed && ' by the person who ran it'}
                        </span>
                      ) : rec.status === 'reconciled' ? (
                        <Button
                          size="xs"
                          color="light"
                          disabled={busy}
                          onClick={() => handleSignOff(rec)}
                        >
                          Sign off
                        </Button>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                  {isOpen && (
                    <TableRow>
                      <TableCell colSpan={7}>
                        <ReconciliationDetail rec={rec} />
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              )
            })}
          </TableBody>
        </Table>
      )}

      <RecordStatementModal
        graphId={graphId}
        open={statementOpen}
        onClose={() => setStatementOpen(false)}
        onRecorded={handleStatementRecorded}
      />
    </div>
  )
}

/** What a reconciliation compared: its parts, and the accounts that differ. */
const ReconciliationDetail: FC<{ rec: LedgerReconciliation }> = ({ rec }) => (
  <div className="space-y-3 text-sm text-gray-700 dark:text-gray-200">
    {rec.status === 'not_started' ? (
      <p>This period has not been compared yet.</p>
    ) : (
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Compared {formatDateTime(rec.comparedAt)}
        {rec.comparedVia === 'sync' && ' by a sync'}
        {rec.balanceAsOf && rec.balanceAsOf !== rec.asOf && (
          <> · balances as of {formatDate(rec.balanceAsOf)}</>
        )}
        {rec.accountsCompared !== null && (
          <>
            {' '}
            · {rec.accountsCompared} accounts compared,{' '}
            {rec.accountsDifferent ?? 0} do not tie
          </>
        )}
      </p>
    )}

    {rec.components.length > 0 && (
      <ul className="space-y-1">
        {rec.components.map((component) => (
          <li
            key={`${component.structureId ?? component.eventId ?? component.name}`}
            className="flex justify-between gap-4"
          >
            <span>
              {component.name}
              {component.note && (
                <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                  {component.note}
                </span>
              )}
            </span>
            <span className="tabular-nums">
              {formatDollars(component.amount)}
            </span>
          </li>
        ))}
      </ul>
    )}

    {rec.differences.length > 0 && rec.scope === 'ledger' && (
      <Table>
        <TableHead>
          <tr>
            <TableHeadCell>Account</TableHeadCell>
            <TableHeadCell>Ledger</TableHeadCell>
            <TableHeadCell>Source</TableHeadCell>
            <TableHeadCell>Difference</TableHeadCell>
          </tr>
        </TableHead>
        <TableBody>
          {rec.differences.map((row) => (
            <TableRow key={`${row.elementId ?? row.sourceAccountId}`}>
              <TableCell>{row.accountName}</TableCell>
              <TableCell>{formatDollars(row.ledgerBalance)}</TableCell>
              <TableCell>{formatDollars(row.independentBalance)}</TableCell>
              <TableCell>{formatDollars(row.difference)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )}
  </div>
)

export default ReconciliationsPanel
