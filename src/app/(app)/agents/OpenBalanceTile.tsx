'use client'

import { formatAmount } from '@/lib/ledger/formatters'
import type {
  LedgerOpenItem,
  LedgerOpenItemKind,
} from '@robosystems/client/clients'
import { clients } from '@robosystems/core'
import Link from 'next/link'
import { type FC, useEffect, useState } from 'react'
import { HiCash } from 'react-icons/hi'

interface Props {
  graphId: string
  agentId: string
  /** The entity whose books to read; `null` for the group parent. */
  entityId: string | null
}

interface Summary {
  kind: LedgerOpenItemKind
  openCents: number
  count: number
  /** Days the most overdue item is past due; zero when none is late. */
  latestDays: number
}

const KINDS: readonly LedgerOpenItemKind[] = ['receivables', 'payables']

const LABEL: Record<LedgerOpenItemKind, string> = {
  receivables: 'Owes us',
  payables: 'We owe',
}

/** Sums one kind's open items; null when there are none. */
export function summarize(
  kind: LedgerOpenItemKind,
  items: readonly LedgerOpenItem[]
): Summary | null {
  if (items.length === 0) return null
  return {
    kind,
    openCents: items.reduce((sum, item) => sum + item.openCents, 0),
    count: items.length,
    latestDays: Math.max(0, ...items.map((item) => item.daysPastDue)),
  }
}

/** The counterparty's open invoices and bills today, each side with its
 *  total and how late the oldest is. Shows nothing when both are settled or
 *  the read fails. */
const OpenBalanceTile: FC<Props> = function ({ graphId, agentId, entityId }) {
  const [summaries, setSummaries] = useState<Summary[]>([])

  useEffect(() => {
    let cancelled = false
    Promise.all(
      KINDS.map((kind) =>
        Promise.resolve()
          .then(() =>
            clients.ledger.getOpenItemsForAgent(graphId, agentId, kind, {
              entityId,
            })
          )
          .then((items) => summarize(kind, items))
      )
    )
      .then((found) => {
        if (!cancelled) setSummaries(found.filter((s) => s !== null))
      })
      .catch((err) => {
        console.error('Error loading open items:', err)
        if (!cancelled) setSummaries([])
      })
    return () => {
      cancelled = true
    }
  }, [graphId, agentId, entityId])

  if (summaries.length === 0) return null

  return (
    <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
      <div className="mb-2 flex items-center gap-2">
        <HiCash className="h-4 w-4 text-gray-400" />
        <h4 className="font-heading text-sm font-bold text-gray-900 dark:text-white">
          Open balance
        </h4>
      </div>
      <div className="space-y-1 text-sm">
        {summaries.map((s) => (
          <div key={s.kind} className="flex flex-wrap items-baseline gap-2">
            <span className="text-gray-500 dark:text-gray-400">
              {LABEL[s.kind]}
            </span>
            <span className="font-mono font-medium text-gray-900 dark:text-white">
              {formatAmount(s.openCents, 'USD')}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {s.count === 1 ? '1 open item' : `${s.count} open items`}
              {s.latestDays > 0 && (
                <span className="ml-1 text-red-600 dark:text-red-400">
                  · oldest {s.latestDays} days late
                </span>
              )}
            </span>
          </div>
        ))}
      </div>
      <Link
        href="/ledger/receivables-payables"
        className="text-primary-600 dark:text-primary-400 mt-2 inline-block text-xs font-medium hover:underline"
      >
        View the aging →
      </Link>
    </div>
  )
}

export default OpenBalanceTile
