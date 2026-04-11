'use client'

import { customTheme } from '@/lib/core'
import type {
  StatementData,
  StatementRow,
} from '@robosystems/client/extensions'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from 'flowbite-react'
import type { FC } from 'react'
import { formatCurrency, formatDate } from '../utils'

interface StatementTableProps {
  data: StatementData
  entityName?: string | null
}

const StatementTable: FC<StatementTableProps> = ({ data, entityName }) => {
  const periods = data.periods

  return (
    <div className="overflow-x-auto">
      {/* Formal financial statement header */}
      <div className="border-b border-gray-200 py-4 text-center dark:border-gray-700">
        {entityName && (
          <p className="text-sm font-bold tracking-widest text-gray-900 uppercase dark:text-white">
            {entityName}
          </p>
        )}
        <p className="mt-1 text-sm font-semibold text-gray-700 dark:text-gray-300">
          {data.structureName}
        </p>
        {periods.length > 0 && periods[0].start && (
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            {periods.length === 1
              ? `For the Period Ended ${formatDate(periods[0].end)}`
              : `${formatDate(periods[0].start)} — ${formatDate(periods[periods.length - 1].end)}`}
          </p>
        )}
      </div>

      <Table theme={customTheme.table}>
        <TableHead>
          <TableHeadCell className="w-1/2" />
          {periods.map((period, i) => (
            <TableHeadCell key={i} className="text-right">
              {period.label ||
                `${formatDate(period.start)} — ${formatDate(period.end)}`}
            </TableHeadCell>
          ))}
        </TableHead>
        <TableBody>
          {data.rows.map((row: StatementRow, idx: number) => {
            const indent = row.depth * 24
            const isBold = row.isSubtotal
            const isTopLevel = row.isSubtotal && row.depth === 0
            const allZero = row.values.every((v) => (v ?? 0) === 0)

            return (
              <TableRow
                key={`${row.elementId}-${idx}`}
                className={isBold ? 'bg-gray-50 dark:bg-gray-800/50' : ''}
              >
                <TableCell
                  style={{ paddingLeft: `${indent + 16}px` }}
                  className={`${
                    isBold
                      ? 'font-semibold text-gray-900 dark:text-white'
                      : 'text-gray-700 dark:text-gray-300'
                  } ${allZero && !isBold ? 'text-gray-400 dark:text-gray-500' : ''}`}
                >
                  {row.elementName}
                </TableCell>
                {row.values.map((value, i) => (
                  <TableCell
                    key={i}
                    className={`text-right font-mono ${
                      isBold
                        ? 'font-semibold text-gray-900 dark:text-white'
                        : 'text-gray-700 dark:text-gray-300'
                    } ${
                      (value ?? 0) === 0 && !isBold
                        ? 'text-gray-400 dark:text-gray-500'
                        : ''
                    } ${isTopLevel ? 'border-b-2 border-double border-gray-400 dark:border-gray-500' : ''}`}
                  >
                    {value !== null ? formatCurrency(value) : '—'}
                  </TableCell>
                ))}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

export default StatementTable
