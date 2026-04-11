'use client'

import { customTheme } from '@/lib/core'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from 'flowbite-react'
import type { FC } from 'react'

export interface FactRow {
  elementName: string
  elementQname: string
  periodStart: string
  periodEnd: string | null
  value: number | string
  unit?: string | null
}

const formatPeriod = (start: string, end: string | null): string => {
  const fmt = (d: string) => {
    const date = new Date(d + 'T00:00:00')
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }
  if (!end || start === end) return fmt(start)
  return `${fmt(start)} — ${fmt(end)}`
}

const formatValue = (value: number | string): string => {
  if (typeof value === 'string') return value
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

interface FactsTableProps {
  facts: FactRow[]
}

const FactsTable: FC<FactsTableProps> = ({ facts }) => {
  if (facts.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500 dark:text-gray-400">
        No facts available.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <Table theme={customTheme.table}>
        <TableHead>
          <TableHeadCell>Element</TableHeadCell>
          <TableHeadCell>QName</TableHeadCell>
          <TableHeadCell>Period</TableHeadCell>
          <TableHeadCell className="text-right">Value</TableHeadCell>
          <TableHeadCell>Unit</TableHeadCell>
        </TableHead>
        <TableBody>
          {facts.map((fact, idx) => (
            <TableRow key={`${fact.elementQname}-${fact.periodStart}-${idx}`}>
              <TableCell className="font-medium text-gray-900 dark:text-white">
                {fact.elementName}
              </TableCell>
              <TableCell className="font-mono text-xs text-gray-500 dark:text-gray-400">
                {fact.elementQname}
              </TableCell>
              <TableCell className="text-sm text-gray-600 dark:text-gray-300">
                {formatPeriod(fact.periodStart, fact.periodEnd)}
              </TableCell>
              <TableCell className="text-right font-mono text-gray-900 dark:text-white">
                {formatValue(fact.value)}
              </TableCell>
              <TableCell className="text-sm text-gray-500 dark:text-gray-400">
                {fact.unit || 'USD'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export default FactsTable
