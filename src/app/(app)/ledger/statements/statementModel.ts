import { formatDate } from '@/lib/ledger/formatters'
import type { LiveFinancialStatementResponse } from '@robosystems/client/types'

/**
 * The Live Statements table as data — the response reshaped for reading.
 *
 * Two things the wire shape doesn't give the table directly (section
 * folding is the shared `@/lib/ledger/rowFold`, not modelled here):
 *
 * - **Column order.** The op returns `[Current, Prior]`. A comparative
 *   statement reads oldest → newest, left to right, the way the Plan grid
 *   does, so columns are re-sorted chronologically here and every row's
 *   `values` is permuted to match. The reorder is display-only — the same
 *   response feeds the MCP tools, whose callers index by the wire order.
 * - **Dated headers.** "Current" / "Prior" say nothing about the window;
 *   each period carries `start` / `end`, so the caption is derived from them.
 */

type LivePeriod = LiveFinancialStatementResponse['periods'][number]

export interface StatementColumn {
  /** ISO period-end date. */
  end: string
  /** Server label ("Current" / "Prior"). */
  label: string
  /** The window in words — "As of Sep 18, 2026" or "Jan 1 – Sep 18, 2026". */
  caption: string
}

export interface StatementRow {
  /** Fold identity. The qname, so a folded section survives a period change. */
  key: string
  qname: string
  label: string
  isSubtotal: boolean
  depth: number
  /** Aligned to the model's (chronological) columns. */
  values: (number | null)[]
}

export interface StatementModel {
  columns: StatementColumn[]
  rows: StatementRow[]
}

/** A balance sheet is a point in time; every other statement is a window. */
const isInstant = (statementType: string): boolean =>
  statementType === 'balance_sheet'

const shortDate = (iso: string): string =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })

export function periodCaption(
  period: LivePeriod,
  statementType: string
): string {
  if (isInstant(statementType)) return `As of ${formatDate(period.end)}`
  // Same calendar year: say the year once ("Jan 1 – Sep 18, 2026").
  const sameYear = period.start.slice(0, 4) === period.end.slice(0, 4)
  const start = sameYear ? shortDate(period.start) : formatDate(period.start)
  return `${start} – ${formatDate(period.end)}`
}

export function buildStatementModel(
  statement: LiveFinancialStatementResponse
): StatementModel {
  // Chronological, oldest first. `sort` is stable, so periods sharing an end
  // keep the order the server gave them.
  const order = statement.periods
    .map((_, i) => i)
    .sort((a, b) =>
      statement.periods[a].end.localeCompare(statement.periods[b].end)
    )

  const columns = order.map((i) => ({
    end: statement.periods[i].end,
    label: statement.periods[i].label,
    caption: periodCaption(statement.periods[i], statement.statement_type),
  }))

  const rows: StatementRow[] = statement.facts.map((fact) => ({
    key: fact.qname,
    qname: fact.qname,
    label: fact.name,
    isSubtotal: fact.is_subtotal ?? false,
    depth: fact.depth ?? 0,
    values: order.map((i) => fact.values[i] ?? null),
  }))

  return { columns, rows }
}

export interface RowChange {
  amount: number
  /** Null when the earlier value is zero — a percent of nothing is noise. */
  percent: number | null
}

/** Latest column minus the one before it; null unless both carry a value. */
export function rowChange(values: (number | null)[]): RowChange | null {
  if (values.length < 2) return null
  const earlier = values[values.length - 2]
  const later = values[values.length - 1]
  if (earlier === null || later === null) return null
  const amount = later - earlier
  return {
    amount,
    percent: earlier === 0 ? null : amount / Math.abs(earlier),
  }
}
