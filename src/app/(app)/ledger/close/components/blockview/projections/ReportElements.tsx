'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from 'flowbite-react'
import type { FC } from 'react'
import { useMemo, useState } from 'react'
import { HiChevronDown, HiChevronUp, HiSelector } from 'react-icons/hi'
import type { EnvelopeBlock, EnvelopeElement } from '../types'

interface ReportElementsProjectionProps {
  envelope: EnvelopeBlock
}

type Row = {
  qname: string
  label: string
  elementType: string
  balanceType: string
  periodType: string
  isAbstract: boolean
  factCount: number
}

type SortKey = keyof Row
type SortDir = 'asc' | 'desc'

function elementLabel(el: EnvelopeElement): string {
  return el.name || el.code || el.id
}

function toRow(el: EnvelopeElement, factCount: number): Row {
  return {
    qname: el.qname ?? '',
    label: elementLabel(el),
    elementType: el.elementType,
    balanceType: el.balanceType ?? '',
    periodType: el.periodType ?? '',
    isAbstract: el.isAbstract,
    factCount,
  }
}

/**
 * Charlie's `ReportElements` View projection (financial-viewer.md §4.3).
 *
 * Uniform across every block type — surfaces the elements that make up
 * the block as a flat sortable table, with the fact count per element
 * pulled from `envelope.facts` via in-memory groupBy. Useful for
 * auditing element coverage, spotting unused atoms in a Structure, and
 * answering "what concepts are in this block?" without leaving the
 * viewer.
 *
 * No backend dependency — the envelope already carries `elements[]`
 * and `facts[]`, so this projection ships standalone.
 */
const ReportElementsProjection: FC<ReportElementsProjectionProps> = ({
  envelope,
}) => {
  const [sortKey, setSortKey] = useState<SortKey>('qname')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const rows = useMemo<Row[]>(() => {
    const factsByElement = new Map<string, number>()
    for (const fact of envelope.facts) {
      factsByElement.set(
        fact.elementId,
        (factsByElement.get(fact.elementId) ?? 0) + 1
      )
    }
    return envelope.elements.map((el) =>
      toRow(el, factsByElement.get(el.id) ?? 0)
    )
  }, [envelope.elements, envelope.facts])

  const sorted = useMemo(() => {
    const copy = [...rows]
    copy.sort((a, b) => {
      const av = a[sortKey]
      const bv = b[sortKey]
      // Booleans: true sorts after false in asc.
      if (typeof av === 'boolean' && typeof bv === 'boolean') {
        return av === bv ? 0 : av ? 1 : -1
      }
      if (typeof av === 'number' && typeof bv === 'number') {
        return av - bv
      }
      return String(av).localeCompare(String(bv), undefined, {
        numeric: true,
        sensitivity: 'base',
      })
    })
    return sortDir === 'asc' ? copy : copy.reverse()
  }, [rows, sortKey, sortDir])

  const onSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  if (rows.length === 0) {
    return (
      <div className="py-12 text-center text-gray-500 dark:text-gray-400">
        No elements declared on this block.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <Table hoverable>
        <TableHead>
          <SortHeader
            label="QName"
            sortKey="qname"
            current={sortKey}
            dir={sortDir}
            onSort={onSort}
          />
          <SortHeader
            label="Label"
            sortKey="label"
            current={sortKey}
            dir={sortDir}
            onSort={onSort}
          />
          <SortHeader
            label="Type"
            sortKey="elementType"
            current={sortKey}
            dir={sortDir}
            onSort={onSort}
          />
          <SortHeader
            label="Balance"
            sortKey="balanceType"
            current={sortKey}
            dir={sortDir}
            onSort={onSort}
          />
          <SortHeader
            label="Period"
            sortKey="periodType"
            current={sortKey}
            dir={sortDir}
            onSort={onSort}
          />
          <SortHeader
            label="Facts"
            sortKey="factCount"
            current={sortKey}
            dir={sortDir}
            onSort={onSort}
            align="right"
          />
        </TableHead>
        <TableBody>
          {sorted.map((row, i) => (
            <TableRow
              key={`${row.qname}-${row.label}-${i}`}
              className={
                row.isAbstract
                  ? 'bg-gray-50 italic dark:bg-gray-800/50'
                  : 'bg-white dark:bg-gray-900'
              }
            >
              <TableCell className="font-mono text-xs text-gray-600 dark:text-gray-300">
                {row.qname || <span className="text-gray-400">—</span>}
              </TableCell>
              <TableCell className="text-sm">{row.label}</TableCell>
              <TableCell className="text-xs text-gray-500 dark:text-gray-400">
                {row.elementType}
              </TableCell>
              <TableCell className="text-xs text-gray-500 dark:text-gray-400">
                {row.balanceType || <span className="text-gray-400">—</span>}
              </TableCell>
              <TableCell className="text-xs text-gray-500 dark:text-gray-400">
                {row.periodType || <span className="text-gray-400">—</span>}
              </TableCell>
              <TableCell className="text-right text-sm tabular-nums">
                {row.factCount}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

interface SortHeaderProps {
  label: string
  sortKey: SortKey
  current: SortKey
  dir: SortDir
  onSort: (key: SortKey) => void
  align?: 'left' | 'right'
}

const SortHeader: FC<SortHeaderProps> = ({
  label,
  sortKey,
  current,
  dir,
  onSort,
  align = 'left',
}) => {
  const active = current === sortKey
  const Icon = active
    ? dir === 'asc'
      ? HiChevronUp
      : HiChevronDown
    : HiSelector
  return (
    <TableHeadCell className={align === 'right' ? 'text-right' : undefined}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={`inline-flex items-center gap-1 ${
          align === 'right' ? 'flex-row-reverse' : ''
        } ${active ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}
      >
        <Icon className="h-3 w-3" />
        {label}
      </button>
    </TableHeadCell>
  )
}

export default ReportElementsProjection
