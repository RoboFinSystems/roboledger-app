'use client'

import FoldControls from '@/components/FoldControls'
import FoldLabel from '@/components/FoldLabel'
import ValidationBanner from '@/components/ValidationBanner'
import { useRowFold } from '@/lib/ledger/rowFold'
import type { FC } from 'react'
import { formatCurrency, formatDate, formatMonth } from '../../../utils'
import PeriodWindowControl from '../PeriodWindowControl'
import type {
  EnvelopeBlock,
  EnvelopeRendering,
  EnvelopeRenderingPeriod,
  EnvelopeRenderingRow,
} from '../types'
import {
  sliceRendering,
  usePeriodWindow,
  windowStartIndex,
} from '../usePeriodWindow'

interface StatementRenderingProjectionProps {
  envelope: EnvelopeBlock
  entityName?: string | null
}

/**
 * Charlie's `Rendering` View projection — statement-family variant.
 *
 * Consumes the server-computed `envelope.view.rendering` (rows +
 * periods + validation). All rollup, subtotal, and depth computation
 * happened on the server during `_build_statement_envelope`; this
 * component is a pure presentation of that pre-computed grid.
 *
 * Replaces the legacy StatementTable + getStatement(reportId, type)
 * fetch path. The validation banner is the shared `ValidationBanner`
 * (three states — an unchecked statement of equity renders neutral, not
 * green).
 */
const StatementRenderingProjection: FC<StatementRenderingProjectionProps> = ({
  envelope,
  entityName,
}) => {
  const rendering = envelope.view.rendering

  if (rendering === null) {
    return (
      <div className="py-12 text-center text-gray-500 dark:text-gray-400">
        No rendering available for this block.
      </div>
    )
  }

  if (rendering.rows.length === 0) {
    return (
      <div className="py-12 text-center text-gray-500 dark:text-gray-400">
        No data available for this structure.
      </div>
    )
  }

  return (
    <>
      <StatementGrid
        envelope={envelope}
        rendering={rendering}
        entityName={entityName}
      />
      {rendering.validation && (
        <ValidationBanner validation={rendering.validation} />
      )}
      {rendering.unmappedCount > 0 && (
        <div className="mt-2 text-sm text-gray-500">
          {rendering.unmappedCount} unmapped CoA element
          {rendering.unmappedCount !== 1 ? 's' : ''} not included in report
        </div>
      )}
    </>
  )
}

// ── Column headers ───────────────────────────────────────────────────

const isMonthEnd = (iso: string): boolean => {
  const next = new Date(`${iso}T00:00:00Z`)
  next.setUTCDate(next.getUTCDate() + 1)
  return next.getUTCDate() === 1
}

/** One calendar month — as a window (1st → last) or as its closing instant. */
const isCalendarMonth = (period: EnvelopeRenderingPeriod): boolean =>
  !!period.start &&
  !!period.end &&
  period.start.slice(0, 7) === period.end.slice(0, 7) &&
  (period.start === period.end || period.start.endsWith('-01')) &&
  isMonthEnd(period.end)

const periodRange = (
  period: EnvelopeRenderingPeriod,
  instant: boolean
): string =>
  instant || period.start === period.end
    ? `As of ${formatDate(period.end)}`
    : `${formatDate(period.start)} — ${formatDate(period.end)}`

/**
 * Actuals arrive with an empty label (only a scenario's forward months are
 * labelled server-side), and a monthly series spelling out "Jul 1, 2024 —
 * Jul 31, 2024" twenty-five times is most of the table's width. A calendar
 * month says "Jul 2024"; the full window stays on the header's tooltip.
 * " (forecast)" is dropped from server labels — the `f` marker and the seam
 * tint already say it, as on the Plan grid.
 */
const columnLabel = (
  period: EnvelopeRenderingPeriod,
  instant: boolean
): string => {
  if (period.label) return period.label.replace(' (forecast)', '')
  return isCalendarMonth(period)
    ? formatMonth(period.end)
    : periodRange(period, instant)
}

// ── Statement grid ───────────────────────────────────────────────────

interface StatementGridProps {
  envelope: EnvelopeBlock
  rendering: EnvelopeRendering
  entityName?: string | null
}

const rowKey = (row: EnvelopeRenderingRow): string =>
  row.elementQname || row.elementId

const StatementGrid: FC<StatementGridProps> = ({
  envelope,
  rendering,
  entityName,
}) => {
  const { window, setWindow } = usePeriodWindow('all')

  // Series reads make statements wide (one column per close-stamped
  // month, plus a scenario's forward months) — the same trailing-window
  // control the metric table uses keeps the recent columns (and the
  // actuals/forecast seam) in view instead of appended off-screen.
  const totalPeriods = rendering.periods.length
  const windowed = sliceRendering(
    rendering,
    windowStartIndex(totalPeriods, window)
  )
  const { rows, periods } = windowed

  // Folded over the unsliced rows: the section structure doesn't depend on
  // the column window, and `rendering.rows` keeps its identity across renders
  // where a slice is rebuilt each time.
  const fold = useRowFold(rendering.rows, rowKey)
  const canFoldAny = fold.canExpand || fold.canCollapse

  const instant = envelope.blockType === 'balance_sheet'

  // Seam styling keyed off the machine-readable flag (never the label):
  // tinted forecast columns + a border on the first one. Absent on
  // actuals-only reads, so single-set statements render exactly as
  // before.
  const firstForecast = periods.findIndex((p) => p.forecast)
  const columnClasses = (index: number): string => {
    const tint = periods[index].forecast
      ? 'bg-primary-50/60 dark:bg-primary-900/25'
      : ''
    const seam =
      index === firstForecast && firstForecast > 0
        ? 'border-l-2 border-primary-300 dark:border-primary-500/60'
        : ''
    return `${tint} ${seam}`.trim()
  }

  return (
    <div>
      {/* Formal financial statement header. It and the toolbar sit OUTSIDE
          the scroller — inside it they scrolled away with the columns. */}
      <div className="border-b border-gray-200 py-4 text-center dark:border-gray-700">
        {entityName && (
          <p className="text-sm font-bold tracking-widest text-gray-900 uppercase dark:text-white">
            {entityName}
          </p>
        )}
        <p className="mt-1 text-sm font-semibold text-gray-700 dark:text-gray-300">
          {envelope.name}
        </p>
        {periods.length > 0 && periods[0].start && (
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            {periods.length === 1
              ? `For the Period Ended ${formatDate(periods[0].end)}`
              : `${formatDate(periods[0].start)} — ${formatDate(periods[periods.length - 1].end)}`}
          </p>
        )}
      </div>

      {(canFoldAny || totalPeriods > 3) && (
        <div className="flex items-center gap-3 py-3">
          {canFoldAny && <FoldControls fold={fold} />}
          {totalPeriods > 3 && (
            <div className="ml-auto">
              <PeriodWindowControl window={window} onChange={setWindow} />
            </div>
          )}
        </div>
      )}

      {/* A raw table, as on the Plan grid: flowbite's Table paints its body
          on a `w-full` layer that is only as wide as the viewport, so a wide
          series scrolled onto bare background past the first screen. Every
          row carries its own background, and the label column is sticky with
          an OPAQUE one so scrolled values pass underneath it. */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="w-full text-sm" data-testid="statement-grid">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
              <th className="sticky left-0 z-10 bg-gray-50 px-4 py-2 text-left dark:bg-gray-800">
                <span className="sr-only">Line item</span>
              </th>
              {periods.map((period: EnvelopeRenderingPeriod, i: number) => (
                <th
                  key={i}
                  className={`px-4 py-2 text-right font-semibold whitespace-nowrap text-gray-600 dark:text-gray-300 ${columnClasses(i)}`}
                  title={`${period.forecast ? 'Forecast' : 'Actual'} · ${periodRange(period, instant)}`}
                >
                  {columnLabel(period, instant)}
                  {period.forecast && (
                    <span className="text-primary-500 dark:text-primary-400 ml-1 align-super text-[9px] font-normal uppercase">
                      f
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {fold.visible.map((index) => {
              const row = rows[index]
              const indent = row.depth * 24
              const isBold = row.isSubtotal
              const isTopLevel = row.isSubtotal && row.depth === 0
              const allZero = row.values.every((v) => (v ?? 0) === 0)
              const canFold = fold.isFoldable(index)

              // The sticky label cell repeats the row's background (opaque,
              // and via `group-hover` so it tracks the row's hover).
              const rowBg = isBold
                ? 'bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700'
                : 'bg-white hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800'
              const labelBg = isBold
                ? 'bg-gray-50 group-hover:bg-gray-100 dark:bg-gray-800 dark:group-hover:bg-gray-700'
                : 'bg-white group-hover:bg-gray-50 dark:bg-gray-900 dark:group-hover:bg-gray-800'

              return (
                <tr
                  key={`${row.elementId}-${index}`}
                  className={`group border-b border-gray-100 dark:border-gray-700/50 ${rowBg}`}
                >
                  <td
                    style={{ paddingLeft: `${indent + 16}px` }}
                    className={`sticky left-0 z-10 py-2 pr-4 ${labelBg} ${
                      isBold
                        ? 'font-semibold text-gray-900 dark:text-white'
                        : 'text-gray-700 dark:text-gray-300'
                    } ${allZero && !isBold ? 'text-gray-400 dark:text-gray-500' : ''} ${
                      canFold ? 'cursor-pointer' : ''
                    }`}
                    title={row.elementQname || undefined}
                    onClick={canFold ? () => fold.toggle(index) : undefined}
                  >
                    {/* Sized to its content up to a cap: an overflowing table
                        squeezes wrappable text to its narrowest, which broke
                        ordinary line items across three and four lines. This
                        keeps them on one; only a monster wraps, at the cap. */}
                    <div className="w-max max-w-sm">
                      <FoldLabel
                        label={row.elementName}
                        canFold={canFold}
                        folded={fold.isFolded(index)}
                        ownedCount={fold.ownedCount(index)}
                      />
                    </div>
                  </td>
                  {row.values.map((value, i) => (
                    <td
                      key={i}
                      className={`px-4 py-2 text-right font-mono whitespace-nowrap ${
                        isBold
                          ? 'font-semibold text-gray-900 dark:text-white'
                          : 'text-gray-700 dark:text-gray-300'
                      } ${
                        (value ?? 0) === 0 && !isBold
                          ? 'text-gray-400 dark:text-gray-500'
                          : ''
                      } ${isTopLevel ? 'border-b-2 border-double border-gray-400 dark:border-gray-500' : ''} ${columnClasses(i)}`}
                    >
                      {value !== null ? formatCurrency(value) : '—'}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default StatementRenderingProjection
