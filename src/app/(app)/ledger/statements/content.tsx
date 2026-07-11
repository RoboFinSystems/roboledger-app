'use client'

import {
  clients,
  EmptyState,
  GraphFilters,
  LoadingState,
  PageHeader,
  PageLayout,
  useGraphContext,
} from '@robosystems/core'
import {
  Alert,
  Button,
  Card,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
  TextInput,
} from 'flowbite-react'
import Link from 'next/link'
import type { FC } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { HiExclamationCircle, HiRefresh } from 'react-icons/hi'
import { TbReportMoney } from 'react-icons/tb'

// ── Response shape (REST op result — snake_case) ──
// The SDK wrapper already unwraps `envelope.result`, so this is the
// `LiveFinancialStatementResponse` directly. It's a flat statement —
// not a BlockView `InformationBlock` envelope — so it's rendered with
// a dedicated table here (see specs/live-statements.md, Option A).
interface LivePeriod {
  start: string
  end: string
  label: string
}

interface LiveFactRow {
  qname: string
  name: string
  trait: string | null
  values: (number | null)[]
  depth: number
  is_subtotal: boolean
}

interface LiveStatement {
  graph_id: string
  statement_type: string
  periods: LivePeriod[]
  facts: LiveFactRow[]
  fact_count: number
  unmapped_count: number
  truncated: boolean
}

type StatementType =
  | 'balance_sheet'
  | 'income_statement'
  | 'cash_flow_statement'
  | 'equity_statement'

const STATEMENT_TYPES: { key: StatementType; label: string }[] = [
  { key: 'balance_sheet', label: 'Balance Sheet' },
  { key: 'income_statement', label: 'Income Statement' },
  { key: 'cash_flow_statement', label: 'Cash Flow' },
  { key: 'equity_statement', label: 'Statement of Equity' },
]

type PresetKey = 'this_month' | 'this_quarter' | 'ytd' | 'last_fy' | 'custom'

const PRESETS: { key: PresetKey; label: string }[] = [
  { key: 'this_month', label: 'This month' },
  { key: 'this_quarter', label: 'This quarter' },
  { key: 'ytd', label: 'Year to date' },
  { key: 'last_fy', label: 'Last calendar year' },
  { key: 'custom', label: 'Custom range' },
]

const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)

const isoDate = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`

// Quick-pick windows. Calendar-year based (the op anchors fiscal
// windows server-side when no explicit dates are passed; here we pass
// explicit dates so the picker is unambiguous).
function presetRange(
  key: PresetKey,
  now: Date
): { start: string; end: string } {
  const y = now.getFullYear()
  const m = now.getMonth()
  switch (key) {
    case 'this_month':
      return {
        start: isoDate(new Date(y, m, 1)),
        end: isoDate(new Date(y, m + 1, 0)),
      }
    case 'this_quarter': {
      const q = Math.floor(m / 3) * 3
      return {
        start: isoDate(new Date(y, q, 1)),
        end: isoDate(new Date(y, q + 3, 0)),
      }
    }
    case 'ytd':
      return { start: isoDate(new Date(y, 0, 1)), end: isoDate(now) }
    case 'last_fy':
      return {
        start: isoDate(new Date(y - 1, 0, 1)),
        end: isoDate(new Date(y - 1, 11, 31)),
      }
    default:
      return { start: '', end: '' }
  }
}

const LiveStatementsContent: FC = function () {
  const { state: graphState } = useGraphContext()
  const currentGraph = useMemo(
    () =>
      graphState.graphs
        .filter(GraphFilters.roboledger)
        .find((g) => g.graphId === graphState.currentGraphId),
    [graphState.graphs, graphState.currentGraphId]
  )

  const [statementType, setStatementType] =
    useState<StatementType>('balance_sheet')
  const [preset, setPreset] = useState<PresetKey>('ytd')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [statement, setStatement] = useState<LiveStatement | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Bumped per load; a stale in-flight response (seq !== current) is
  // discarded, so rapidly cycling statement/period filters can't let an
  // earlier request overwrite a later one.
  const loadSeq = useRef(0)

  const load = useCallback(async () => {
    if (!currentGraph) {
      setStatement(null)
      return
    }
    // Resolve the window at call time so presets ("YTD", "This month")
    // reflect the current date on a long-open tab and Refresh re-reads it.
    const range =
      preset === 'custom'
        ? { start: customStart, end: customEnd }
        : presetRange(preset, new Date())
    // Wait for both ends of a custom range before rendering.
    if (!range.start || !range.end) {
      setStatement(null)
      return
    }
    const seq = ++loadSeq.current
    try {
      setIsLoading(true)
      setError(null)
      const result = (await clients.ledger.liveFinancialStatement(
        currentGraph.graphId,
        {
          statement_type: statementType,
          period_start: range.start,
          period_end: range.end,
        }
      )) as unknown as LiveStatement
      if (seq !== loadSeq.current) return // superseded by a newer load
      setStatement(result && Array.isArray(result.periods) ? result : null)
    } catch (err) {
      if (seq !== loadSeq.current) return
      console.error('Error loading live statement:', err)
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to render the statement. Please try again.'
      )
      setStatement(null)
    } finally {
      if (seq === loadSeq.current) setIsLoading(false)
    }
  }, [currentGraph, statementType, preset, customStart, customEnd])

  useEffect(() => {
    load()
  }, [load])

  return (
    <PageLayout>
      <PageHeader
        icon={TbReportMoney}
        title="Live Statements"
        subtitle="Render BS / IS / CF from the current ledger — no close required"
      />

      {/* Live, ephemeral render — make it unmistakable this is not a filing. */}
      <Alert color="info">
        <span className="font-medium">Live render.</span> Reflects the current
        ledger state, including un-closed activity. Nothing is saved — this is
        not a filed statement. File from{' '}
        <Link href="/reports/new" className="font-medium underline">
          Reports
        </Link>
        .
      </Alert>

      {/* Controls */}
      <Card>
        <div className="flex flex-wrap items-end gap-4 p-4">
          {/* Statement type */}
          <div className="flex flex-wrap gap-2">
            {STATEMENT_TYPES.map((s) => (
              <Button
                key={s.key}
                size="sm"
                color={statementType === s.key ? 'primary' : 'gray'}
                onClick={() => setStatementType(s.key)}
              >
                {s.label}
              </Button>
            ))}
          </div>

          {/* Period preset */}
          <div className="w-full sm:w-56">
            <label
              htmlFor="period-preset"
              className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400"
            >
              Period
            </label>
            <Select
              id="period-preset"
              sizing="sm"
              value={preset}
              onChange={(e) => setPreset(e.target.value as PresetKey)}
            >
              {PRESETS.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.label}
                </option>
              ))}
            </Select>
          </div>

          {/* Custom range */}
          {preset === 'custom' && (
            <div className="flex items-end gap-2">
              <div>
                <label
                  htmlFor="custom-start"
                  className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400"
                >
                  Start
                </label>
                <TextInput
                  id="custom-start"
                  type="date"
                  sizing="sm"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                />
              </div>
              <div>
                <label
                  htmlFor="custom-end"
                  className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400"
                >
                  End
                </label>
                <TextInput
                  id="custom-end"
                  type="date"
                  sizing="sm"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                />
              </div>
            </div>
          )}

          <Button
            size="sm"
            color="gray"
            onClick={() => load()}
            disabled={isLoading}
          >
            <HiRefresh className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </Card>

      {error && (
        <Alert color="failure">
          <HiExclamationCircle className="h-4 w-4" />
          <span className="font-medium">Error!</span> {error}
        </Alert>
      )}

      <Card>
        <div className="overflow-x-auto">
          {isLoading ? (
            <LoadingState />
          ) : !statement || statement.facts.length === 0 ? (
            <EmptyState
              icon={TbReportMoney}
              title="No data for this statement"
              description={
                preset === 'custom' && (!customStart || !customEnd)
                  ? 'Pick a start and end date to render.'
                  : 'No ledger activity falls in the selected period.'
              }
            />
          ) : (
            <LiveStatementTable statement={statement} />
          )}
        </div>

        {!isLoading && statement && statement.facts.length > 0 && (
          <div className="border-t border-gray-200 p-4 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
            {statement.fact_count} concept
            {statement.fact_count === 1 ? '' : 's'}
            {statement.unmapped_count > 0 &&
              ` • ${statement.unmapped_count} unmapped CoA element${
                statement.unmapped_count === 1 ? '' : 's'
              } not included`}
            {statement.truncated && ' • results truncated — narrow the period'}
          </div>
        )}
      </Card>
    </PageLayout>
  )
}

function LiveStatementTable({ statement }: { statement: LiveStatement }) {
  return (
    <Table>
      <TableHead>
        <TableHeadCell>Concept</TableHeadCell>
        {statement.periods.map((p) => (
          <TableHeadCell key={p.label} className="text-right">
            {p.label}
          </TableHeadCell>
        ))}
      </TableHead>
      <TableBody>
        {statement.facts.map((row, ri) => (
          <TableRow
            key={`${row.qname}-${ri}`}
            className={row.is_subtotal ? 'font-semibold' : undefined}
          >
            <TableCell
              className="text-gray-900 dark:text-white"
              style={{ paddingLeft: `${0.75 + row.depth * 1.25}rem` }}
            >
              {row.name}
            </TableCell>
            {row.values.map((v, vi) => (
              <TableCell
                key={vi}
                className="text-right font-mono text-gray-900 dark:text-white"
              >
                {v === null || v === undefined ? '—' : formatCurrency(v)}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export default LiveStatementsContent
