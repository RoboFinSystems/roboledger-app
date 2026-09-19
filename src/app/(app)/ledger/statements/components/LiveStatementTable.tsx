'use client'

import type { LiveFinancialStatementResponse } from '@robosystems/client/types'
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
  ToggleSwitch,
} from 'flowbite-react'
import type { FC } from 'react'
import { useMemo, useState } from 'react'
import { HiChevronDown, HiChevronRight } from 'react-icons/hi'
import {
  buildStatementModel,
  foldableKeys,
  isFoldable,
  rowChange,
  visibleRowIndexes,
} from '../statementModel'

const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)

// Change is signed but deliberately uncoloured: whether a rise is good news
// depends on the line (revenue vs. expense, asset vs. liability), and a
// green/red tint would assert a judgement the statement doesn't make.
const formatSignedCurrency = (amount: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    signDisplay: 'exceptZero',
  }).format(amount)

const formatSignedPercent = (ratio: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'percent',
    maximumFractionDigits: 1,
    signDisplay: 'exceptZero',
  }).format(ratio)

const NUMERIC_CELL = 'text-right font-mono text-gray-900 dark:text-white'

interface LiveStatementTableProps {
  statement: LiveFinancialStatementResponse
}

const LiveStatementTable: FC<LiveStatementTableProps> = ({ statement }) => {
  const model = useMemo(() => buildStatementModel(statement), [statement])
  const { columns, rows } = model

  // Keyed by qname, so a folded section stays folded across a refresh or a
  // period change; keys from another statement type simply match nothing.
  const [folded, setFolded] = useState<ReadonlySet<string>>(new Set())
  const [showChange, setShowChange] = useState(false)

  const foldable = useMemo(() => foldableKeys(rows), [rows])
  const visible = useMemo(() => visibleRowIndexes(rows, folded), [rows, folded])
  const foldedHere = foldable.filter((key) => folded.has(key)).length

  // Change needs two columns to compare — the cash flow renders one.
  const canCompare = columns.length >= 2
  const withChange = canCompare && showChange

  const toggle = (key: string) =>
    setFolded((prev) => {
      const next = new Set(prev)
      if (!next.delete(key)) next.add(key)
      return next
    })

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 pb-3">
        <div className="flex gap-2">
          <Button
            size="xs"
            color="gray"
            disabled={foldedHere === 0}
            onClick={() => setFolded(new Set())}
          >
            Expand all
          </Button>
          <Button
            size="xs"
            color="gray"
            disabled={foldable.length === 0 || foldedHere === foldable.length}
            onClick={() => setFolded(new Set(foldable))}
          >
            Collapse all
          </Button>
        </div>
        {canCompare && (
          <ToggleSwitch
            checked={showChange}
            onChange={setShowChange}
            label="Show change"
          />
        )}
      </div>

      <Table hoverable data-testid="live-statement-table">
        <TableHead>
          {/* flowbite's TableHead renders a bare <thead>; without a row the
              cells are invalid HTML. A plain <tr>, not TableRow, so `hoverable`
              doesn't tint the header. */}
          <tr>
            <TableHeadCell>Concept</TableHeadCell>
            {columns.map((column) => (
              <TableHeadCell key={column.end} className="text-right">
                {column.label}
                <span className="block text-[11px] font-normal tracking-normal whitespace-nowrap text-gray-500 normal-case dark:text-gray-400">
                  {column.caption}
                </span>
              </TableHeadCell>
            ))}
            {withChange && (
              <>
                <TableHeadCell className="text-right">Change</TableHeadCell>
                <TableHeadCell className="text-right">%</TableHeadCell>
              </>
            )}
          </tr>
        </TableHead>
        <TableBody>
          {visible.map((index) => {
            const row = rows[index]
            const canFold = isFoldable(row, index)
            const isFolded = canFold && folded.has(row.key)
            const change = withChange ? rowChange(row.values) : null
            const Chevron = isFolded ? HiChevronRight : HiChevronDown
            return (
              <TableRow
                key={`${row.key}-${index}`}
                className={row.isSubtotal ? 'font-semibold' : undefined}
              >
                <TableCell
                  className={`text-gray-900 dark:text-white ${
                    canFold ? 'cursor-pointer' : ''
                  }`}
                  style={{ paddingLeft: `${0.75 + row.depth * 1.25}rem` }}
                  title={row.qname}
                  onClick={canFold ? () => toggle(row.key) : undefined}
                >
                  {canFold ? (
                    // No handler of its own: its click (Enter / Space included)
                    // bubbles to the cell, so the whole label cell is the
                    // target. Not the whole row — dragging across the numbers
                    // to copy them must not fold the section.
                    <button
                      type="button"
                      aria-expanded={!isFolded}
                      className="flex items-center gap-1 text-left"
                    >
                      <Chevron className="h-4 w-4 shrink-0 text-gray-400" />
                      {row.label}
                      {isFolded && (
                        <span className="ml-1 text-xs font-normal text-gray-500 dark:text-gray-400">
                          {index - row.ownedStart} line
                          {index - row.ownedStart === 1 ? '' : 's'}
                        </span>
                      )}
                    </button>
                  ) : (
                    // Indent past the chevron gutter so labels at one depth
                    // line up whether or not the row folds.
                    <span className="pl-5">{row.label}</span>
                  )}
                </TableCell>
                {row.values.map((value, vi) => (
                  <TableCell key={columns[vi].end} className={NUMERIC_CELL}>
                    {value === null ? '—' : formatCurrency(value)}
                  </TableCell>
                ))}
                {withChange && (
                  <>
                    <TableCell className={NUMERIC_CELL}>
                      {change ? formatSignedCurrency(change.amount) : '—'}
                    </TableCell>
                    <TableCell className={NUMERIC_CELL}>
                      {change && change.percent !== null
                        ? formatSignedPercent(change.percent)
                        : '—'}
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

export default LiveStatementTable
