'use client'

import FoldControls from '@/components/FoldControls'
import FoldLabel from '@/components/FoldLabel'
import { formatDollars } from '@/lib/ledger/formatters'
import { useRowFold } from '@/lib/ledger/rowFold'
import type { LiveFinancialStatementResponse } from '@robosystems/client/types'
import {
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
import {
  buildStatementModel,
  rowChange,
  type StatementRow,
} from '../statementModel'

const formatCurrency = (amount: number): string => formatDollars(amount)

// Change is signed but deliberately uncoloured: whether a rise is good news
// depends on the line (revenue vs. expense, asset vs. liability), and a
// green/red tint would assert a judgement the statement doesn't make.
const formatSignedCurrency = (amount: number): string =>
  formatDollars(amount, undefined, { signDisplay: 'exceptZero' })

const formatSignedPercent = (ratio: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'percent',
    maximumFractionDigits: 1,
    signDisplay: 'exceptZero',
  }).format(ratio)

const NUMERIC_CELL = 'text-right font-mono text-gray-900 dark:text-white'

const rowKey = (row: StatementRow): string => row.key

interface LiveStatementTableProps {
  statement: LiveFinancialStatementResponse
}

const LiveStatementTable: FC<LiveStatementTableProps> = ({ statement }) => {
  const model = useMemo(() => buildStatementModel(statement), [statement])
  const { columns, rows } = model

  const fold = useRowFold(rows, rowKey)
  const [showChange, setShowChange] = useState(false)

  // Change needs two columns to compare — the cash flow renders one.
  const canCompare = columns.length >= 2
  const withChange = canCompare && showChange

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 pb-3">
        <FoldControls fold={fold} />
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
          {fold.visible.map((index) => {
            const row = rows[index]
            const canFold = fold.isFoldable(index)
            const change = withChange ? rowChange(row.values) : null
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
                  onClick={canFold ? () => fold.toggle(index) : undefined}
                >
                  <FoldLabel
                    label={row.label}
                    canFold={canFold}
                    folded={fold.isFolded(index)}
                    ownedCount={fold.ownedCount(index)}
                  />
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
