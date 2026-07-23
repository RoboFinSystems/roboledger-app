'use client'

import { formatMetricValue } from '@robosystems/report-components'
import type { FC } from 'react'
import type { PlanColumn, PlanModel, PlanRow } from '../planModel'

/**
 * The Plan grid — the workbook's FOP tab as one scrollable table:
 * stacked sections (Assumptions, Income Statement, Balance Sheet, Cash
 * Flow) sharing a master set of monthly columns that cross the
 * actuals/forecast seam. Sticky row-label column + sticky header for
 * wide horizontal scroll; forecast columns are tinted, with a seam
 * border on the first one; per-row formatting by item-type family
 * (lever rows are percent/days, statement rows monetary).
 */

const monthLabel = (column: PlanColumn): string => {
  if (column.label) return column.label.replace(' (forecast)', '')
  const parsed = new Date(`${column.end}T00:00:00`)
  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    year: '2-digit',
  })
}

const cellText = (row: PlanRow, value: number | null): string =>
  value === null || value === undefined
    ? '—'
    : formatMetricValue(row.itemType ?? 'monetary', value)

interface PlanGridProps {
  model: PlanModel
}

const PlanGrid: FC<PlanGridProps> = ({ model }) => {
  const { columns, sections } = model
  const firstForecast = columns.findIndex((c) => c.forecast)

  const columnClasses = (index: number): string => {
    const column = columns[index]
    const tint = column.forecast
      ? 'bg-primary-50/60 dark:bg-primary-900/10'
      : ''
    const seam =
      index === firstForecast && firstForecast > 0
        ? 'border-l-2 border-primary-300 dark:border-primary-700'
        : ''
    return `${tint} ${seam}`.trim()
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
      <table className="w-full text-sm" data-testid="plan-grid">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
            <th className="sticky left-0 z-10 min-w-56 bg-gray-50 px-4 py-2 text-left font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
              Line Item
            </th>
            {columns.map((column, i) => (
              <th
                key={column.end}
                className={`px-3 py-2 text-right font-semibold whitespace-nowrap text-gray-600 dark:text-gray-300 ${columnClasses(i)}`}
                title={column.forecast ? 'Forecast' : 'Actual'}
              >
                {monthLabel(column)}
                {column.forecast && (
                  <span className="text-primary-500 dark:text-primary-400 ml-1 align-super text-[9px] font-normal uppercase">
                    f
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sections.map((section) => (
            <SectionRows
              key={section.title}
              title={section.title}
              rows={section.rows}
              columns={columns}
              columnClasses={columnClasses}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

const SectionRows: FC<{
  title: string
  rows: PlanRow[]
  columns: PlanColumn[]
  columnClasses: (index: number) => string
}> = ({ title, rows, columns, columnClasses }) => (
  <>
    <tr className="border-y border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800/80">
      <td
        className="sticky left-0 z-10 bg-gray-100 px-4 py-1.5 text-xs font-semibold tracking-wide text-gray-500 uppercase dark:bg-gray-800 dark:text-gray-400"
        data-testid={`plan-section-${title}`}
      >
        {title}
      </td>
      <td colSpan={columns.length} />
    </tr>
    {rows.map((row) => (
      <tr
        key={row.key}
        className={`border-b border-gray-100 dark:border-gray-700/50 ${
          row.isSubtotal ? 'font-semibold' : ''
        }`}
      >
        <td
          className="sticky left-0 z-10 max-w-72 truncate bg-white px-4 py-1.5 text-gray-700 dark:bg-gray-900 dark:text-gray-200"
          style={{ paddingLeft: `${16 + row.depth * 16}px` }}
          title={row.label}
        >
          {row.label}
        </td>
        {row.values.map((value, i) => (
          <td
            key={columns[i].end}
            className={`px-3 py-1.5 text-right whitespace-nowrap text-gray-700 tabular-nums dark:text-gray-200 ${columnClasses(i)}`}
          >
            {cellText(row, value)}
          </td>
        ))}
      </tr>
    ))}
  </>
)

export default PlanGrid
