'use client'

import type { FC } from 'react'
import type { ViewMode } from '../ViewModeToggle'
import FactTableProjection from './projections/FactTable'
import ScheduleRenderingProjection from './projections/ScheduleRendering'
import StatementRenderingProjection from './projections/StatementRendering'
import type { EnvelopeBlock } from './types'
import { isStatementBlockType } from './types'

interface BlockViewProps {
  envelope: EnvelopeBlock
  viewMode: ViewMode
  /**
   * Entity name passed through to the statement header. Optional —
   * package mode (Plan C) supplies it from the Report Block context;
   * closing-book mode reads it from the parent panel state.
   */
  entityName?: string | null
  /**
   * Schedule-only handler for the per-period "Create Entry" action.
   * Routed through to `ScheduleRenderingProjection`; ignored for
   * non-schedule block types.
   */
  onCreateEntry?: (periodEnd: string, periodStart: string) => Promise<void>
}

/**
 * `BlockView` — the envelope-driven content component inside
 * `FinancialViewer`. One instance per selected Information Block;
 * dispatches to one of six `type-of View` projections (Charlie's
 * ontology) by `(envelope.block_type, viewMode)`.
 *
 * Today: `Rendering` is block-type-specialized (`StatementRendering`
 * for the statement family; `ScheduleRendering` for schedules).
 * `FactTable` is uniform across every block type. Other projections
 * (`ModelStructure`, `VerificationResults`, `ReportElements`,
 * `BusinessRules`) come online as their backend support lands;
 * unsupported (block_type, viewMode) combinations render an empty
 * state without breaking the dispatcher.
 *
 * See `local/docs/specs/financial-viewer.md` §"BlockView and View
 * Projections" for the full mapping.
 */
const BlockView: FC<BlockViewProps> = ({
  envelope,
  viewMode,
  entityName,
  onCreateEntry,
}) => {
  if (viewMode === 'facts') {
    return <FactTableProjection envelope={envelope} />
  }

  // viewMode === 'rendered' — dispatch by block_type
  if (isStatementBlockType(envelope.blockType)) {
    return (
      <StatementRenderingProjection
        envelope={envelope}
        entityName={entityName}
      />
    )
  }

  if (envelope.blockType === 'schedule') {
    return (
      <ScheduleRenderingProjection
        envelope={envelope}
        onCreateEntry={onCreateEntry}
      />
    )
  }

  return (
    <div className="py-12 text-center text-gray-500 dark:text-gray-400">
      No rendering available for block type{' '}
      <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs dark:bg-gray-800">
        {envelope.blockType}
      </code>
      .
    </div>
  )
}

export default BlockView
