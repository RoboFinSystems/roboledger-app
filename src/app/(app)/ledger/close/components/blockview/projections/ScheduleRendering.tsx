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
import { useMemo } from 'react'
import { formatCurrencyDollars, formatMonth } from '../../../utils'
import type { EnvelopeBlock, EnvelopeFact } from '../types'

interface ScheduleRenderingProjectionProps {
  envelope: EnvelopeBlock
}

type PeriodFactRow = EnvelopeFact & { elementName: string }

/**
 * Charlie's `Rendering` View projection — schedule variant.
 *
 * Schedules don't have a server-computed `view.rendering` (they're not
 * roll-up molecules); instead this component groups
 * `envelope.facts` by period and renders the per-period table that the
 * old SchedulePanel produced. Element name lookup uses
 * `envelope.elements` (single in-memory join).
 *
 * Read-only: closing entries are created on the period-close page
 * (Current Period Status), which is sequence-aware and guards against
 * already-closed / not-yet-due periods. The schedule rollforward is
 * presentation-only.
 */
const ScheduleRenderingProjection: FC<ScheduleRenderingProjectionProps> = ({
  envelope,
}) => {
  const factsByPeriod = useMemo(() => {
    const elementsById = new Map(envelope.elements.map((e) => [e.id, e]))
    const groups: Record<string, PeriodFactRow[]> = {}
    for (const fact of envelope.facts) {
      const key = `${fact.periodStart ?? fact.periodEnd}_${fact.periodEnd}`
      if (!groups[key]) groups[key] = []
      const elementName = elementsById.get(fact.elementId)?.name ?? ''
      groups[key].push({ ...fact, elementName })
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
  }, [envelope.elements, envelope.facts])

  if (envelope.facts.length === 0) {
    return (
      <div className="py-12 text-center text-gray-500 dark:text-gray-400">
        No facts found for this schedule.
      </div>
    )
  }

  return (
    <div>
      <div className="border-b border-gray-200 py-4 text-center dark:border-gray-700">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          {envelope.name}
        </p>
        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
          {factsByPeriod.length} periods
        </p>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHead>
            <TableHeadCell>Period</TableHeadCell>
            <TableHeadCell>Element</TableHeadCell>
            <TableHeadCell className="text-right">Amount</TableHeadCell>
          </TableHead>
          <TableBody>
            {factsByPeriod.map(([key, periodFacts]) =>
              periodFacts.map((fact, idx) => (
                <TableRow key={`${key}-${fact.elementId}`}>
                  {idx === 0 && (
                    <TableCell
                      rowSpan={periodFacts.length}
                      className="align-top font-medium text-gray-900 dark:text-white"
                    >
                      {fact.periodStart
                        ? formatMonth(fact.periodStart)
                        : formatMonth(fact.periodEnd)}
                    </TableCell>
                  )}
                  <TableCell className="text-gray-700 dark:text-gray-300">
                    {fact.elementName}
                  </TableCell>
                  <TableCell className="text-right font-mono text-gray-900 dark:text-white">
                    {formatCurrencyDollars(fact.value)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default ScheduleRenderingProjection
