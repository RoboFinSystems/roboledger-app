'use client'

import { customTheme, extensions } from '@/lib/core'
import type {
  PeriodSpecInput,
  StatementData,
} from '@robosystems/client/extensions'
import { Badge, Button, Spinner } from 'flowbite-react'
import type { FC } from 'react'
import { useCallback, useEffect, useState } from 'react'
import { HiCheckCircle, HiExclamationCircle } from 'react-icons/hi'
import type { FactRow } from './FactsTable'
import FactsTable from './FactsTable'
import StatementTable from './StatementTable'
import type { ViewMode } from './ViewModeToggle'

// ── Period Presets ────────────────────────────────────────────────────

type PresetKey =
  | 'this_month'
  | 'last_month'
  | 'monthly_ytd'
  | 'trailing_12'
  | 'this_quarter'
  | 'annual_yoy'

interface PresetDef {
  key: PresetKey
  label: string
}

const PRESETS: PresetDef[] = [
  { key: 'this_month', label: 'This Month' },
  { key: 'last_month', label: 'Last Month' },
  { key: 'monthly_ytd', label: 'Monthly YTD' },
  { key: 'trailing_12', label: 'Trailing 12' },
  { key: 'this_quarter', label: 'This Quarter' },
  { key: 'annual_yoy', label: 'Year / Year' },
]

const pad = (n: number): string => String(n).padStart(2, '0')
const lastDay = (y: number, m: number): number =>
  new Date(y, m + 1, 0).getDate()
const monthLabel = (y: number, m: number): string =>
  new Date(y, m, 1).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  })

function buildPeriods(preset: PresetKey): {
  periodStart: string
  periodEnd: string
  comparative: boolean
  periods: PeriodSpecInput[] | undefined
} {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()

  switch (preset) {
    case 'this_month': {
      const s = `${year}-${pad(month + 1)}-01`
      const e = `${year}-${pad(month + 1)}-${lastDay(year, month)}`
      return {
        periodStart: s,
        periodEnd: e,
        comparative: false,
        periods: undefined,
      }
    }
    case 'last_month': {
      const pm = month === 0 ? 11 : month - 1
      const py = month === 0 ? year - 1 : year
      const s = `${py}-${pad(pm + 1)}-01`
      const e = `${py}-${pad(pm + 1)}-${lastDay(py, pm)}`
      return {
        periodStart: s,
        periodEnd: e,
        comparative: true,
        periods: undefined,
      }
    }
    case 'monthly_ytd': {
      const periods: PeriodSpecInput[] = []
      for (let m = 0; m <= month; m++) {
        periods.push({
          start: `${year}-${pad(m + 1)}-01`,
          end: `${year}-${pad(m + 1)}-${lastDay(year, m)}`,
          label: monthLabel(year, m),
        })
      }
      return {
        periodStart: periods[0].start,
        periodEnd: periods[periods.length - 1].end,
        comparative: false,
        periods,
      }
    }
    case 'trailing_12': {
      const periods: PeriodSpecInput[] = []
      for (let i = 11; i >= 0; i--) {
        const d = new Date(year, month - i, 1)
        const y = d.getFullYear()
        const m = d.getMonth()
        periods.push({
          start: `${y}-${pad(m + 1)}-01`,
          end: `${y}-${pad(m + 1)}-${lastDay(y, m)}`,
          label: monthLabel(y, m),
        })
      }
      return {
        periodStart: periods[0].start,
        periodEnd: periods[periods.length - 1].end,
        comparative: false,
        periods,
      }
    }
    case 'this_quarter': {
      const q = Math.floor(month / 3)
      const qs = q * 3
      const s = `${year}-${pad(qs + 1)}-01`
      const e = `${year}-${pad(qs + 3)}-${lastDay(year, qs + 2)}`
      return {
        periodStart: s,
        periodEnd: e,
        comparative: false,
        periods: undefined,
      }
    }
    case 'annual_yoy': {
      const periods: PeriodSpecInput[] = [
        { start: `${year}-01-01`, end: `${year}-12-31`, label: `FY ${year}` },
        {
          start: `${year - 1}-01-01`,
          end: `${year - 1}-12-31`,
          label: `FY ${year - 1}`,
        },
      ]
      return {
        periodStart: periods[0].start,
        periodEnd: periods[0].end,
        comparative: false,
        periods,
      }
    }
  }
}

// ── Component ────────────────────────────────────────────────────────

interface StatementPanelProps {
  graphId: string
  reportId: string
  structureType: string
  viewMode: ViewMode
  entityName: string | null
  mappingId?: string | null
}

const StatementPanel: FC<StatementPanelProps> = ({
  graphId,
  reportId,
  structureType,
  viewMode,
  entityName,
  mappingId,
}) => {
  const [statement, setStatement] = useState<StatementData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeReportId, setActiveReportId] = useState(reportId)
  const [selectedPreset, setSelectedPreset] = useState<PresetKey | null>(null)

  const loadStatement = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await extensions.reports.statement(
        graphId,
        activeReportId,
        structureType
      )
      setStatement(data)
    } catch (err) {
      console.error('Error loading statement:', err)
      setError('Failed to load statement.')
    } finally {
      setIsLoading(false)
    }
  }, [graphId, activeReportId, structureType])

  useEffect(() => {
    setActiveReportId(reportId)
  }, [reportId])

  useEffect(() => {
    loadStatement()
  }, [loadStatement])

  // Regenerate report with a different period preset
  const handlePresetClick = useCallback(
    async (preset: PresetKey) => {
      if (!mappingId) return

      try {
        setIsRegenerating(true)
        setSelectedPreset(preset)
        setError(null)

        const { periodStart, periodEnd, comparative, periods } =
          buildPeriods(preset)

        const report = await extensions.reports.create(graphId, {
          name: `${structureType === 'income_statement' ? 'Income Statement' : 'Balance Sheet'} — ${preset.replace(/_/g, ' ')}`,
          mappingId,
          periodStart,
          periodEnd,
          comparative,
          periods,
        })

        setActiveReportId(report.id)
      } catch (err) {
        console.error('Error regenerating report:', err)
        setError('Failed to regenerate report with new period.')
      } finally {
        setIsRegenerating(false)
      }
    },
    [graphId, mappingId, structureType]
  )

  if (isLoading && !isRegenerating) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error && !statement) {
    return (
      <div className="flex items-center gap-2 py-8 text-red-500">
        <HiExclamationCircle className="h-5 w-5" />
        <span>{error}</span>
      </div>
    )
  }

  if (!statement || statement.rows.length === 0) {
    return (
      <div className="py-12 text-center text-gray-500 dark:text-gray-400">
        No data available for this structure.
      </div>
    )
  }

  // Facts view — project statement rows as flat fact rows
  if (viewMode === 'facts') {
    const facts: FactRow[] = []
    for (const row of statement.rows) {
      for (let i = 0; i < statement.periods.length; i++) {
        const period = statement.periods[i]
        const value = row.values[i]
        if (value !== null && value !== undefined) {
          facts.push({
            elementName: row.elementName,
            elementQname: row.elementQname,
            periodStart: period.start || '',
            periodEnd: period.end || null,
            value,
            unit: 'USD',
          })
        }
      }
    }
    return <FactsTable facts={facts} />
  }

  // Rendered view
  return (
    <>
      {/* Period preset bar */}
      {mappingId && (
        <div className="mb-4 flex flex-wrap items-center gap-2 border-b border-gray-200 pb-3 dark:border-gray-700">
          <span className="mr-1 text-xs font-medium text-gray-400">
            Period:
          </span>
          {PRESETS.map((p) => (
            <Button
              key={p.key}
              theme={customTheme.button}
              size="xs"
              color={selectedPreset === p.key ? 'primary' : 'light'}
              onClick={() => handlePresetClick(p.key)}
              disabled={isRegenerating}
            >
              {isRegenerating && selectedPreset === p.key ? (
                <Spinner size="xs" className="mr-1" />
              ) : null}
              {p.label}
            </Button>
          ))}
        </div>
      )}

      {isRegenerating ? (
        <div className="flex items-center justify-center gap-3 py-12">
          <Spinner size="lg" />
          <span className="text-gray-500 dark:text-gray-400">
            Generating report...
          </span>
        </div>
      ) : (
        <>
          <StatementTable data={statement} entityName={entityName} />

          {/* Validation */}
          {statement.validation && (
            <div className="mt-4 border-t border-gray-200 pt-4 dark:border-gray-700">
              <div className="flex items-center gap-2 text-sm">
                {statement.validation.passed ? (
                  <Badge color="success" size="sm">
                    <HiCheckCircle className="mr-1 inline h-3 w-3" />
                    Validation Passed
                  </Badge>
                ) : (
                  <Badge color="failure" size="sm">
                    <HiExclamationCircle className="mr-1 inline h-3 w-3" />
                    Validation Failed
                  </Badge>
                )}
                {statement.validation.warnings.length > 0 && (
                  <Badge color="warning" size="sm">
                    {statement.validation.warnings.length} warning
                    {statement.validation.warnings.length !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
              {statement.validation.failures.length > 0 && (
                <ul className="mt-2 text-sm text-red-400">
                  {statement.validation.failures.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Unmapped count */}
          {statement.unmappedCount > 0 && (
            <div className="mt-2 text-sm text-gray-500">
              {statement.unmappedCount} unmapped CoA element
              {statement.unmappedCount !== 1 ? 's' : ''} not included in report
            </div>
          )}
        </>
      )}
    </>
  )
}

export default StatementPanel
