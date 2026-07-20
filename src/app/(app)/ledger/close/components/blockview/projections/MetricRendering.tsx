'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
  TextInput,
  ToggleSwitch,
} from 'flowbite-react'
import type { FC } from 'react'
import { useMemo, useState } from 'react'
import { HiSearch } from 'react-icons/hi'
import { formatCurrencyDollars, formatDate } from '../../../utils'
import type {
  EnvelopeBlock,
  EnvelopeRenderingPeriod,
  EnvelopeRenderingRow,
} from '../types'

interface MetricRenderingProjectionProps {
  envelope: EnvelopeBlock
  entityName?: string | null
}

/**
 * Charlie's `Rendering` View projection — metric-block variant.
 *
 * Metric blocks are standing time series: the server-computed
 * `envelope.view.rendering` carries one period column per computed
 * standing FactSet (oldest → newest) and one row per metric concept in
 * presentation-arc order. Unlike the statement family, rows mix value
 * kinds — Working Capital is monetary while Current Ratio is a pure
 * decimal — so cells format per-row from the element's `isMonetary`
 * flag rather than uniformly as currency.
 *
 * Client-side analytics affordances (variance vs. prior period, row
 * filter) live here rather than in a shared table because they only
 * make sense on flat time-series grids.
 */
const MetricRenderingProjection: FC<MetricRenderingProjectionProps> = ({
  envelope,
  entityName,
}) => {
  const [filter, setFilter] = useState('')
  const [showVariance, setShowVariance] = useState(false)

  const rendering = envelope.view.rendering

  const monetaryByElement = useMemo(
    () =>
      new Map(envelope.elements.map((el) => [el.id, Boolean(el.isMonetary)])),
    [envelope.elements]
  )

  if (rendering === null || rendering.rows.length === 0) {
    return (
      <div className="py-12 text-center text-gray-500 dark:text-gray-400">
        No metrics defined for this block.
      </div>
    )
  }

  const { rows, periods } = rendering

  // Never-computed catalog skeleton — the block exists with its metric
  // concepts but no standing FactSet has been computed yet.
  if (periods.length === 0) {
    return (
      <div className="py-8">
        <div className="pb-4 text-center text-sm text-gray-500 dark:text-gray-400">
          No computed periods yet. Compute a period to start the series.
        </div>
        <ul className="mx-auto max-w-md space-y-1">
          {rows.map((row: EnvelopeRenderingRow, idx: number) => (
            <li
              key={`${row.elementId}-${idx}`}
              className="flex items-center justify-between border-b border-gray-100 py-1.5 text-sm text-gray-600 dark:border-gray-700/50 dark:text-gray-300"
            >
              <span>{row.elementName}</span>
              <span className="font-mono text-gray-400 dark:text-gray-500">
                —
              </span>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  const canShowVariance = periods.length >= 2
  const lastIdx = periods.length - 1
  const prevIdx = periods.length - 2

  const visibleRows = filter
    ? rows.filter((row) =>
        row.elementName.toLowerCase().includes(filter.toLowerCase())
      )
    : rows

  const formatCell = (row: EnvelopeRenderingRow, value: number): string =>
    monetaryByElement.get(row.elementId)
      ? formatCurrencyDollars(value)
      : formatRatio(value)

  return (
    <div className="overflow-x-auto">
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
          {periods.length === 1
            ? `As of ${formatDate(periods[0].end)}`
            : `${periods.length} periods · ${formatDate(periods[0].end)} — ${formatDate(periods[lastIdx].end)}`}
        </p>
      </div>

      {/* Toolbar — row filter + variance toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 py-3">
        <TextInput
          sizing="sm"
          icon={HiSearch}
          placeholder="Filter metrics"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-56"
        />
        {canShowVariance && (
          <ToggleSwitch
            checked={showVariance}
            onChange={setShowVariance}
            label="Variance vs. prior"
            sizing="sm"
          />
        )}
      </div>

      <Table>
        <TableHead>
          <TableHeadCell className="w-1/3" />
          {periods.map((period: EnvelopeRenderingPeriod, i: number) => (
            <TableHeadCell key={i} className="text-right">
              {period.label || formatDate(period.end)}
            </TableHeadCell>
          ))}
          {showVariance && canShowVariance && (
            <>
              <TableHeadCell className="text-right">Δ</TableHeadCell>
              <TableHeadCell className="text-right">Δ%</TableHeadCell>
            </>
          )}
        </TableHead>
        <TableBody>
          {visibleRows.map((row: EnvelopeRenderingRow, idx: number) => {
            const indent = row.depth * 16
            const last = row.values[lastIdx] ?? null
            const prev = row.values[prevIdx] ?? null
            const delta = last !== null && prev !== null ? last - prev : null
            const deltaPct =
              delta !== null && prev !== null && prev !== 0
                ? (delta / Math.abs(prev)) * 100
                : null

            return (
              <TableRow key={`${row.elementId}-${idx}`}>
                <TableCell
                  style={{ paddingLeft: `${indent + 16}px` }}
                  className={
                    row.isSubtotal
                      ? 'font-semibold text-gray-900 dark:text-white'
                      : 'text-gray-700 dark:text-gray-300'
                  }
                >
                  {row.elementName}
                </TableCell>
                {row.values.map((value, i) => (
                  <TableCell
                    key={i}
                    className="text-right font-mono text-gray-700 dark:text-gray-300"
                  >
                    {value !== null ? formatCell(row, value) : '—'}
                  </TableCell>
                ))}
                {showVariance && canShowVariance && (
                  <>
                    <TableCell className="text-right font-mono text-gray-700 dark:text-gray-300">
                      {delta !== null ? formatCell(row, delta) : '—'}
                    </TableCell>
                    <TableCell
                      className={`text-right font-mono ${
                        deltaPct === null
                          ? 'text-gray-400 dark:text-gray-500'
                          : deltaPct < 0
                            ? 'text-red-500'
                            : 'text-green-600 dark:text-green-400'
                      }`}
                    >
                      {deltaPct !== null ? formatDeltaPct(deltaPct) : '—'}
                    </TableCell>
                  </>
                )}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

/**
 * Pure (non-monetary) metric values — ratios like 3.27 — in accounting
 * notation: two decimals, negatives in parentheses, no currency symbol.
 */
const formatRatio = (value: number): string => {
  const abs = Math.abs(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return value < 0 ? `(${abs})` : abs
}

const formatDeltaPct = (pct: number): string => {
  const abs = Math.abs(pct).toLocaleString('en-US', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })
  return pct < 0 ? `(${abs}%)` : `+${abs}%`
}

export default MetricRenderingProjection
