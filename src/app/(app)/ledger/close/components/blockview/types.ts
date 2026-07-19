/**
 * Type aliases for the Information Block envelope as consumed by
 * `BlockView` and its projection components. These are projections of
 * the SDK's `InformationBlock` GraphQL response type.
 *
 * The envelope is the molecular exchange format Charlie's ontology
 * refers to: a (Structure, FactSet) pair bundled with elements,
 * connections, facts, rules, verification results, and server-computed
 * view projections. See `local/docs/specs/financial-viewer.md` and
 * `local/docs/specs/information-block.md` for the data model.
 */

import type { InformationBlock } from '@robosystems/client/clients'

export type EnvelopeBlock = InformationBlock
export type EnvelopeFact = InformationBlock['facts'][number]
export type EnvelopeElement = InformationBlock['elements'][number]
export type EnvelopeConnection = InformationBlock['connections'][number]
export type EnvelopeRule = InformationBlock['rules'][number]
export type EnvelopeVerificationResult =
  InformationBlock['verificationResults'][number]
export type EnvelopeVerificationSummary = NonNullable<
  InformationBlock['verificationSummary']
>
export type EnvelopeView = InformationBlock['view']
export type EnvelopeRendering = NonNullable<EnvelopeView['rendering']>
export type EnvelopeRenderingRow = EnvelopeRendering['rows'][number]
export type EnvelopeRenderingPeriod = EnvelopeRendering['periods'][number]
export type EnvelopeValidation = NonNullable<EnvelopeRendering['validation']>

/**
 * Block-type discriminator. Mirrors the values registered server-side
 * in `BlockTypeRegistry.REGISTRY` — see
 * `robosystems/operations/information_block/registry.py`.
 */
export const STATEMENT_BLOCK_TYPES = [
  'balance_sheet',
  'income_statement',
  'cash_flow_statement',
  'equity_statement',
] as const

export type StatementBlockType = (typeof STATEMENT_BLOCK_TYPES)[number]

export const isStatementBlockType = (
  blockType: string
): blockType is StatementBlockType =>
  (STATEMENT_BLOCK_TYPES as readonly string[]).includes(blockType)

/**
 * Disclosure block type + the text-block concept-arrangement family.
 * Mirrors `DISCLOSURE_BLOCK_TYPE` and `TEXT_BLOCK_CAPS` server-side
 * (`robosystems/models/extensions/structure.py`) — the same dispatch
 * the envelope builder uses: text-block CAPs carry narrative rows
 * (`textValue`), every other disclosure CAP renders as a numeric grid.
 */
export const DISCLOSURE_BLOCK_TYPE = 'regulatory_disclosure'

export const TEXT_BLOCK_CAPS = [
  'text_block',
  'level1_textblock',
  'level2_textblock',
  'level3_textblock',
  'table_equivalent_textblock',
] as const

export const isTextBlockEnvelope = (envelope: EnvelopeBlock): boolean =>
  envelope.blockType === DISCLOSURE_BLOCK_TYPE &&
  (TEXT_BLOCK_CAPS as readonly string[]).includes(
    envelope.informationModel.conceptArrangement ?? ''
  )
