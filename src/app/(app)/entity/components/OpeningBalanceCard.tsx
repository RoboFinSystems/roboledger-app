'use client'

import { openingDate } from '@/components/FiscalCalendarSetupModal'
import OpeningBalanceForm, {
  type OpeningLine,
} from '@/components/OpeningBalanceForm'
import { formatDate, formatDollars } from '@/lib/ledger/formatters'
import type {
  LedgerEntity,
  LedgerFiscalCalendar,
} from '@robosystems/client/clients'
import { clients } from '@robosystems/core'
import { Button, Card, Modal, ModalHeader } from 'flowbite-react'
import { type FC, useCallback, useEffect, useRef, useState } from 'react'
import { HiLockClosed } from 'react-icons/hi'

interface OpeningEntry {
  id: string
  postingDate: string
  totalDebit: number
  lines: (OpeningLine & { accountName: string; accountCode: string | null })[]
}

interface OpeningBalanceCardProps {
  graphId: string
  /** A subsidiary's id, or null for the group parent. */
  entityId: string | null
  entity: LedgerEntity
}

/**
 * The entity's opening balance: offered while the books have no closed month
 * and no history of their own, replaceable until the first close, read-only
 * after it. Nothing renders where it does not apply — a QuickBooks import
 * carries its history, a consolidation entity has no balance sheet of its
 * own, and books whose history was closed elsewhere start locked.
 */
const OpeningBalanceCard: FC<OpeningBalanceCardProps> = ({
  graphId,
  entityId,
  entity,
}) => {
  const [calendar, setCalendar] = useState<LedgerFiscalCalendar | null>(null)
  const [opening, setOpening] = useState<OpeningEntry | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [formOpen, setFormOpen] = useState(false)

  const scopeKey = `${graphId}:${entityId ?? ''}`
  const scopeRef = useRef(scopeKey)
  scopeRef.current = scopeKey

  const load = useCallback(async () => {
    const requested = scopeKey
    try {
      const [cal, entries] = await Promise.all([
        clients.ledger.getFiscalCalendar(graphId, { entityId }),
        clients.ledger.listJournalEntries(graphId, {
          type: 'opening',
          status: 'posted',
          entityId,
          limit: 1,
        }),
      ])
      if (scopeRef.current !== requested) return
      setCalendar(cal)
      const entry = entries?.entries?.[0]
      setOpening(
        entry
          ? {
              id: entry.id,
              postingDate: entry.postingDate,
              totalDebit: entry.totalDebit,
              lines: entry.lineItems.map((li) => ({
                accountId: li.accountId,
                accountName: li.accountName ?? li.accountId,
                accountCode: li.accountCode ?? null,
                debitAmount: li.debitAmount,
                creditAmount: li.creditAmount,
              })),
            }
          : null
      )
    } catch (err) {
      if (scopeRef.current !== requested) return
      console.error('Failed to load the opening balance:', err)
      setCalendar(null)
      setOpening(null)
    } finally {
      if (scopeRef.current === requested) setLoaded(true)
    }
  }, [graphId, entityId, scopeKey])

  useEffect(() => {
    setLoaded(false)
    setCalendar(null)
    setOpening(null)
    setFormOpen(false)
    void load()
  }, [load])

  if (!loaded || !calendar) return null
  const asOf = openingDate(calendar)
  if (!asOf) return null
  const locked =
    Boolean(calendar.closedThrough) ||
    (calendar.periods ?? []).some((p) => p.status !== 'open')
  const offered =
    !locked &&
    entity.source !== 'quickbooks' &&
    entity.entityRole !== 'consolidation'
  if (!opening && !offered) return null

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between border-b border-gray-200 pb-4 dark:border-gray-600">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Opening balance
        </h2>
        {!locked && (
          <Button
            size="sm"
            color={opening ? 'light' : 'blue'}
            onClick={() => setFormOpen(true)}
          >
            {opening ? 'Replace…' : 'Record opening balance'}
          </Button>
        )}
      </div>

      {opening ? (
        <div className="space-y-3">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            The balance sheet these books start from, as of{' '}
            {formatDate(opening.postingDate)}:{' '}
            {formatDollars(opening.totalDebit)} of debits and credits across{' '}
            {opening.lines.length} accounts.
          </p>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400 uppercase">
                <th className="py-1 font-semibold">Account</th>
                <th className="py-1 text-right font-semibold">Debit</th>
                <th className="py-1 text-right font-semibold">Credit</th>
              </tr>
            </thead>
            <tbody>
              {opening.lines.map((line) => (
                <tr
                  key={line.accountId}
                  className="border-t border-gray-100 dark:border-gray-700"
                >
                  <td className="py-1 text-gray-900 dark:text-white">
                    {line.accountCode ? `${line.accountCode} · ` : ''}
                    {line.accountName}
                  </td>
                  <td className="py-1 text-right tabular-nums">
                    {line.debitAmount ? formatDollars(line.debitAmount) : ''}
                  </td>
                  <td className="py-1 text-right tabular-nums">
                    {line.creditAmount ? formatDollars(line.creditAmount) : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {locked ? (
            <p className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <HiLockClosed className="h-3.5 w-3.5" />
              Locked: the first month has closed. A correction is an adjusting
              entry in an open month.
            </p>
          ) : (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              It can be replaced until the first month closes.
            </p>
          )}
        </div>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          If these books start from a balance sheet rather than their full
          history — moving over from another system at a month-end, or a company
          that already holds assets — record it once, as of {formatDate(asOf)}.
          Books whose history comes with them need none.
        </p>
      )}

      {formOpen && (
        <Modal show onClose={() => setFormOpen(false)} size="lg">
          <ModalHeader>
            {opening
              ? 'Replace the opening balance'
              : 'Record the opening balance'}
          </ModalHeader>
          <OpeningBalanceForm
            graphId={graphId}
            entityId={entityId}
            entityName={entity.name ?? 'this company'}
            asOf={asOf}
            existing={opening?.lines ?? null}
            onCancel={() => setFormOpen(false)}
            onRecorded={() => {
              setFormOpen(false)
              void load()
            }}
          />
        </Modal>
      )}
    </Card>
  )
}

export default OpeningBalanceCard
