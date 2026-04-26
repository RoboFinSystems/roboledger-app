'use client'

import { clients, customTheme } from '@/lib/core'
import type { PeriodSpecInput } from '@robosystems/client/clients'
import { Button, Spinner } from 'flowbite-react'
import type { FC } from 'react'
import { useCallback, useEffect, useState } from 'react'
import { HiExclamationCircle } from 'react-icons/hi'
import BlockView from './blockview/BlockView'
import type { EnvelopeBlock } from './blockview/types'
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
      // Assumes Jan–Dec fiscal year. Non-standard fiscal years will need
      // a user-configurable fiscal year end setting in the future.
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
  structureId: string
  viewMode: ViewMode
  entityName: string | null
  /**
   * Mapping id used to regenerate reports for a different period via the
   * preset bar. When omitted the preset bar is hidden — the panel still
   * renders the latest envelope facts.
   */
  mappingId?: string | null
}

/**
 * Thin orchestration shell around the statement envelope. Owns the
 * envelope fetch + period-preset regeneration; delegates all rendering
 * to `BlockView`, which dispatches to the statement `Rendering`
 * projection (or the uniform `FactTable` projection in facts mode).
 *
 * Period presets call `createReport` to produce a new FactSet for the
 * requested range; the envelope is then refetched and naturally picks
 * up the latest FactSet for this Structure.
 */
const StatementPanel: FC<StatementPanelProps> = ({
  graphId,
  structureId,
  viewMode,
  entityName,
  mappingId,
}) => {
  const [envelope, setEnvelope] = useState<EnvelopeBlock | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedPreset, setSelectedPreset] = useState<PresetKey | null>(null)

  const loadEnvelope = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const block = await clients.ledger.getInformationBlock(
        graphId,
        structureId
      )
      setEnvelope(block ?? null)
    } catch (err) {
      console.error('Error loading statement envelope:', err)
      setError('Failed to load statement.')
    } finally {
      setIsLoading(false)
    }
  }, [graphId, structureId])

  useEffect(() => {
    loadEnvelope()
  }, [loadEnvelope])

  const handlePresetClick = useCallback(
    async (preset: PresetKey) => {
      if (!mappingId) return

      try {
        setIsRegenerating(true)
        setSelectedPreset(preset)
        setError(null)

        const { periodStart, periodEnd, comparative, periods } =
          buildPeriods(preset)

        const reportName = envelope?.displayName ?? envelope?.name ?? 'Report'
        await clients.reports.createReport(graphId, {
          name: `${reportName} — ${preset.replace(/_/g, ' ')}`,
          mappingId,
          periodStart,
          periodEnd,
          comparative,
          periods,
        })

        // createReport synchronously persists a new FactSet for this
        // Structure; refetching the envelope picks it up as the latest.
        await loadEnvelope()
      } catch (err) {
        console.error('Error regenerating report:', err)
        setError('Failed to regenerate report with new period.')
      } finally {
        setIsRegenerating(false)
      }
    },
    [graphId, mappingId, envelope, loadEnvelope]
  )

  if (isLoading && !isRegenerating) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error && !envelope) {
    return (
      <div className="flex items-center gap-2 py-8 text-red-500">
        <HiExclamationCircle className="h-5 w-5" />
        <span>{error}</span>
      </div>
    )
  }

  if (!envelope) {
    return (
      <div className="py-12 text-center text-gray-500 dark:text-gray-400">
        No data available for this structure.
      </div>
    )
  }

  return (
    <>
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
        <BlockView
          envelope={envelope}
          viewMode={viewMode}
          entityName={entityName}
        />
      )}
    </>
  )
}

export default StatementPanel
