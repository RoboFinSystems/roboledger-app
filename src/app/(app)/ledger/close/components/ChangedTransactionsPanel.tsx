'use client'

import DocsLink from '@/components/DocsLink'
import { friendlyError, type FriendlyError } from '@/lib/ledger/errors'
import { formatAmount, formatDate } from '@/lib/ledger/formatters'
import type {
  ReconcilingItemPlan,
  ResolveReconcilingItemResponse,
} from '@robosystems/client'
import type { LedgerEventBlock } from '@robosystems/client/clients'
import { clients, LoadingState } from '@robosystems/core'
import {
  Button,
  Label,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
  Textarea,
} from 'flowbite-react'
import type { FC } from 'react'
import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import { HiCheckCircle, HiExclamationCircle } from 'react-icons/hi'

type Treatment = 'restate' | 'catch_up' | 'acknowledge'

const CHANGES_LIMIT = 200

// A sync from the books or an amended bank line can both flag a change.
const SOURCE_NAMES: Record<string, string> = {
  quickbooks: 'QuickBooks',
  plaid: 'Plaid',
  mercury: 'Mercury',
}

function sourceName(source: string | null | undefined): string {
  return (source && SOURCE_NAMES[source]) || 'The source'
}

// ── Helpers ────────────────────────────────────────────────────────────

/** A refusal in the app's words, or the fallback when nothing was said. */
const describeError = (err: unknown, fallback: string): FriendlyError =>
  err instanceof Error ? friendlyError(err.message) : { message: fallback }

/** A link only to a web address; anything else stays text. */
function webHref(url: string | null | undefined): string | null {
  return url && /^https?:\/\//i.test(url) ? url : null
}

/** A signed amount in minor units, debit-positive, as the API reports it. */
function netAmount(cents: number, currency: string | null | undefined) {
  if (cents === 0) return formatAmount(0, currency)
  return `${formatAmount(Math.abs(cents), currency)} ${cents > 0 ? 'Dr' : 'Cr'}`
}

function describeOutcome(result: ResolveReconcilingItemResponse): string {
  if (result.disposition === 'restate') {
    const rebuilt = result.regenerated?.entry_ids?.length ?? 0
    return `Restated. ${rebuilt} ${rebuilt === 1 ? 'entry was' : 'entries were'} rebuilt to match the source.`
  }
  if (result.disposition === 'catch_up') {
    if (!result.catch_up) {
      return 'Settled. The change moved no money, so nothing was posted.'
    }
    const verb = result.catch_up.status === 'posted' ? 'posted' : 'drafted'
    return `Settled. A catch-up entry was ${verb} for ${formatDate(result.catch_up.posting_date)}.`
  }
  return 'Marked as handled. Nothing was posted.'
}

/** Why a treatment cannot be chosen for this change, or null when it can. */
function blockedReason(
  treatment: Treatment,
  plan: ReconcilingItemPlan
): string | null {
  const unmapped = plan.unmapped_element_external_ids ?? []
  if (treatment !== 'acknowledge' && unmapped.length > 0) {
    return 'The source now uses an account this ledger has not mapped. Sync and map it first.'
  }
  if (treatment === 'restate') {
    const blockers = plan.restate_blockers ?? []
    if (blockers.length > 0) return `${blockers.join('; ')}.`
  }
  return null
}

// ── Component ──────────────────────────────────────────────────────────

interface ChangedTransactionsPanelProps {
  graphId: string
  /** A subsidiary's id, or null for the group parent. */
  entityId?: string | null
}

/**
 * Transactions edited in the source system after they were posted. Each one
 * is shown as posted against as it stands now, and settled one of three ways.
 */
const ChangedTransactionsPanel: FC<ChangedTransactionsPanelProps> = ({
  graphId,
  entityId = null,
}) => {
  const [items, setItems] = useState<LedgerEventBlock[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [truncated, setTruncated] = useState(false)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [plan, setPlan] = useState<ReconcilingItemPlan | null>(null)
  const [planError, setPlanError] = useState<string | null>(null)

  const [treatment, setTreatment] = useState<Treatment>('restate')
  const [note, setNote] = useState('')
  const [isSettling, setIsSettling] = useState(false)
  const [settleError, setSettleError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [outcome, setOutcome] = useState<string | null>(null)

  // Sequence guards: a list or a preview that lands after a newer one was
  // asked for, and anything that lands after the graph changed, is dropped.
  const listSeq = useRef(0)
  const planSeq = useRef(0)
  const graphSeq = useRef(0)

  const loadList = useCallback(async () => {
    const seq = ++listSeq.current
    try {
      const list = await clients.ledger.listEventBlocks(graphId, {
        entityId,
        isReconcilingItem: true,
        limit: CHANGES_LIMIT,
      })
      if (seq !== listSeq.current) return
      list.sort(
        (a, b) =>
          new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
      )
      setItems(list)
      setTruncated(list.length >= CHANGES_LIMIT)
      setError(null)
    } catch (err) {
      if (seq !== listSeq.current) return
      console.error('Error loading changed transactions:', err)
      setError('Failed to load changed transactions.')
      // A failed refresh keeps the rows already on screen.
      setItems((current) => current ?? [])
    }
  }, [graphId, entityId])

  useEffect(() => {
    planSeq.current += 1
    graphSeq.current += 1
    setItems(null)
    setTruncated(false)
    setSelectedId(null)
    setPlan(null)
    setPlanError(null)
    setSettleError(null)
    setNotice(null)
    setNote('')
    setOutcome(null)
    setError(null)
    void loadList()
  }, [loadList])

  const closeItem = useCallback(() => {
    planSeq.current += 1
    setSelectedId(null)
    setPlan(null)
    setPlanError(null)
    setSettleError(null)
    setNotice(null)
  }, [])

  /** Takes a change that is no longer open off the list, and says why. */
  const dropRow = useCallback(
    (eventId: string, message: string) => {
      setItems((current) =>
        current ? current.filter((item) => item.id !== eventId) : current
      )
      closeItem()
      setOutcome(message)
      // A full page hid the rest; bring the next ones in.
      if (truncated) void loadList()
    },
    [closeItem, loadList, truncated]
  )

  const openItem = useCallback(
    async (eventId: string) => {
      const seq = ++planSeq.current
      setSelectedId(eventId)
      setPlan(null)
      setPlanError(null)
      setSettleError(null)
      setNotice(null)
      setOutcome(null)
      setNote('')
      try {
        const result = await clients.ledger.previewReconcilingItem(
          graphId,
          eventId
        )
        if (seq !== planSeq.current) return
        setPlan(result)
        setTreatment(result.default_disposition)
      } catch (err) {
        if (seq !== planSeq.current) return
        console.error('Error previewing changed transaction:', err)
        const refusal = describeError(err, 'Failed to load this change.')
        if (refusal.code === 'change_already_settled') {
          dropRow(eventId, refusal.message)
        } else {
          setPlanError(refusal.message)
        }
      }
    },
    [graphId, dropRow]
  )

  const handleSettle = useCallback(async () => {
    if (!selectedId || !plan) return
    const trimmed = note.trim()
    const seq = graphSeq.current
    try {
      setIsSettling(true)
      setSettleError(null)
      const result = await clients.ledger.resolveReconcilingItem(graphId, {
        event_id: selectedId,
        // Settle what was reviewed: a newer change flagged since is refused.
        expected_drift_detected_at: plan.drift_detected_at ?? null,
        disposition: treatment,
        ...(trimmed ? { note: trimmed } : {}),
      })
      if (seq !== graphSeq.current) return
      dropRow(selectedId, describeOutcome(result))
    } catch (err) {
      console.error('Error settling changed transaction:', err)
      if (seq !== graphSeq.current) return
      const refusal = describeError(err, 'The change was not settled.')
      if (refusal.code === 'change_already_settled') {
        dropRow(selectedId, refusal.message)
      } else if (refusal.code === 'change_flagged_again') {
        // What was on screen is no longer the plan; show the newer one.
        await openItem(selectedId)
        setNotice(refusal.message)
      } else {
        setSettleError(refusal.message)
      }
    } finally {
      setIsSettling(false)
    }
  }, [graphId, selectedId, plan, treatment, note, dropRow, openItem])

  const selected = items?.find((item) => item.id === selectedId) ?? null

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Changed transactions
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Transactions that changed in QuickBooks or at the bank after
          RoboLedger recorded them. A close will not run over one nobody has
          settled. <DocsLink href="/docs/changes-after-sync" />
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/30 dark:text-red-300"
        >
          <HiExclamationCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {outcome && (
        <div
          role="status"
          className="flex items-start gap-2 rounded-lg border border-green-300 bg-green-50 p-3 text-sm text-green-800 dark:border-green-700 dark:bg-green-900/30 dark:text-green-200"
        >
          <HiCheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{outcome}</span>
        </div>
      )}

      {items === null ? (
        <LoadingState size="lg" className="py-16" />
      ) : items.length === 0 ? (
        !error && (
          <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500 dark:border-gray-600 dark:text-gray-400">
            <p className="font-medium text-gray-700 dark:text-gray-200">
              Nothing is waiting to be settled.
            </p>
            <p className="mx-auto mt-2 max-w-xl">
              When a transaction changes in QuickBooks or at the bank after
              RoboLedger recorded it, the next sync flags it here instead of
              overwriting what was posted.
            </p>
          </div>
        )
      ) : (
        <Table>
          <TableHead>
            <tr>
              <TableHeadCell>Date</TableHeadCell>
              <TableHeadCell>Transaction</TableHeadCell>
              <TableHeadCell>Changed in</TableHeadCell>
              <TableHeadCell>Reference</TableHeadCell>
              <TableHeadCell className="text-right">Amount</TableHeadCell>
              <TableHeadCell>
                <span className="sr-only">Actions</span>
              </TableHeadCell>
            </tr>
          </TableHead>
          <TableBody>
            {items.map((item) => {
              const isOpen = item.id === selectedId
              return (
                <Fragment key={item.id}>
                  <TableRow>
                    <TableCell className="whitespace-nowrap text-gray-900 dark:text-white">
                      {formatDate(item.occurredAt)}
                    </TableCell>
                    <TableCell>
                      <span className="block text-gray-900 dark:text-white">
                        {item.description ?? item.eventType.replace(/_/g, ' ')}
                      </span>
                      {item.description ? (
                        <span className="block text-xs text-gray-500 dark:text-gray-400">
                          {item.eventType.replace(/_/g, ' ')}
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {sourceName(item.source)}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {webHref(item.externalUrl) && item.externalId ? (
                        <a
                          href={webHref(item.externalUrl) ?? undefined}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 dark:text-primary-400 underline"
                        >
                          {item.externalId}
                        </a>
                      ) : (
                        (item.externalId ?? '—')
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatAmount(item.amount ?? null, item.currency)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="xs"
                        color="light"
                        disabled={isSettling}
                        onClick={() =>
                          isOpen ? closeItem() : openItem(item.id)
                        }
                      >
                        {isOpen ? 'Hide' : 'Review'}
                      </Button>
                    </TableCell>
                  </TableRow>
                  {isOpen && (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="bg-gray-50 dark:bg-gray-900/40"
                      >
                        {planError ? (
                          <p
                            role="alert"
                            className="text-sm text-red-600 dark:text-red-400"
                          >
                            {planError}
                          </p>
                        ) : !plan ? (
                          <LoadingState size="md" className="py-6" />
                        ) : (
                          <ChangeDetail
                            plan={plan}
                            currency={selected?.currency}
                            treatment={treatment}
                            onTreatment={setTreatment}
                            note={note}
                            onNote={setNote}
                            isSettling={isSettling}
                            settleError={settleError}
                            notice={notice}
                            onSettle={handleSettle}
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              )
            })}
          </TableBody>
        </Table>
      )}

      {truncated && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Showing {CHANGES_LIMIT}. More appear as these are settled.
        </p>
      )}
    </div>
  )
}

// ── Detail ─────────────────────────────────────────────────────────────

interface ChangeDetailProps {
  plan: ReconcilingItemPlan
  currency: string | null | undefined
  treatment: Treatment
  onTreatment: (treatment: Treatment) => void
  note: string
  onNote: (note: string) => void
  isSettling: boolean
  settleError: string | null
  notice: string | null
  onSettle: () => void
}

const ChangeDetail: FC<ChangeDetailProps> = ({
  plan,
  currency,
  treatment,
  onTreatment,
  note,
  onNote,
  isSettling,
  settleError,
  notice,
  onSettle,
}) => {
  const delta = plan.delta ?? []
  const closedPeriods = plan.closed_periods ?? []
  const catchUpDate = plan.default_posting_date
    ? formatDate(plan.default_posting_date)
    : null

  const options: { value: Treatment; label: string; detail: string }[] = [
    {
      value: 'restate',
      label: 'Restate',
      detail: plan.no_gl_effect
        ? 'Rebuild the entries so they carry the new wording. No figures change.'
        : "Rebuild the entries to match the source, in the month the transaction belongs to. That month's figures change.",
    },
    {
      value: 'catch_up',
      label: 'Catch up',
      detail: plan.no_gl_effect
        ? 'The original month stays as it was. This change moves no money, so nothing posts.'
        : `The original month stays as it was. The difference is drafted as one entry${catchUpDate ? ` on ${catchUpDate}` : ' in an open month'} and posts when that period closes. It stays in RoboLedger.`,
    },
    {
      value: 'acknowledge',
      label: 'Mark as handled',
      detail:
        'You already booked the difference yourself. Nothing posts; your note is the record.',
    },
  ]

  const chosenBlocked = blockedReason(treatment, plan)
  const needsNote = treatment === 'acknowledge' && !note.trim()

  return (
    <div className="space-y-4 py-2 text-sm">
      {notice && (
        <p role="status" className="text-yellow-800 dark:text-yellow-200">
          {notice}
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <EntryList
          title="Posted by RoboLedger"
          entries={plan.prior_entries ?? []}
          currency={currency}
        />
        <EntryList
          title={`${sourceName(plan.source)} now`}
          entries={plan.accepted_entries ?? []}
          currency={currency}
        />
      </div>

      <div>
        <h3 className="mb-1 font-medium text-gray-900 dark:text-white">
          Difference by account
        </h3>
        {delta.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">
            No account&apos;s balance changes. The edit was to a memo or a
            reference.
          </p>
        ) : (
          <table className="w-full text-left">
            <thead className="text-xs text-gray-500 uppercase dark:text-gray-400">
              <tr>
                <th className="py-1 pr-4 font-medium">Account</th>
                <th className="py-1 pr-4 text-right font-medium">Posted</th>
                <th className="py-1 pr-4 text-right font-medium">Now</th>
                <th className="py-1 text-right font-medium">Difference</th>
              </tr>
            </thead>
            <tbody className="text-gray-900 dark:text-white">
              {delta.map((line, index) => (
                <tr key={line.element_id ?? line.element_external_id ?? index}>
                  <td className="py-1 pr-4">
                    {line.element_name ??
                      `Unmapped account ${line.element_external_id ?? ''}`.trim()}
                    {line.element_code ? (
                      <span className="ml-2 font-mono text-xs text-gray-500 dark:text-gray-400">
                        {line.element_code}
                      </span>
                    ) : null}
                  </td>
                  <td className="py-1 pr-4 text-right font-mono">
                    {netAmount(line.prior_net, currency)}
                  </td>
                  <td className="py-1 pr-4 text-right font-mono">
                    {netAmount(line.accepted_net, currency)}
                  </td>
                  <td className="py-1 text-right font-mono font-medium">
                    {netAmount(line.delta, currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {closedPeriods.length > 0 && (
        <p className="text-yellow-800 dark:text-yellow-200">
          The posted entries sit in{' '}
          {closedPeriods.length === 1 ? 'a closed period' : 'closed periods'}:{' '}
          {closedPeriods.join(', ')}.
        </p>
      )}

      <fieldset className="space-y-2">
        <legend className="mb-1 font-medium text-gray-900 dark:text-white">
          How to settle it
        </legend>
        {options.map((option) => {
          const blocked = blockedReason(option.value, plan)
          return (
            <label
              key={option.value}
              className={`flex items-start gap-3 rounded-lg border p-3 ${
                treatment === option.value
                  ? 'border-primary-500 bg-primary-50 dark:border-primary-400 dark:bg-primary-900/20'
                  : 'border-gray-200 dark:border-gray-700'
              } ${blocked ? 'opacity-60' : 'cursor-pointer'}`}
            >
              <input
                type="radio"
                name="treatment"
                className="mt-1"
                value={option.value}
                checked={treatment === option.value}
                disabled={Boolean(blocked) || isSettling}
                onChange={() => onTreatment(option.value)}
              />
              <span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {option.label}
                </span>
                <span className="block text-gray-600 dark:text-gray-300">
                  {option.detail}
                </span>
                {blocked && (
                  <span className="mt-1 block text-yellow-800 dark:text-yellow-200">
                    Not available: {blocked}
                  </span>
                )}
              </span>
            </label>
          )
        })}
      </fieldset>

      <div>
        <Label htmlFor="settle-note" className="text-sm font-medium">
          Note{treatment === 'acknowledge' ? ' (required)' : ' (optional)'}
        </Label>
        <Textarea
          id="settle-note"
          rows={2}
          value={note}
          onChange={(e) => onNote(e.target.value)}
          placeholder={
            treatment === 'acknowledge'
              ? 'How the difference was handled, and which entry covered it'
              : 'Why this treatment'
          }
        />
      </div>

      {settleError && (
        <p role="alert" className="text-red-600 dark:text-red-400">
          {settleError}
        </p>
      )}

      <Button
        size="sm"
        color="primary"
        disabled={isSettling || Boolean(chosenBlocked) || needsNote}
        onClick={onSettle}
      >
        {isSettling ? <Spinner size="sm" className="mr-2 text-white" /> : null}
        Settle
      </Button>
    </div>
  )
}

interface EntryListProps {
  title: string
  entries: NonNullable<ReconcilingItemPlan['prior_entries']>
  currency: string | null | undefined
}

const EntryList: FC<EntryListProps> = ({ title, entries, currency }) => (
  <div>
    <h3 className="mb-1 font-medium text-gray-900 dark:text-white">{title}</h3>
    {entries.length === 0 ? (
      <p className="text-gray-500 dark:text-gray-400">No entries.</p>
    ) : (
      <ul className="space-y-1 text-gray-700 dark:text-gray-200">
        {entries.map((entry, index) => (
          <li key={entry.entry_id ?? entry.external_id ?? index}>
            <span className="whitespace-nowrap">
              {entry.posting_date ? formatDate(entry.posting_date) : 'No date'}
            </span>
            <span className="ml-2 font-mono">
              {formatAmount(entry.total_debit ?? 0, currency)}
            </span>
            {entry.memo ? (
              <span className="ml-2 text-gray-500 dark:text-gray-400">
                {entry.memo}
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    )}
  </div>
)

export default ChangedTransactionsPanel
