'use client'

import { customTheme } from '@/lib/core'
import {
  Button,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from 'flowbite-react'
import type { FC } from 'react'
import { useMemo, useState } from 'react'
import { TbFileInvoice } from 'react-icons/tb'
import { formatCurrencyDollars, formatMonth } from '../../../utils'
import type { EnvelopeBlock, EnvelopeFact } from '../types'

interface ScheduleRenderingProjectionProps {
  envelope: EnvelopeBlock
  /**
   * Optional handler for the per-period "Create Entry" action. When
   * omitted the action button is hidden — useful for the read-only
   * package-mode (Plan C) where Report Block items are immutable.
   */
  onCreateEntry?: (periodEnd: string, periodStart: string) => Promise<void>
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
 * The "Create Entry" action is delegated to the parent via
 * `onCreateEntry` so this projection stays presentation-only — the
 * parent still owns the createClosingEntry mutation and the
 * post-create envelope refetch.
 */
const ScheduleRenderingProjection: FC<ScheduleRenderingProjectionProps> = ({
  envelope,
  onCreateEntry,
}) => {
  const [creatingPeriod, setCreatingPeriod] = useState<string | null>(null)

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

  const handleCreateEntry = async (
    periodEnd: string,
    periodStart: string
  ): Promise<void> => {
    if (!onCreateEntry) return
    const periodKey = `${periodStart}_${periodEnd}`
    try {
      setCreatingPeriod(periodKey)
      await onCreateEntry(periodEnd, periodStart)
    } finally {
      setCreatingPeriod(null)
    }
  }

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
        <Table theme={customTheme.table}>
          <TableHead>
            <TableHeadCell>Period</TableHeadCell>
            <TableHeadCell>Element</TableHeadCell>
            <TableHeadCell className="text-right">Amount</TableHeadCell>
            {onCreateEntry && <TableHeadCell className="w-32" />}
          </TableHead>
          <TableBody>
            {factsByPeriod.map(([key, periodFacts]) =>
              periodFacts.map((fact, idx) => {
                const periodKey = `${fact.periodStart ?? fact.periodEnd}_${fact.periodEnd}`
                return (
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
                    {onCreateEntry && idx === 0 && (
                      <TableCell
                        rowSpan={periodFacts.length}
                        className="align-top"
                      >
                        <Button
                          theme={customTheme.button}
                          size="xs"
                          color="primary"
                          disabled={creatingPeriod === periodKey}
                          onClick={() =>
                            handleCreateEntry(
                              fact.periodEnd,
                              fact.periodStart ?? fact.periodEnd
                            )
                          }
                        >
                          {creatingPeriod === periodKey ? (
                            <Spinner size="sm" className="mr-1" />
                          ) : (
                            <TbFileInvoice className="mr-1 h-3.5 w-3.5" />
                          )}
                          Entry
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default ScheduleRenderingProjection
