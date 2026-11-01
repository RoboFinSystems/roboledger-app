'use client'

import { formatDollars } from '@/lib/ledger/formatters'
import type {
  ConsolidationWorksheetResponse,
  WorksheetColumn,
} from '@robosystems/client/types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from '@robosystems/core/ui'
import type { FC } from 'react'

const NUMERIC_CELL = 'text-right font-mono whitespace-nowrap'

const METHOD_LABEL: Record<string, string> = {
  equity: 'Equity method',
  cost: 'At cost',
}

/** What a column is, in a word or two under its name. */
export function columnCaption(column: WorksheetColumn): string {
  const share =
    column.ownership_pct != null ? ` · ${column.ownership_pct}%` : ''
  switch (column.kind) {
    case 'member':
      return column.consolidation_method === 'full' && share
        ? `In full${share}`
        : 'Parent'
    case 'combined':
      return 'Members summed'
    case 'adjustments':
      return 'Eliminations and NCI'
    case 'consolidated':
      return 'The group'
    default:
      return `${METHOD_LABEL[column.consolidation_method ?? ''] ?? 'Not summed'}${share}`
  }
}

/** The tint and weight a column's cells take. */
function columnClass(column: WorksheetColumn, first: boolean): string {
  if (column.kind === 'consolidated') {
    return 'bg-gray-50 font-semibold text-gray-900 dark:bg-gray-800 dark:text-white'
  }
  if (column.kind === 'not_summed') {
    // The first column outside the sum draws the line the sum stops at.
    return `text-gray-500 dark:text-gray-400 ${
      first ? 'border-l border-gray-300 dark:border-gray-600' : ''
    }`
  }
  return 'text-gray-900 dark:text-white'
}

interface WorksheetTableProps {
  worksheet: ConsolidationWorksheetResponse
}

/**
 * The group's statement with the entity as the column: each member, their
 * combined sum, the consolidation entity's adjustments and the consolidated
 * total, with equity-method and cost members beside the sum, never in it.
 */
const WorksheetTable: FC<WorksheetTableProps> = ({ worksheet }) => {
  const { columns, rows } = worksheet
  const firstOutside = columns.findIndex((c) => c.kind === 'not_summed')

  return (
    <Table hoverable data-testid="worksheet-table">
      <TableHead>
        <tr>
          <TableHeadCell>Concept</TableHeadCell>
          {columns.map((column, ci) => (
            <TableHeadCell
              key={column.key}
              className={`text-right ${columnClass(column, ci === firstOutside)}`}
            >
              {column.label}
              <span className="block text-[11px] font-normal tracking-normal whitespace-nowrap text-gray-500 normal-case dark:text-gray-400">
                {columnCaption(column)}
              </span>
            </TableHeadCell>
          ))}
        </tr>
      </TableHead>
      <TableBody>
        {rows.map((row, index) => (
          <TableRow
            key={`${row.qname}-${row.period_role ?? ''}-${index}`}
            className={
              row.is_subtotal || row.period_role ? 'font-semibold' : undefined
            }
          >
            <TableCell
              className="text-gray-900 dark:text-white"
              style={{ paddingLeft: `${0.75 + (row.depth ?? 0) * 1.25}rem` }}
              title={row.qname}
            >
              {row.name}
            </TableCell>
            {row.values.map((value, vi) => (
              <TableCell
                key={columns[vi].key}
                className={`${NUMERIC_CELL} ${columnClass(
                  columns[vi],
                  vi === firstOutside
                )}`}
              >
                {value == null ? '—' : formatDollars(value)}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export default WorksheetTable
