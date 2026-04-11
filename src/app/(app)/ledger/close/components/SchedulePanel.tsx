'use client'

import { customTheme, extensions } from '@/lib/core'
import type { ScheduleFact } from '@robosystems/client/extensions'
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
import { useCallback, useEffect, useMemo, useState } from 'react'
import { HiExclamationCircle } from 'react-icons/hi'
import { TbFileInvoice } from 'react-icons/tb'
import type { FactRow } from './FactsTable'
import FactsTable from './FactsTable'
import type { ViewMode } from './ViewModeToggle'

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

const formatMonth = (dateString: string): string => {
  const date = new Date(dateString + 'T00:00:00')
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
  })
}

interface SchedulePanelProps {
  graphId: string
  structureId: string
  scheduleName: string
  viewMode: ViewMode
}

const SchedulePanel: FC<SchedulePanelProps> = ({
  graphId,
  structureId,
  scheduleName,
  viewMode,
}) => {
  const [facts, setFacts] = useState<ScheduleFact[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creatingEntry, setCreatingEntry] = useState(false)

  const loadFacts = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const result = await extensions.ledger.getScheduleFacts(
        graphId,
        structureId
      )
      setFacts(result)
    } catch (err) {
      console.error('Error loading schedule facts:', err)
      setError('Failed to load schedule facts.')
    } finally {
      setIsLoading(false)
    }
  }, [graphId, structureId])

  useEffect(() => {
    loadFacts()
  }, [loadFacts])

  // Group facts by period
  const groupedFacts = useMemo(() => {
    const groups: Record<string, ScheduleFact[]> = {}
    for (const fact of facts) {
      const key = `${fact.periodStart}_${fact.periodEnd}`
      if (!groups[key]) groups[key] = []
      groups[key].push(fact)
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
  }, [facts])

  const handleCreateEntry = async (periodEnd: string, periodStart: string) => {
    try {
      setCreatingEntry(true)
      await extensions.ledger.createClosingEntry(
        graphId,
        structureId,
        periodEnd,
        periodStart,
        periodEnd
      )
      await loadFacts()
    } catch (err) {
      console.error('Error creating closing entry:', err)
      setError('Failed to create closing entry.')
    } finally {
      setCreatingEntry(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 py-8 text-red-500">
        <HiExclamationCircle className="h-5 w-5" />
        <span>{error}</span>
      </div>
    )
  }

  if (facts.length === 0) {
    return (
      <div className="py-12 text-center text-gray-500 dark:text-gray-400">
        No facts found for this schedule.
      </div>
    )
  }

  // Facts view
  if (viewMode === 'facts') {
    const factRows: FactRow[] = facts.map((f) => ({
      elementName: f.elementName,
      elementQname: f.elementId,
      periodStart: f.periodStart,
      periodEnd: f.periodEnd,
      value: f.value,
      unit: 'USD',
    }))
    return <FactsTable facts={factRows} />
  }

  // Rendered view — facts grouped by period
  return (
    <div>
      <div className="border-b border-gray-200 py-4 text-center dark:border-gray-700">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          {scheduleName}
        </p>
        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
          {groupedFacts.length} periods
        </p>
      </div>

      <div className="overflow-x-auto">
        <Table theme={customTheme.table}>
          <TableHead>
            <TableHeadCell>Period</TableHeadCell>
            <TableHeadCell>Element</TableHeadCell>
            <TableHeadCell className="text-right">Amount</TableHeadCell>
            <TableHeadCell className="w-32" />
          </TableHead>
          <TableBody>
            {groupedFacts.map(([key, periodFacts]) =>
              periodFacts.map((fact, idx) => (
                <TableRow key={`${key}-${fact.elementId}-${idx}`}>
                  {idx === 0 && (
                    <TableCell
                      rowSpan={periodFacts.length}
                      className="align-top font-medium text-gray-900 dark:text-white"
                    >
                      {formatMonth(fact.periodStart)}
                    </TableCell>
                  )}
                  <TableCell className="text-gray-700 dark:text-gray-300">
                    {fact.elementName}
                  </TableCell>
                  <TableCell className="text-right font-mono text-gray-900 dark:text-white">
                    {formatCurrency(fact.value)}
                  </TableCell>
                  {idx === 0 && (
                    <TableCell
                      rowSpan={periodFacts.length}
                      className="align-top"
                    >
                      <Button
                        theme={customTheme.button}
                        size="xs"
                        color="primary"
                        disabled={creatingEntry}
                        onClick={() =>
                          handleCreateEntry(fact.periodEnd, fact.periodStart)
                        }
                      >
                        {creatingEntry ? (
                          <Spinner size="sm" className="mr-1" />
                        ) : (
                          <TbFileInvoice className="mr-1 h-3.5 w-3.5" />
                        )}
                        Entry
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default SchedulePanel
