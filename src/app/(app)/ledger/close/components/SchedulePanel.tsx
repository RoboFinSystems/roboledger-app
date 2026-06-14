'use client'

import { clients, LoadingState } from '@/lib/core'
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
 * envelope fetch and delegates all rendering to `BlockView`, which
 * dispatches to the schedule `Rendering` projection (or the uniform
 * `FactTable` projection in facts mode). Read-only — closing entries
 * are created on the period-close page (Current Period Status), not the
 * schedule view.
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

  if (isLoading) {
    return <LoadingState />
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

  // Read-only rollforward. Closing entries are created on the period-close
  // page (Current Period Status), which is sequence-aware and guards against
  // already-closed / not-yet-due periods — the schedule view has no such
  // guard (every one of its periods rendered an Entry button, 422-ing on
  // closed months), so entry creation is funneled there.
  return <BlockView envelope={envelope} viewMode={viewMode} />
}

export default SchedulePanel
