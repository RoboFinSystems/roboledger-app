'use client'

import type { FC } from 'react'
import type { ViewMode } from '../ViewModeToggle'
import BusinessRulesProjection from './projections/BusinessRules'
import ChartRenderingProjection from './projections/ChartRendering'
import FactTableProjection from './projections/FactTable'
import MetricRenderingProjection from './projections/MetricRendering'
import ReportElementsProjection from './projections/ReportElements'
import ScheduleRenderingProjection from './projections/ScheduleRendering'
import StatementRenderingProjection from './projections/StatementRendering'
import TextBlockRenderingProjection from './projections/TextBlockRendering'
import VerificationResultsProjection from './projections/VerificationResults'
import type { EnvelopeBlock } from './types'
import {
  DISCLOSURE_BLOCK_TYPE,
  isStatementBlockType,
  isTextBlockEnvelope,
} from './types'

interface BlockViewProps {
  envelope: EnvelopeBlock
  viewMode: ViewMode
  /**
   * Entity name passed through to the statement header. Optional —
   * package mode (Plan C) supplies it from the Report Block context;
   * closing-book mode reads it from the parent panel state.
   */
  entityName?: string | null
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
const BlockView: FC<BlockViewProps> = ({ envelope, viewMode, entityName }) => {
  if (viewMode === 'chart') {
    return (
      <ChartRenderingProjection envelope={envelope} entityName={entityName} />
    )
  }

  if (viewMode === 'facts') {
    return <FactTableProjection envelope={envelope} />
  }

  if (viewMode === 'elements') {
    return <ReportElementsProjection envelope={envelope} />
  }

  if (viewMode === 'validation') {
    return <VerificationResultsProjection envelope={envelope} />
  }

  if (viewMode === 'rules') {
    return <BusinessRulesProjection envelope={envelope} />
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
    return <ScheduleRenderingProjection envelope={envelope} />
  }

  // Metric blocks — standing multi-period time series with mixed value
  // kinds (monetary + pure ratios), so cells format per-element rather
  // than uniformly as currency.
  if (envelope.blockType === 'metric') {
    return (
      <MetricRenderingProjection envelope={envelope} entityName={entityName} />
    )
  }

  // Disclosure notes — text-block CAPs carry narrative (`textValue`
  // rows); every other CAP (e.g. an inventory-note roll_up) renders
  // the same numeric grid as the statement family. Mirrors the
  // server-side dispatch in `information_block/disclosure.py`.
  if (envelope.blockType === DISCLOSURE_BLOCK_TYPE) {
    return isTextBlockEnvelope(envelope) ? (
      <TextBlockRenderingProjection
        envelope={envelope}
        entityName={entityName}
      />
    ) : (
      <StatementRenderingProjection
        envelope={envelope}
        entityName={entityName}
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
