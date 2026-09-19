'use client'

import FoldControls from '@/components/FoldControls'
import FoldLabel from '@/components/FoldLabel'
import ValidationBanner from '@/components/ValidationBanner'
import { withoutTaxonomy } from '@/lib/ledger/blockName'
import { useRowFold } from '@/lib/ledger/rowFold'
import type { FC } from 'react'
import { formatCurrency, formatDate } from '../../../utils'
import PeriodWindowControl from '../PeriodWindowControl'
import {
  columnLabel,
  columnTitle,
  GRID_HEAD_CELL,
  GRID_HEAD_ROW,
  GRID_LABEL_CELL,
  GRID_LABEL_HEAD,
  GRID_LABEL_TEXT,
  GRID_ROW,
  GRID_SCROLLER,
  GRID_TABLE,
  GRID_VALUE_CELL,
  rowBackground,
  seamClasses,
} from '../seriesGrid'
import type {
  EnvelopeBlock,
  EnvelopeRendering,
  EnvelopeRenderingPeriod,
  EnvelopeRenderingRow,
} from '../types'
import {
  defaultTableWindow,
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
  const totalPeriods = rendering.periods.length
  const { window, setWindow } = usePeriodWindow(
    defaultTableWindow(totalPeriods)
  )

  // Series reads make statements wide (one column per close-stamped
  // month, plus a scenario's forward months) — the same trailing-window
  // control the metric table uses keeps the recent columns (and the
  // actuals/forecast seam) in view instead of appended off-screen.
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

  const columnClasses = seamClasses(periods)

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
          {withoutTaxonomy(envelope.name, envelope)}
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

      <div className={GRID_SCROLLER}>
        <table className={GRID_TABLE} data-testid="statement-grid">
          <thead>
            <tr className={GRID_HEAD_ROW}>
              <th className={GRID_LABEL_HEAD}>
                <span className="sr-only">Line item</span>
              </th>
              {periods.map((period: EnvelopeRenderingPeriod, i: number) => (
                <th
                  key={i}
                  className={`${GRID_HEAD_CELL} ${columnClasses(i)}`}
                  title={columnTitle(period, instant)}
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

              const bg = rowBackground(isBold)

              return (
                <tr
                  key={`${row.elementId}-${index}`}
                  className={`${GRID_ROW} ${bg.row}`}
                >
                  <td
                    style={{ paddingLeft: `${indent + 16}px` }}
                    className={`${GRID_LABEL_CELL} ${bg.label} ${
                      isBold
                        ? 'font-semibold text-gray-900 dark:text-white'
                        : 'text-gray-700 dark:text-gray-300'
                    } ${allZero && !isBold ? 'text-gray-400 dark:text-gray-500' : ''} ${
                      canFold ? 'cursor-pointer' : ''
                    }`}
                    title={row.elementQname || undefined}
                    onClick={canFold ? () => fold.toggle(index) : undefined}
                  >
                    <div className={GRID_LABEL_TEXT}>
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
                      className={`${GRID_VALUE_CELL} ${
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
