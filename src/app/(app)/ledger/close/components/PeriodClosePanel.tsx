'use client'

import { customTheme, extensions } from '@/lib/core'
import type {
  LedgerFiscalCalendar,
  LedgerPeriodCloseStatus,
  LedgerPeriodDrafts,
} from '@robosystems/client/extensions'
import {
  Badge,
  Button,
  Card,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Select,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
  Textarea,
} from 'flowbite-react'
import type { FC, ReactNode } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  HiCalendar,
  HiCheck,
  HiClock,
  HiExclamationCircle,
  HiLockClosed,
  HiLockOpen,
  HiPlay,
  HiRefresh,
} from 'react-icons/hi'
import { TbFileInvoice } from 'react-icons/tb'
import { formatCurrencyDollars } from '../utils'

const STATUS_COLORS: Record<string, string> = {
  posted: 'success',
  draft: 'warning',
  pending: 'gray',
  reversed: 'failure',
  open: 'info',
  closing: 'warning',
  closed: 'success',
}

const BLOCKER_MESSAGES: Record<string, string> = {
  sequence_violation:
    'Earlier periods must be closed first — close them in order.',
  period_incomplete:
    "Period hasn't ended yet — wait until the last day of the month to close.",
  sync_stale:
    'QuickBooks hasn\'t synced through this period — run a sync before closing (or use "Close with stale sync").',
  calendar_not_initialized: 'Fiscal calendar not initialized for this graph.',
  period_already_closed: 'This period is already closed.',
}

interface PeriodClosePanelProps {
  graphId: string
  onEntryCreated?: () => void
}

// Compute period bounds (YYYY-MM-DD) for a given YYYY-MM period name.
function periodBounds(period: string): { start: string; end: string } {
  const [yearStr, monthStr] = period.split('-')
  const year = Number(yearStr)
  const month = Number(monthStr)
  const lastDay = new Date(year, month, 0).getDate()
  return {
    start: `${yearStr}-${monthStr}-01`,
    end: `${yearStr}-${monthStr}-${String(lastDay).padStart(2, '0')}`,
  }
}

function formatPeriod(period: string | null): string {
  if (!period) return '—'
  const [yearStr, monthStr] = period.split('-')
  const date = new Date(Number(yearStr), Number(monthStr) - 1, 1)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
}

const PeriodClosePanel: FC<PeriodClosePanelProps> = ({
  graphId,
  onEntryCreated,
}) => {
  // ── State ────────────────────────────────────────────────────────────
  const [calendar, setCalendar] = useState<LedgerFiscalCalendar | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null)
  const [closeStatus, setCloseStatus] =
    useState<LedgerPeriodCloseStatus | null>(null)
  const [drafts, setDrafts] = useState<LedgerPeriodDrafts | null>(null)

  const [isLoadingCalendar, setIsLoadingCalendar] = useState(true)
  const [isLoadingStatus, setIsLoadingStatus] = useState(false)
  const [isLoadingDrafts, setIsLoadingDrafts] = useState(false)

  const [error, setError] = useState<string | null>(null)
  const [creatingEntry, setCreatingEntry] = useState<string | null>(null)
  const [isClosing, setIsClosing] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  const [allowStaleSync, setAllowStaleSync] = useState(false)

  // Reopen modal
  const [reopenTarget, setReopenTarget] = useState<string | null>(null)
  const [reopenReason, setReopenReason] = useState('')
  const [isReopening, setIsReopening] = useState(false)

  // ── Data loaders ─────────────────────────────────────────────────────
  const loadCalendar = useCallback(async () => {
    try {
      setIsLoadingCalendar(true)
      setError(null)
      const cal = await extensions.ledger.getFiscalCalendar(graphId)
      setCalendar(cal)
      // Default to the first period in the catch-up sequence, or
      // closed_through when nothing is pending.
      const next = cal.catchUpSequence[0] ?? cal.closedThrough
      setSelectedPeriod(next ?? null)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      // 404 means the ledger isn't initialized yet — that's a first-class state
      if (message.includes('404') || message.includes('not initialized')) {
        setCalendar(null)
      } else {
        console.error('Error loading fiscal calendar:', err)
        setError('Failed to load fiscal calendar.')
      }
    } finally {
      setIsLoadingCalendar(false)
    }
  }, [graphId])

  const loadCloseStatus = useCallback(async () => {
    if (!selectedPeriod) return
    try {
      setIsLoadingStatus(true)
      const { start, end } = periodBounds(selectedPeriod)
      const status = await extensions.ledger.getPeriodCloseStatus(
        graphId,
        start,
        end
      )
      setCloseStatus(status)
    } catch (err) {
      console.error('Error loading close status:', err)
      setError('Failed to load period close status.')
    } finally {
      setIsLoadingStatus(false)
    }
  }, [graphId, selectedPeriod])

  const loadDrafts = useCallback(async () => {
    if (!selectedPeriod) return
    try {
      setIsLoadingDrafts(true)
      const result = await extensions.ledger.listPeriodDrafts(
        graphId,
        selectedPeriod
      )
      setDrafts(result)
    } catch (err) {
      console.error('Error loading drafts:', err)
      setDrafts(null)
    } finally {
      setIsLoadingDrafts(false)
    }
  }, [graphId, selectedPeriod])

  useEffect(() => {
    loadCalendar()
  }, [loadCalendar])

  useEffect(() => {
    if (selectedPeriod) {
      // Reset the stale-sync override when the user moves between periods.
      // The override is intentionally opt-in per period so that enabling it
      // for one close doesn't silently carry over to the next.
      setAllowStaleSync(false)
      loadCloseStatus()
      loadDrafts()
    }
  }, [selectedPeriod, loadCloseStatus, loadDrafts])

  // ── Actions ──────────────────────────────────────────────────────────
  const handleInitialize = useCallback(async () => {
    try {
      setIsInitializing(true)
      setError(null)
      await extensions.ledger.initializeLedger(graphId, {})
      await loadCalendar()
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setError(`Failed to initialize ledger: ${message}`)
    } finally {
      setIsInitializing(false)
    }
  }, [graphId, loadCalendar])

  const handleCreateEntry = useCallback(
    async (structureId: string) => {
      if (!selectedPeriod) return
      try {
        setCreatingEntry(structureId)
        setError(null)
        const { start, end } = periodBounds(selectedPeriod)
        await extensions.ledger.createClosingEntry(
          graphId,
          structureId,
          end,
          start,
          end
        )
        onEntryCreated?.()
        await loadCloseStatus()
        await loadDrafts()
      } catch (err) {
        console.error('Error creating closing entry:', err)
        setError('Failed to create closing entry.')
      } finally {
        setCreatingEntry(null)
      }
    },
    [graphId, selectedPeriod, onEntryCreated, loadCloseStatus, loadDrafts]
  )

  const handleClosePeriod = useCallback(async () => {
    if (!selectedPeriod) return
    try {
      setIsClosing(true)
      setError(null)
      const result = await extensions.ledger.closePeriod(
        graphId,
        selectedPeriod,
        { allowStaleSync }
      )
      setCalendar(result.fiscalCalendar)
      // Advance selection to the next period (or stay on closed_through)
      const next =
        result.fiscalCalendar.catchUpSequence[0] ??
        result.fiscalCalendar.closedThrough
      setSelectedPeriod(next ?? null)
      onEntryCreated?.()
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setError(`Close period failed: ${message}`)
    } finally {
      setIsClosing(false)
    }
  }, [graphId, selectedPeriod, allowStaleSync, onEntryCreated])

  const openReopenModal = (period: string) => {
    setReopenTarget(period)
    setReopenReason('')
  }

  const handleReopen = useCallback(async () => {
    if (!reopenTarget || !reopenReason.trim()) return
    try {
      setIsReopening(true)
      setError(null)
      const newCal = await extensions.ledger.reopenPeriod(
        graphId,
        reopenTarget,
        reopenReason.trim()
      )
      setCalendar(newCal)
      setSelectedPeriod(reopenTarget)
      setReopenTarget(null)
      setReopenReason('')
      onEntryCreated?.()
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setError(`Reopen period failed: ${message}`)
    } finally {
      setIsReopening(false)
    }
  }, [graphId, reopenTarget, reopenReason, onEntryCreated])

  // ── Derived ──────────────────────────────────────────────────────────
  const selectablePeriods = useMemo(() => {
    if (!calendar) return []
    const set = new Set<string>()
    calendar.catchUpSequence.forEach((p) => set.add(p))
    calendar.periods.forEach((p) => set.add(p.name))
    return [...set].sort()
  }, [calendar])

  const selectedPeriodStatus = useMemo(() => {
    if (!calendar || !selectedPeriod) return null
    return (
      calendar.periods.find((p) => p.name === selectedPeriod)?.status ?? null
    )
  }, [calendar, selectedPeriod])

  const isSelectedNextToClose = useMemo(() => {
    if (!calendar || !selectedPeriod) return false
    return calendar.catchUpSequence[0] === selectedPeriod
  }, [calendar, selectedPeriod])

  // ── Render guards ────────────────────────────────────────────────────
  if (isLoadingCalendar) {
    return (
      <div className="flex justify-center py-8">
        <Spinner size="md" />
      </div>
    )
  }

  // First-run: ledger not yet initialized
  if (!calendar) {
    return (
      <div className="space-y-4">
        <Card theme={customTheme.card}>
          <div className="py-8 text-center">
            <HiCalendar className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <h3 className="font-heading mb-2 text-xl font-bold dark:text-white">
              Fiscal Calendar Not Initialized
            </h3>
            <p className="mb-6 text-gray-500 dark:text-gray-400">
              Initialize the fiscal calendar to start tracking close state and
              enforcing period sequence.
            </p>
            {error && (
              <div className="mb-4 flex items-center justify-center gap-2 text-red-500">
                <HiExclamationCircle className="h-5 w-5" />
                <span>{error}</span>
              </div>
            )}
            <Button
              theme={customTheme.button}
              color="primary"
              disabled={isInitializing}
              onClick={handleInitialize}
            >
              {isInitializing ? (
                <Spinner size="sm" className="mr-2" />
              ) : (
                <HiPlay className="mr-2 h-4 w-4" />
              )}
              Initialize Fiscal Calendar
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 text-red-500">
          <HiExclamationCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      <CalendarSummary calendar={calendar} onRefresh={loadCalendar} />

      {/* Period selector */}
      <div className="flex flex-wrap items-center gap-4 border-b border-gray-200 pb-4 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Label htmlFor="period-select" className="text-sm font-medium">
            Period:
          </Label>
          <Select
            id="period-select"
            value={selectedPeriod ?? ''}
            onChange={(e) => setSelectedPeriod(e.target.value || null)}
            sizing="sm"
          >
            <option value="">— Select period —</option>
            {selectablePeriods.map((p) => (
              <option key={p} value={p}>
                {formatPeriod(p)}
                {calendar.catchUpSequence[0] === p ? ' (next to close)' : ''}
              </option>
            ))}
          </Select>
        </div>
        {selectedPeriodStatus && (
          <Badge color={STATUS_COLORS[selectedPeriodStatus] ?? 'gray'}>
            {selectedPeriodStatus}
          </Badge>
        )}
        {selectedPeriodStatus === 'closed' && selectedPeriod && (
          <Button
            theme={customTheme.button}
            color="light"
            size="xs"
            onClick={() => openReopenModal(selectedPeriod)}
          >
            <HiLockOpen className="mr-1 h-4 w-4" />
            Reopen
          </Button>
        )}
      </div>

      {/* Schedules in selected period */}
      {isLoadingStatus ? (
        <div className="flex justify-center py-8">
          <Spinner size="md" />
        </div>
      ) : !closeStatus || closeStatus.schedules.length === 0 ? (
        <div className="py-8 text-center text-gray-500 dark:text-gray-400">
          No schedules found for this period.
        </div>
      ) : (
        <>
          <Table theme={customTheme.table}>
            <TableHead>
              <TableHeadCell>Schedule</TableHeadCell>
              <TableHeadCell>Amount</TableHeadCell>
              <TableHeadCell>Status</TableHeadCell>
              <TableHeadCell className="w-40" />
            </TableHead>
            <TableBody>
              {closeStatus.schedules.map((item) => (
                <TableRow key={item.structureId}>
                  <TableCell className="font-medium text-gray-900 dark:text-white">
                    {item.structureName}
                  </TableCell>
                  <TableCell className="text-gray-900 dark:text-white">
                    {formatCurrencyDollars(item.amount)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      color={STATUS_COLORS[item.status] || 'gray'}
                      size="sm"
                    >
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {item.status === 'pending' && (
                      <Button
                        theme={customTheme.button}
                        size="xs"
                        color="primary"
                        disabled={creatingEntry === item.structureId}
                        onClick={() => handleCreateEntry(item.structureId)}
                      >
                        {creatingEntry === item.structureId ? (
                          <Spinner size="sm" className="mr-1" />
                        ) : (
                          <TbFileInvoice className="mr-1 h-4 w-4" />
                        )}
                        Draft entry
                      </Button>
                    )}
                    {item.status === 'draft' && (
                      <Badge color="warning" size="sm">
                        <HiClock className="mr-1 inline h-3 w-3" />
                        Draft created
                      </Badge>
                    )}
                    {item.status === 'posted' && (
                      <Badge color="success" size="sm">
                        <HiCheck className="mr-1 inline h-3 w-3" />
                        Posted
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex gap-4 text-sm text-gray-500 dark:text-gray-400">
            <span>Draft: {closeStatus.totalDraft}</span>
            <span>Posted: {closeStatus.totalPosted}</span>
          </div>
        </>
      )}

      {/* Draft review + close action */}
      {drafts && drafts.draftCount > 0 && (
        <DraftReviewPanel drafts={drafts} isLoading={isLoadingDrafts} />
      )}

      {isSelectedNextToClose && (
        <ClosePeriodAction
          calendar={calendar}
          selectedPeriod={selectedPeriod!}
          drafts={drafts}
          isClosing={isClosing}
          allowStaleSync={allowStaleSync}
          onToggleStaleSync={setAllowStaleSync}
          onClose={handleClosePeriod}
        />
      )}

      {/* Reopen modal */}
      <Modal
        show={reopenTarget !== null}
        onClose={() => setReopenTarget(null)}
        size="md"
      >
        <ModalHeader>Reopen Period {formatPeriod(reopenTarget)}</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Reopening will transition the period back to <em>closing</em>,
              allowing new adjustments. Posted entries stay posted. The audit
              log records the reason below.
            </p>
            <div>
              <Label htmlFor="reopen-reason" className="text-sm font-medium">
                Reason (required)
              </Label>
              <Textarea
                id="reopen-reason"
                value={reopenReason}
                onChange={(e) => setReopenReason(e.target.value)}
                placeholder="e.g., Missed expense reimbursement from Vendor X"
                rows={3}
              />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            theme={customTheme.button}
            color="light"
            onClick={() => setReopenTarget(null)}
            disabled={isReopening}
          >
            Cancel
          </Button>
          <Button
            theme={customTheme.button}
            color="warning"
            disabled={!reopenReason.trim() || isReopening}
            onClick={handleReopen}
          >
            {isReopening ? <Spinner size="sm" className="mr-2" /> : null}
            Reopen Period
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}

// ── Sub-components ───────────────────────────────────────────────────

interface CalendarSummaryProps {
  calendar: LedgerFiscalCalendar
  onRefresh: () => void
}

const CalendarSummary: FC<CalendarSummaryProps> = ({ calendar, onRefresh }) => {
  return (
    <Card theme={customTheme.card}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 md:grid-cols-4">
          <SummaryField label="Closed through">
            {calendar.closedThrough ? (
              <span className="inline-flex items-center gap-1 text-sm font-semibold">
                <HiLockClosed className="h-3 w-3" />
                {formatPeriod(calendar.closedThrough)}
              </span>
            ) : (
              <span className="text-sm text-gray-400">none yet</span>
            )}
          </SummaryField>
          <SummaryField label="Close target">
            {calendar.closeTarget ? (
              <span className="text-sm font-semibold">
                {formatPeriod(calendar.closeTarget)}
              </span>
            ) : (
              <span className="text-sm text-gray-400">not set</span>
            )}
          </SummaryField>
          <SummaryField label="Pending">
            <span className="text-sm font-semibold">
              {calendar.gapPeriods} period{calendar.gapPeriods === 1 ? '' : 's'}
            </span>
          </SummaryField>
          <SummaryField label="Closeable now">
            {calendar.closeableNow ? (
              <Badge color="success" size="sm">
                <HiCheck className="mr-1 inline h-3 w-3" />
                Yes
              </Badge>
            ) : (
              <Badge color="gray" size="sm">
                No
              </Badge>
            )}
          </SummaryField>
        </div>
        <Button
          theme={customTheme.button}
          color="light"
          size="xs"
          onClick={onRefresh}
        >
          <HiRefresh className="mr-1 h-4 w-4" />
          Refresh
        </Button>
      </div>
      {calendar.blockers.length > 0 && (
        <div className="mt-4 rounded-lg border border-yellow-300 bg-yellow-50 p-3 text-sm dark:border-yellow-600 dark:bg-yellow-900/30">
          <div className="mb-1 font-semibold text-yellow-800 dark:text-yellow-200">
            Blockers on next period:
          </div>
          <ul className="list-disc space-y-1 pl-6 text-yellow-800 dark:text-yellow-200">
            {calendar.blockers.map((code) => (
              <li key={code}>{BLOCKER_MESSAGES[code] ?? code}</li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  )
}

interface SummaryFieldProps {
  label: string
  children: ReactNode
}

const SummaryField: FC<SummaryFieldProps> = ({ label, children }) => (
  // Default text color at the wrapper so children without their own color
  // class (e.g., the value <span>s below) pick up the right theme color.
  <div className="flex flex-col text-gray-900 dark:text-white">
    <span className="text-xs tracking-wide text-gray-500 uppercase dark:text-gray-400">
      {label}
    </span>
    {children}
  </div>
)

interface DraftReviewPanelProps {
  drafts: LedgerPeriodDrafts
  isLoading: boolean
}

const DraftReviewPanel: FC<DraftReviewPanelProps> = ({ drafts, isLoading }) => {
  if (isLoading) return null

  return (
    <Card theme={customTheme.card}>
      <div className="mb-3 flex items-center justify-between text-gray-900 dark:text-white">
        <h3 className="text-lg font-semibold">
          Draft review ({drafts.draftCount})
        </h3>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-500 dark:text-gray-400">
            Debit: {formatCurrencyDollars(drafts.totalDebit / 100)}
          </span>
          <span className="text-gray-500 dark:text-gray-400">
            Credit: {formatCurrencyDollars(drafts.totalCredit / 100)}
          </span>
          {drafts.allBalanced ? (
            <Badge color="success" size="sm">
              Balanced
            </Badge>
          ) : (
            <Badge color="failure" size="sm">
              Unbalanced
            </Badge>
          )}
        </div>
      </div>
      <div className="space-y-3">
        {drafts.drafts.map((d) => (
          <div
            key={d.entryId}
            className="rounded border border-gray-200 p-3 text-sm text-gray-900 dark:border-gray-700 dark:text-white"
          >
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="font-medium">
                  {d.sourceStructureName ?? d.memo ?? d.entryId}
                </span>
                <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                  {d.postingDate}
                </span>
                {d.provenance && (
                  <Badge color="gray" size="sm" className="ml-2 inline-flex">
                    {d.provenance}
                  </Badge>
                )}
              </div>
              {d.balanced ? (
                <Badge color="success" size="sm">
                  {formatCurrencyDollars(d.totalDebit / 100)}
                </Badge>
              ) : (
                <Badge color="failure" size="sm">
                  DR {formatCurrencyDollars(d.totalDebit / 100)} ≠ CR{' '}
                  {formatCurrencyDollars(d.totalCredit / 100)}
                </Badge>
              )}
            </div>
            <Table theme={customTheme.table}>
              <TableBody>
                {d.lineItems.map((li) => (
                  <TableRow key={li.lineItemId}>
                    <TableCell className="text-xs text-gray-700 dark:text-gray-200">
                      {li.elementCode ? `${li.elementCode} · ` : ''}
                      {li.elementName}
                    </TableCell>
                    <TableCell className="w-32 text-right text-xs text-gray-700 dark:text-gray-200">
                      {li.debitAmount > 0
                        ? formatCurrencyDollars(li.debitAmount / 100)
                        : ''}
                    </TableCell>
                    <TableCell className="w-32 text-right text-xs text-gray-700 dark:text-gray-200">
                      {li.creditAmount > 0
                        ? formatCurrencyDollars(li.creditAmount / 100)
                        : ''}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ))}
      </div>
    </Card>
  )
}

interface ClosePeriodActionProps {
  calendar: LedgerFiscalCalendar
  selectedPeriod: string
  drafts: LedgerPeriodDrafts | null
  isClosing: boolean
  allowStaleSync: boolean
  onToggleStaleSync: (value: boolean) => void
  onClose: () => void
}

const ClosePeriodAction: FC<ClosePeriodActionProps> = ({
  calendar,
  selectedPeriod,
  drafts,
  isClosing,
  allowStaleSync,
  onToggleStaleSync,
  onClose,
}) => {
  const blocked = !calendar.closeableNow
  const syncStaleOnly =
    blocked &&
    calendar.blockers.length === 1 &&
    calendar.blockers[0] === 'sync_stale'
  const hasUnbalancedDrafts = drafts ? !drafts.allBalanced : false

  return (
    <Card theme={customTheme.card}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Close {formatPeriod(selectedPeriod)}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Posts all draft entries in the period, advances{' '}
            <code>closed_through</code>, and auto-advances the target when
            reached.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {syncStaleOnly && (
            <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
              <input
                type="checkbox"
                checked={allowStaleSync}
                onChange={(e) => onToggleStaleSync(e.target.checked)}
                className="rounded border-gray-300"
              />
              Allow stale sync
            </label>
          )}
          <Button
            theme={customTheme.button}
            color="primary"
            disabled={
              isClosing ||
              hasUnbalancedDrafts ||
              (blocked && !(syncStaleOnly && allowStaleSync))
            }
            onClick={onClose}
          >
            {isClosing ? (
              <Spinner size="sm" className="mr-2" />
            ) : (
              <HiLockClosed className="mr-2 h-4 w-4" />
            )}
            Close Period
          </Button>
        </div>
      </div>
      {hasUnbalancedDrafts && (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400">
          Cannot close: one or more draft entries have unbalanced debits and
          credits. Fix them before closing.
        </p>
      )}
    </Card>
  )
}

export default PeriodClosePanel
