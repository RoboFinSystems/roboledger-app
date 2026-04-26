'use client'

import { customTheme } from '@/lib/core'
import {
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from 'flowbite-react'
import type { FC } from 'react'
import { HiCheckCircle, HiExclamationCircle } from 'react-icons/hi'
import { formatCurrency, formatDate } from '../../../utils'
import type {
  EnvelopeBlock,
  EnvelopeRendering,
  EnvelopeRenderingPeriod,
  EnvelopeRenderingRow,
} from '../types'

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
 * fetch path. The validation badge mirrors what StatementPanel
 * rendered before the envelope migration.
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

const StatementGrid: FC<StatementGridProps> = ({
  envelope,
  rendering,
  entityName,
}) => {
  const { rows, periods } = rendering

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

      <Table theme={customTheme.table}>
        <TableHead>
          <TableHeadCell className="w-1/2" />
          {periods.map((period: EnvelopeRenderingPeriod, i: number) => (
            <TableHeadCell key={i} className="text-right">
              {period.label ||
                `${formatDate(period.start)} — ${formatDate(period.end)}`}
            </TableHeadCell>
          ))}
        </TableHead>
        <TableBody>
          {rows.map((row: EnvelopeRenderingRow, idx: number) => {
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

// ── Validation banner ────────────────────────────────────────────────

interface ValidationBannerProps {
  validation: NonNullable<EnvelopeRendering['validation']>
}

const ValidationBanner: FC<ValidationBannerProps> = ({ validation }) => {
  return (
    <div className="mt-4 border-t border-gray-200 pt-4 dark:border-gray-700">
      <div className="flex items-center gap-2 text-sm">
        {validation.passed ? (
          <Badge color="success" size="sm">
            <HiCheckCircle className="mr-1 inline h-3 w-3" />
            Validation Passed
          </Badge>
        ) : (
          <Badge color="failure" size="sm">
            <HiExclamationCircle className="mr-1 inline h-3 w-3" />
            Validation Failed
          </Badge>
        )}
        {validation.warnings.length > 0 && (
          <Badge color="warning" size="sm">
            {validation.warnings.length} warning
            {validation.warnings.length !== 1 ? 's' : ''}
          </Badge>
        )}
      </div>
      {validation.failures.length > 0 && (
        <ul className="mt-2 text-sm text-red-400">
          {validation.failures.map((f, i) => (
            <li key={i}>{f}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default StatementRenderingProjection
