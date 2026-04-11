'use client'

import { customTheme, extensions } from '@/lib/core'
import type { PeriodCloseStatus } from '@robosystems/client/extensions'
import {
  Badge,
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
import { useCallback, useEffect, useState } from 'react'
import { HiCheck, HiClock, HiExclamationCircle } from 'react-icons/hi'
import { TbFileInvoice } from 'react-icons/tb'

const STATUS_COLORS: Record<string, string> = {
  posted: 'success',
  draft: 'warning',
  pending: 'gray',
  reversed: 'failure',
}

const formatCurrencyDollars = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

interface PeriodClosePanelProps {
  graphId: string
  onEntryCreated?: () => void
}

const PeriodClosePanel: FC<PeriodClosePanelProps> = ({
  graphId,
  onEntryCreated,
}) => {
  const [closeStatus, setCloseStatus] = useState<PeriodCloseStatus | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [creatingEntry, setCreatingEntry] = useState<string | null>(null)

  // Default to current month
  const now = new Date()
  const defaultStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const defaultEnd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${lastDay}`

  const [periodStart, setPeriodStart] = useState(defaultStart)
  const [periodEnd, setPeriodEnd] = useState(defaultEnd)

  const loadCloseStatus = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const status = await extensions.ledger.getPeriodCloseStatus(
        graphId,
        periodStart,
        periodEnd
      )
      setCloseStatus(status)
    } catch (err) {
      console.error('Error loading close status:', err)
      setError('Failed to load period close status.')
    } finally {
      setIsLoading(false)
    }
  }, [graphId, periodStart, periodEnd])

  useEffect(() => {
    if (graphId) {
      loadCloseStatus()
    }
  }, [graphId, loadCloseStatus])

  const handleCreateEntry = async (structureId: string) => {
    try {
      setCreatingEntry(structureId)
      await extensions.ledger.createClosingEntry(
        graphId,
        structureId,
        periodEnd,
        periodStart,
        periodEnd
      )
      onEntryCreated?.()
      await loadCloseStatus()
    } catch (err) {
      console.error('Error creating closing entry:', err)
      setError('Failed to create closing entry.')
    } finally {
      setCreatingEntry(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner size="md" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 py-4 text-red-500">
        <HiExclamationCircle className="h-5 w-5" />
        <span>{error}</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Period selector */}
      <div className="border-b border-gray-200 pb-4 dark:border-gray-700">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label
              htmlFor="period-start"
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Period:
            </label>
            <input
              id="period-start"
              type="date"
              value={periodStart}
              onChange={(e) => setPeriodStart(e.target.value)}
              className="rounded-lg border border-gray-300 bg-gray-50 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
            <span className="text-gray-500">to</span>
            <input
              id="period-end"
              aria-label="Period End"
              type="date"
              value={periodEnd}
              onChange={(e) => setPeriodEnd(e.target.value)}
              className="rounded-lg border border-gray-300 bg-gray-50 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
          {closeStatus && (
            <Badge
              color={closeStatus.periodStatus === 'closed' ? 'success' : 'info'}
            >
              {closeStatus.periodStatus}
            </Badge>
          )}
        </div>
      </div>

      {/* Schedule status table */}
      {!closeStatus || closeStatus.schedules.length === 0 ? (
        <div className="py-8 text-center text-gray-500 dark:text-gray-400">
          No schedules found for this period.
        </div>
      ) : (
        <>
          <Table theme={customTheme.table}>
            <TableHead>
              <TableHeadCell>Schedule</TableHeadCell>
              <TableHeadCell>Amount</TableHeadCell>
              <TableHeadCell>Status</TableHeadCell>
              <TableHeadCell className="w-40" />
            </TableHead>
            <TableBody>
              {closeStatus.schedules.map((item) => (
                <TableRow key={item.structureId}>
                  <TableCell className="font-medium text-gray-900 dark:text-white">
                    {item.structureName}
                  </TableCell>
                  <TableCell>{formatCurrencyDollars(item.amount)}</TableCell>
                  <TableCell>
                    <Badge
                      color={STATUS_COLORS[item.status] || 'gray'}
                      size="sm"
                    >
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {item.status === 'pending' && (
                      <Button
                        theme={customTheme.button}
                        size="xs"
                        color="primary"
                        disabled={creatingEntry === item.structureId}
                        onClick={() => handleCreateEntry(item.structureId)}
                      >
                        {creatingEntry === item.structureId ? (
                          <Spinner size="sm" className="mr-1" />
                        ) : (
                          <TbFileInvoice className="mr-1 h-4 w-4" />
                        )}
                        Create Entry
                      </Button>
                    )}
                    {item.status === 'draft' && (
                      <Badge color="warning" size="sm">
                        <HiClock className="mr-1 inline h-3 w-3" />
                        Draft created
                      </Badge>
                    )}
                    {item.status === 'posted' && (
                      <Badge color="success" size="sm">
                        <HiCheck className="mr-1 inline h-3 w-3" />
                        Posted
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex gap-4 text-sm text-gray-500 dark:text-gray-400">
            <span>Draft: {closeStatus.totalDraft}</span>
            <span>Posted: {closeStatus.totalPosted}</span>
          </div>
        </>
      )}
    </div>
  )
}

export default PeriodClosePanel
