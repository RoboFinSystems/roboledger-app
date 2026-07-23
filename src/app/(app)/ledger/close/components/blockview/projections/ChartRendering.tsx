'use client'

import {
  joinChartSeries,
  TimeSeriesChart,
} from '@robosystems/report-components'
import type { FC } from 'react'
import { useMemo } from 'react'
import { formatDate } from '../../../utils'
import PeriodWindowControl from '../PeriodWindowControl'
import type { EnvelopeBlock, EnvelopeChartPanel } from '../types'
import {
  sliceRendering,
  usePeriodWindow,
  windowStartIndex,
} from '../usePeriodWindow'

interface ChartRenderingProjectionProps {
  envelope: EnvelopeBlock
  entityName?: string | null
}

/**
 * Chart View projection — the server's `view.chart` arm rendered as one
 * SVG line panel per metric format family (monetary / ratios / …). The
 * chart carries config only; values join the sibling `view.rendering` rows
 * by element id (`joinChartSeries`), and the shared period-window control
 * scopes the x-axis. Blocks without a chart arm (statements, schedules,
 * disclosures) fall through to an empty state — chart is a metric affordance.
 */
const ChartRenderingProjection: FC<ChartRenderingProjectionProps> = ({
  envelope,
  entityName,
}) => {
  const chart = envelope.view.chart
  const rendering = envelope.view.rendering
  const { window, setWindow } = usePeriodWindow('all')

  const totalPeriods = rendering?.periods.length ?? 0
  const start = windowStartIndex(totalPeriods, window)
  const windowed = useMemo(
    () => (rendering ? sliceRendering(rendering, start) : null),
    [rendering, start]
  )

  if (!chart || chart.panels.length === 0 || windowed === null) {
    return (
      <div className="py-12 text-center text-gray-500 dark:text-gray-400">
        No chart available for this block.
      </div>
    )
  }

  if (windowed.periods.length === 0) {
    return (
      <div className="py-12 text-center text-gray-500 dark:text-gray-400">
        No computed periods yet. Compute a period to start the series.
      </div>
    )
  }

  const lastIdx = windowed.periods.length - 1

  return (
    <div>
      {/* Header — entity + block + period span */}
      <div className="border-b border-gray-200 py-4 text-center dark:border-gray-700">
        {entityName && (
          <p className="text-sm font-bold tracking-widest text-gray-900 uppercase dark:text-white">
            {entityName}
          </p>
        )}
        <p className="mt-1 text-sm font-semibold text-gray-700 dark:text-gray-300">
          {envelope.displayName ?? envelope.name}
        </p>
        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
          {windowed.periods.length === 1
            ? `As of ${formatDate(windowed.periods[0].end)}`
            : `${windowed.periods.length} periods · ${formatDate(windowed.periods[0].end)} — ${formatDate(windowed.periods[lastIdx].end)}`}
        </p>
      </div>

      {totalPeriods > 3 && (
        <div className="flex justify-end py-3">
          <PeriodWindowControl window={window} onChange={setWindow} />
        </div>
      )}

      <div className="space-y-8 py-2">
        {chart.panels.map((panel: EnvelopeChartPanel, idx: number) => {
          const series = joinChartSeries(panel, windowed)
          if (series.length === 0) return null
          return (
            <TimeSeriesChart
              key={panel.itemType ?? panel.label ?? idx}
              series={series}
              itemType={panel.itemType}
              title={panel.label ?? undefined}
            />
          )
        })}
      </div>
    </div>
  )
}

export default ChartRenderingProjection
