'use client'

import { formatAmount, formatDate } from '@/lib/ledger/formatters'
import type {
  LedgerDischargeCandidates,
  LedgerOpenItem,
} from '@robosystems/client/clients'
import { clients } from '@robosystems/core'
import { Checkbox, Label } from '@robosystems/core/ui'
import { type FC, useEffect, useMemo, useState } from 'react'
import { HiChevronDown, HiChevronRight, HiLink } from 'react-icons/hi'

/** What the commit records: positive cents of the line per document. */
export interface DischargeAllocation {
  obligation_event_id: string
  amount: number
}

interface Props {
  graphId: string
  eventId: string
  disabled?: boolean
  /** Called with the chosen allocations; empty when nothing is picked. */
  onChange: (allocations: DischargeAllocation[]) => void
}

/** Applies the line to the picked documents in the order offered, each up to
 *  its open amount, until the line is spent. */
export function allocate(
  candidates: readonly LedgerOpenItem[],
  picked: ReadonlySet<string>,
  amountCents: number
): DischargeAllocation[] {
  let remaining = amountCents
  const allocations: DischargeAllocation[] = []
  for (const item of candidates) {
    if (!picked.has(item.eventId) || remaining <= 0) continue
    const amount = Math.min(item.openCents, remaining)
    allocations.push({ obligation_event_id: item.eventId, amount })
    remaining -= amount
  }
  return allocations
}

/** The open bills or invoices a bank line may pay. Nothing is settled unless
 *  a person ticks one; a line with none picked commits as it is and its bill
 *  stays open. Hidden when the line has no candidates. */
const SettlementPicker: FC<Props> = function ({
  graphId,
  eventId,
  disabled,
  onChange,
}) {
  const [result, setResult] = useState<LedgerDischargeCandidates | null>(null)
  const [open, setOpen] = useState(false)
  const [picked, setPicked] = useState<Set<string>>(new Set())

  useEffect(() => {
    let cancelled = false
    setResult(null)
    setPicked(new Set())
    Promise.resolve()
      .then(() => clients.ledger.getDischargeCandidates(graphId, eventId))
      .then((found) => {
        if (cancelled) return
        setResult(found)
        // Open by default when the line went to a receivables or payables
        // account, where a settlement is expected.
        setOpen(!!found?.classifiedToControl)
      })
      .catch((err) => {
        console.error('Error loading settlement candidates:', err)
      })
    return () => {
      cancelled = true
    }
  }, [graphId, eventId])

  const allocations = useMemo(
    () =>
      result ? allocate(result.candidates, picked, result.amountCents) : [],
    [result, picked]
  )

  useEffect(() => {
    onChange(allocations)
  }, [allocations, onChange])

  if (!result || result.candidates.length === 0) return null

  const noun = result.kind === 'payables' ? 'bill' : 'invoice'
  const applied = new Map(
    allocations.map((a) => [a.obligation_event_id, a.amount])
  )

  return (
    <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
      <button
        type="button"
        className="flex w-full items-center gap-2 text-left"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <HiLink className="h-4 w-4 text-gray-400" />
        <h4 className="font-heading text-sm font-bold text-gray-900 dark:text-white">
          Settles a {noun}?
        </h4>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {allocations.length > 0
            ? `${allocations.length} picked`
            : `${result.candidates.length} open`}
        </span>
        {open ? (
          <HiChevronDown className="ml-auto h-4 w-4" />
        ) : (
          <HiChevronRight className="ml-auto h-4 w-4" />
        )}
      </button>
      {open && (
        <div className="mt-3 space-y-2">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Tick the {noun}s this line pays. It is applied in the order shown,
            each up to what is open, until the line&apos;s{' '}
            {formatAmount(result.amountCents, 'USD')} is spent. Leave them
            unticked and the {noun} stays open.
          </p>
          {result.candidates.map((item) => {
            const id = `settle-${item.eventId}`
            const amount = applied.get(item.eventId)
            return (
              <div key={item.eventId} className="flex items-start gap-2">
                <Checkbox
                  id={id}
                  checked={picked.has(item.eventId)}
                  disabled={disabled}
                  onChange={(e) =>
                    setPicked((current) => {
                      const next = new Set(current)
                      if (e.target.checked) next.add(item.eventId)
                      else next.delete(item.eventId)
                      return next
                    })
                  }
                />
                <Label
                  htmlFor={id}
                  className="flex-1 text-sm text-gray-700 dark:text-gray-300"
                >
                  <span className="font-medium">
                    {item.documentNumber ?? item.description ?? item.eventId}
                  </span>
                  <span className="ml-2 font-mono">
                    {formatAmount(item.openCents, item.currency)} open
                  </span>
                  {item.openCents === result.amountCents && (
                    <span className="ml-2 text-xs text-green-600 dark:text-green-400">
                      exact amount
                    </span>
                  )}
                  <span className="block text-xs font-normal text-gray-500 dark:text-gray-400">
                    {formatDate(item.occurredOn)} · due{' '}
                    {formatDate(item.dueDate)}
                    {amount !== undefined &&
                      ` · applies ${formatAmount(amount, item.currency)}`}
                  </span>
                </Label>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default SettlementPicker
