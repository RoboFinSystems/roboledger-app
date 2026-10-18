'use client'

import {
  FilterActions,
  FilterBar,
  FilterDate,
  FilterField,
  FilterSelect,
} from '@/components/FilterBar'
import RefreshControl from '@/components/RefreshControl'
import SegmentedControl, {
  type SegmentedOption,
} from '@/components/SegmentedControl'
import ValidationBanner from '@/components/ValidationBanner'
import { useEntityScope } from '@/lib/entity-scope'
import { friendlyError, type FriendlyError } from '@/lib/ledger/errors'
import { useLedgerGraph } from '@/lib/useLedgerGraph'
import type {
  ConsolidationWorksheetResponse,
  LiveFinancialStatementResponse,
} from '@robosystems/client/types'
import {
  clients,
  EmptyState,
  LoadingState,
  PageHeader,
  PageLayout,
} from '@robosystems/core'
import { Alert, Card } from 'flowbite-react'
import Link from 'next/link'
import type { FC } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { HiExclamationCircle } from 'react-icons/hi'
import { TbReportMoney } from 'react-icons/tb'
import LiveStatementTable from './components/LiveStatementTable'
import WorksheetTable from './components/WorksheetTable'

// The SDK types this directly now — liveFinancialStatement returns
// LiveFinancialStatementResponse rather than Record<string, unknown>, so the
// hand-maintained mirrors of this shape are gone.
type LiveStatement = LiveFinancialStatementResponse

type StatementType =
  | 'balance_sheet'
  | 'income_statement'
  | 'cash_flow_statement'
  | 'equity_statement'

const STATEMENT_TYPES: readonly SegmentedOption<StatementType>[] = [
  { value: 'balance_sheet', label: 'Balance Sheet' },
  { value: 'income_statement', label: 'Income Statement' },
  { value: 'cash_flow_statement', label: 'Cash Flow' },
  { value: 'equity_statement', label: 'Statement of Equity' },
]

type PresetKey = 'this_month' | 'this_quarter' | 'ytd' | 'last_fy' | 'custom'

type StatementScope = 'entity' | 'combined' | 'consolidated' | 'worksheet'

const SCOPE_OPTIONS: readonly SegmentedOption<StatementScope>[] = [
  { value: 'entity', label: 'This entity' },
  { value: 'combined', label: 'Combined' },
  { value: 'consolidated', label: 'Consolidated' },
  { value: 'worksheet', label: 'Worksheet' },
]

const PRESETS: { key: PresetKey; label: string }[] = [
  { key: 'this_month', label: 'This month' },
  { key: 'this_quarter', label: 'This quarter' },
  { key: 'ytd', label: 'Year to date' },
  { key: 'last_fy', label: 'Last calendar year' },
  { key: 'custom', label: 'Custom range' },
]

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
  const { graph: currentGraph } = useLedgerGraph()
  const { entityId, entities } = useEntityScope()
  // A group statement is the group parent's Reporting Style over its members'
  // books, summed per concept: combined is the members alone, nothing
  // eliminated; consolidated adds the consolidation entity's adjustments; the
  // worksheet lays them out side by side, one column per entity. All three are
  // only offered on the parent of a graph that holds more than one entity.
  const canCombine = entityId === null && entities.length > 1
  const [scope, setScope] = useState<StatementScope>('entity')
  // Back to the entity's own books whenever the entity or the graph changes:
  // two group parents both resolve to a null entity id.
  const graphId = currentGraph?.graphId ?? null
  useEffect(() => {
    setScope('entity')
  }, [entityId, graphId])
  const requestScope: StatementScope = canCombine ? scope : 'entity'
  const grouped = requestScope !== 'entity'
  const asWorksheet = requestScope === 'worksheet'

  const [statementType, setStatementType] =
    useState<StatementType>('balance_sheet')
  const [preset, setPreset] = useState<PresetKey>('ytd')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [statement, setStatement] = useState<LiveStatement | null>(null)
  const [worksheet, setWorksheet] =
    useState<ConsolidationWorksheetResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<FriendlyError | null>(null)
  const [fetchedAt, setFetchedAt] = useState<Date | null>(null)

  // Bumped per load; a stale in-flight response (seq !== current) is
  // discarded, so rapidly cycling statement/period filters can't let an
  // earlier request overwrite a later one.
  const loadSeq = useRef(0)

  const load = useCallback(async () => {
    if (!currentGraph) {
      setStatement(null)
      setWorksheet(null)
      setFetchedAt(null)
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
      setWorksheet(null)
      return
    }
    const seq = ++loadSeq.current
    try {
      setIsLoading(true)
      setError(null)
      if (requestScope === 'worksheet') {
        const sheet = await clients.ledger.consolidationWorksheet(
          currentGraph.graphId,
          {
            statement_type: statementType,
            period_start: range.start,
            period_end: range.end,
          }
        )
        if (seq !== loadSeq.current) return // superseded by a newer load
        setWorksheet(Array.isArray(sheet?.columns) ? sheet : null)
        setStatement(null)
        setFetchedAt(new Date())
        return
      }
      const result = await clients.ledger.liveFinancialStatement(
        currentGraph.graphId,
        {
          entity_id: entityId,
          statement_type: statementType,
          period_start: range.start,
          period_end: range.end,
          scope: requestScope,
        }
      )
      if (seq !== loadSeq.current) return // superseded by a newer load
      setWorksheet(null)
      // The SDK now throws on an empty envelope rather than resolving `{}`, so a
      // missing result surfaces through the catch below instead of rendering as
      // "no data". The periods check stays as a shape guard.
      setStatement(Array.isArray(result?.periods) ? result : null)
      setFetchedAt(new Date())
    } catch (err) {
      if (seq !== loadSeq.current) return
      console.error('Error loading live statement:', err)
      // The SDK throws `"<label> failed: " + JSON.stringify(error)`, so the
      // raw message is a `{"detail": …}` blob — never show that.
      setError(
        friendlyError(
          err instanceof Error
            ? err.message
            : 'Failed to render the statement. Please try again.'
        )
      )
      setStatement(null)
      setWorksheet(null)
    } finally {
      if (seq === loadSeq.current) setIsLoading(false)
    }
  }, [
    currentGraph,
    entityId,
    requestScope,
    statementType,
    preset,
    customStart,
    customEnd,
  ])

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
      <FilterBar>
        <FilterField label="Statement">
          <SegmentedControl
            options={STATEMENT_TYPES}
            value={statementType}
            onChange={setStatementType}
            ariaLabel="Statement"
          />
        </FilterField>
        {canCombine && (
          <FilterField label="Scope">
            <SegmentedControl
              options={SCOPE_OPTIONS}
              value={scope}
              onChange={setScope}
              ariaLabel="Scope"
            />
          </FilterField>
        )}
        <FilterSelect
          id="period-preset"
          label="Period"
          value={preset}
          onChange={(value) => setPreset(value as PresetKey)}
          className="sm:w-48"
        >
          {PRESETS.map((p) => (
            <option key={p.key} value={p.key}>
              {p.label}
            </option>
          ))}
        </FilterSelect>
        {preset === 'custom' && (
          <>
            <FilterDate
              id="custom-start"
              label="Start date"
              value={customStart}
              onChange={setCustomStart}
            />
            <FilterDate
              id="custom-end"
              label="End date"
              value={customEnd}
              onChange={setCustomEnd}
            />
          </>
        )}
        <FilterActions>
          <RefreshControl
            onRefresh={() => void load()}
            isRefreshing={isLoading}
            fetchedAt={fetchedAt}
            disabled={!currentGraph}
          />
        </FilterActions>
      </FilterBar>

      {error && (
        <Alert color="failure">
          <HiExclamationCircle className="h-4 w-4" />
          <span className="font-medium">Error!</span> {error.message}
          {error.link && (
            <>
              {' '}
              <Link href={error.link.href} className="font-medium underline">
                {error.link.label}
              </Link>
            </>
          )}
        </Alert>
      )}

      {asWorksheet ? (
        <Card>
          <div className="relative overflow-x-auto">
            {isLoading && worksheet && (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded bg-white/60 dark:bg-gray-900/60">
                <LoadingState size="lg" />
              </div>
            )}
            {isLoading && !worksheet ? (
              <LoadingState />
            ) : !worksheet || worksheet.rows.length === 0 ? (
              <EmptyState
                icon={TbReportMoney}
                title="No data for this statement"
                description="No ledger activity falls in the selected period."
              />
            ) : (
              <WorksheetTable worksheet={worksheet} />
            )}
          </div>
          {!isLoading && worksheet && worksheet.rows.length > 0 && (
            <div className="border-t border-gray-200 p-4 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
              {worksheet.validation && (
                <ValidationBanner
                  validation={worksheet.validation}
                  className="mb-3"
                />
              )}
              {worksheet.period.start} to {worksheet.period.end} • the checks
              ran on the consolidated column
              {worksheet.columns.some((c) => c.kind === 'not_summed') &&
                ' • equity-method and cost members are shown beside the sum, not in it'}
              {worksheet.unmapped_entity_ids &&
                worksheet.unmapped_entity_ids.length > 0 &&
                ` • ${worksheet.unmapped_entity_ids.length} ${
                  worksheet.unmapped_entity_ids.length === 1
                    ? 'entity has'
                    : 'entities have'
                } no mapping yet and no column`}
              {worksheet.truncated && ' • results truncated'}
            </div>
          )}
        </Card>
      ) : (
        <Card>
          <div className="relative overflow-x-auto">
            {isLoading && statement && (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded bg-white/60 dark:bg-gray-900/60">
                <LoadingState size="lg" />
              </div>
            )}
            {isLoading && !statement ? (
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
              {/* Guard rails ran on exactly the rendered columns — a plug that
                foots the cash flow by construction, or a column that does
                not balance, is reported here rather than hidden. */}
              {statement.validation && (
                <ValidationBanner
                  validation={statement.validation}
                  className="mb-3"
                />
              )}
              {statement.fact_count} concept
              {statement.fact_count === 1 ? '' : 's'}
              {statement.unmapped_count > 0 &&
                ` • ${statement.unmapped_count} unmapped CoA element${
                  statement.unmapped_count === 1 ? '' : 's'
                } not included`}
              {statement.truncated &&
                ' • results truncated — narrow the period'}
              {grouped &&
                statement.combined_entity_ids &&
                ` • ${requestScope} across ${statement.combined_entity_ids.length} ${
                  statement.combined_entity_ids.length === 1
                    ? 'entity'
                    : 'entities'
                }${
                  requestScope === 'consolidated'
                    ? ", the consolidation entity's adjustments in"
                    : ', nothing eliminated'
                }`}
            </div>
          )}
        </Card>
      )}
    </PageLayout>
  )
}

export default LiveStatementsContent
