'use client'

import { friendlyError } from '@/lib/ledger/errors'
import type {
  ConsolidationProposal,
  PreviewConsolidationEntriesResponse,
} from '@robosystems/client/types'
import { clients, LoadingState } from '@robosystems/core'
import {
  Badge,
  Button,
  Card,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from '@robosystems/core/ui'
import type { FC } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { HiExclamationCircle } from 'react-icons/hi'
import { TbFileInvoice } from 'react-icons/tb'
import { formatCurrencyDollars } from '../utils'

const KIND_LABELS: Record<string, string> = {
  elimination_investment: 'Investment elimination',
  elimination_intercompany: 'Intercompany elimination',
  elimination_unrealized_profit: 'Unrealized profit',
  nci_allocation: 'Noncontrolling interest: share of income',
  nci_distribution: 'Noncontrolling interest: distributions',
  equity_method_pickup: 'Equity method: share of income',
  equity_method_distribution: 'Equity method: distributions',
}

const proposalTotal = (proposal: ConsolidationProposal): number =>
  proposal.lines.reduce((sum, line) => sum + (line.debit_amount ?? 0), 0)

interface ConsolidationEntriesPanelProps {
  graphId: string
  /** The month, as YYYY-MM. */
  period: string
  /** Changed by the close panel when the month's state moved, e.g. a reopen. */
  reloadKey?: number
  /** Called after drafts are written, so the drafts list reloads. */
  onDrafted?: () => void
}

/**
 * The group's consolidating entries for one month, on the consolidation
 * entity's close: what the members' books call for, what was withheld and
 * why, and the act of drafting them. The drafts then sit in the draft review
 * below, and this entity's close posts them like any other.
 */
const ConsolidationEntriesPanel: FC<ConsolidationEntriesPanelProps> = ({
  graphId,
  period,
  reloadKey,
  onDrafted,
}) => {
  const [preview, setPreview] =
    useState<PreviewConsolidationEntriesResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDrafting, setIsDrafting] = useState(false)
  const seq = useRef(0)
  // The month on screen now, for a draft that returns after the user moved on.
  const periodRef = useRef(period)
  periodRef.current = period

  const loadPreview = useCallback(async () => {
    const current = ++seq.current
    try {
      setIsLoading(true)
      setError(null)
      const result = await clients.ledger.previewConsolidationEntries(
        graphId,
        period
      )
      if (current !== seq.current) return
      setPreview(result)
    } catch (err) {
      if (current !== seq.current) return
      setPreview(null)
      setError(
        friendlyError(
          err instanceof Error
            ? err.message
            : 'Failed to compute the consolidating entries.'
        ).message
      )
    } finally {
      if (current === seq.current) setIsLoading(false)
    }
  }, [graphId, period])

  useEffect(() => {
    loadPreview()
  }, [loadPreview, reloadKey])

  const handleDraft = useCallback(async () => {
    try {
      setIsDrafting(true)
      setError(null)
      await clients.ledger.proposeConsolidationEntries(graphId, period)
      // This click's callbacks are bound to the month it drafted; once
      // another month is selected their reads would land on it.
      if (periodRef.current !== period) return
      onDrafted?.()
      await loadPreview()
    } catch (err) {
      if (periodRef.current !== period) return
      setError(
        friendlyError(
          err instanceof Error
            ? err.message
            : 'Failed to draft the consolidating entries.'
        ).message
      )
    } finally {
      setIsDrafting(false)
    }
  }, [graphId, period, onDrafted, loadPreview])

  const proposals = preview?.proposals ?? []
  const residuals = preview?.residuals ?? []
  const reconciling = preview?.reconciling_items ?? []
  const notes = preview?.notes ?? []
  const draftedCount = preview?.drafted_entry_ids?.length ?? 0
  // The month's drafts hold what it needs: they are the entries, listed
  // under Draft review, so the proposals are not shown twice.
  const drafted = Boolean(preview?.up_to_date) && draftedCount > 0
  // An entry left out (with nothing withheld) is what keeps drafts from
  // being up to date, and drafting again cannot add it.
  const leftOut = Boolean(preview?.incomplete) && residuals.length === 0
  // Drafts that no longer match the books, even with nothing left to
  // propose, are replaced (or cleared) by drafting again.
  const canDraft =
    Boolean(preview) &&
    !preview?.up_to_date &&
    (proposals.length > 0 || draftedCount > 0) &&
    !(leftOut && draftedCount > 0)

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3 text-gray-900 dark:text-white">
        <div>
          <h3 className="text-lg font-semibold">Consolidating entries</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Computed from the members&apos; books. Drafting writes them here;
            closing this month posts them.
          </p>
        </div>
        {preview && !preview.closed && (
          <Button
            color="primary"
            size="sm"
            disabled={isDrafting || isLoading || !canDraft}
            onClick={handleDraft}
          >
            {isDrafting ? (
              <Spinner size="sm" className="mr-2 text-white" />
            ) : (
              <TbFileInvoice className="mr-2 h-4 w-4" />
            )}
            {draftedCount > 0 ? 'Draft again' : 'Draft entries'}
          </Button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-500">
          <HiExclamationCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      {isLoading && !preview ? (
        <LoadingState size="md" className="py-6" />
      ) : !preview ? null : preview.closed ? (
        <p className="text-sm text-gray-600 dark:text-gray-300">
          This month is closed here; its consolidating entries are as posted.
        </p>
      ) : (
        <div className="space-y-3">
          {drafted ? (
            <p className="text-sm text-gray-600 dark:text-gray-300">
              <Badge color="success" size="sm" className="mr-2 inline-flex">
                Up to date: drafted
              </Badge>
              {draftedCount} draft{draftedCount === 1 ? '' : 's'} hold this
              month&apos;s entries, listed under Draft review. Closing the month
              posts them.
            </p>
          ) : proposals.length > 0 ? (
            <Table>
              <TableHead>
                <tr>
                  <TableHeadCell>Entry</TableHeadCell>
                  <TableHeadCell className="text-right">Amount</TableHeadCell>
                </tr>
              </TableHead>
              <TableBody>
                {proposals.map((p, i) => (
                  <TableRow key={`${p.memo}-${i}`}>
                    <TableCell className="text-gray-900 dark:text-white">
                      <div className="font-medium">
                        {KIND_LABELS[p.adjustment_kind] ?? p.adjustment_kind}
                        {' — '}
                        {p.adjusts_entity_name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {p.basis}
                      </div>
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap text-gray-900 dark:text-white">
                      {formatCurrencyDollars(proposalTotal(p) / 100)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            preview.up_to_date && (
              <p className="text-sm text-gray-600 dark:text-gray-300">
                <Badge color="success" size="sm" className="mr-2 inline-flex">
                  Up to date
                </Badge>
                This entity already holds what the month needs.
              </p>
            )
          )}

          {preview.incomplete && (
            <p className="text-xs text-yellow-700 dark:text-yellow-300">
              An entry the month needs is left out; the notes below say why.
              Drafting again will not add it.
            </p>
          )}

          {/* Out of date only for that reason when nothing is withheld or
              left out: either of those holds the month whatever the drafts. */}
          {draftedCount > 0 &&
            !preview.up_to_date &&
            !preview.incomplete &&
            residuals.length === 0 && (
              <p className="text-xs text-yellow-700 dark:text-yellow-300">
                The month&apos;s {draftedCount} draft
                {draftedCount === 1 ? '' : 's'} no longer match the books. Draft
                again to replace them.
              </p>
            )}

          {residuals.length > 0 && (
            <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-800 dark:border-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-200">
              <div className="mb-1 font-semibold">Withheld until explained</div>
              <ul className="list-disc space-y-1 pl-6">
                {residuals.map((r) => (
                  <li key={r.entity_id}>
                    {r.entity_name}: {formatCurrencyDollars(r.amount / 100)}.{' '}
                    {r.explanation}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {reconciling.length > 0 && (
            <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-800 dark:border-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-200">
              <div className="mb-1 font-semibold">
                Intercompany figures that do not agree
              </div>
              <ul className="list-disc space-y-1 pl-6">
                {reconciling.map((item) => (
                  <li key={`${item.entity_id}-${item.concept}`}>
                    {item.description} (
                    {formatCurrencyDollars(item.amount / 100)} left in the
                    consolidated statements)
                  </li>
                ))}
              </ul>
            </div>
          )}

          {notes.length > 0 && (
            <ul className="list-disc space-y-1 pl-6 text-xs text-gray-500 dark:text-gray-400">
              {notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Card>
  )
}

export default ConsolidationEntriesPanel
