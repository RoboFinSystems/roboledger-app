'use client'

import { clients } from '@/lib/core'
import { Spinner } from 'flowbite-react'
import type { FC } from 'react'
import { useCallback, useEffect, useState } from 'react'
import { HiExclamationCircle } from 'react-icons/hi'
import BlockView from './blockview/BlockView'
import type { EnvelopeBlock } from './blockview/types'
import type { ViewMode } from './ViewModeToggle'

interface SchedulePanelProps {
  graphId: string
  structureId: string
  viewMode: ViewMode
}

/**
 * Thin orchestration shell around the schedule envelope. Owns the
 * fetch + createClosingEntry mutation; delegates all rendering to
 * `BlockView`, which dispatches to the schedule `Rendering` projection
 * (or the uniform `FactTable` projection in facts mode).
 */
const SchedulePanel: FC<SchedulePanelProps> = ({
  graphId,
  structureId,
  viewMode,
}) => {
  const [envelope, setEnvelope] = useState<EnvelopeBlock | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadEnvelope = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const block = await clients.ledger.getInformationBlock(
        graphId,
        structureId
      )
      setEnvelope(block ?? null)
    } catch (err) {
      console.error('Error loading schedule envelope:', err)
      setError('Failed to load schedule facts.')
    } finally {
      setIsLoading(false)
    }
  }, [graphId, structureId])

  useEffect(() => {
    loadEnvelope()
  }, [loadEnvelope])

  const handleCreateEntry = useCallback(
    async (periodEnd: string, periodStart: string): Promise<void> => {
      try {
        await clients.ledger.createClosingEntry(
          graphId,
          structureId,
          periodEnd,
          periodStart,
          periodEnd
        )
        await loadEnvelope()
      } catch (err) {
        console.error('Error creating closing entry:', err)
        setError('Failed to create closing entry.')
      }
    },
    [graphId, structureId, loadEnvelope]
  )

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

  if (!envelope) {
    return (
      <div className="py-12 text-center text-gray-500 dark:text-gray-400">
        No facts found for this schedule.
      </div>
    )
  }

  return (
    <BlockView
      envelope={envelope}
      viewMode={viewMode}
      onCreateEntry={handleCreateEntry}
    />
  )
}

export default SchedulePanel
