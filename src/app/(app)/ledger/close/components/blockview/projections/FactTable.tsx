'use client'

import type { FC } from 'react'
import { useMemo } from 'react'
import type { FactRow } from '../../FactsTable'
import FactsTable from '../../FactsTable'
import type { EnvelopeBlock } from '../types'

interface FactTableProjectionProps {
  envelope: EnvelopeBlock
}

/**
 * Charlie's `FactTable` View projection.
 *
 * Uniform across every block type — flattens `envelope.facts` into a
 * raw fact-table view. Element name + qname are looked up from
 * `envelope.elements` (single in-memory join, no extra fetch).
 *
 * This is the "X-ray" of an Information Block: shows exactly which
 * atoms back the rendered view, period-by-period.
 */
/**
 * Nonnumeric facts carry their narrative in `textValue` (`value` is
 * null); the fact table shows a truncated head of the text in the
 * value column, with no unit (the OLTP row's USD default is a storage
 * artifact, not a measurement).
 */
const TEXT_PREVIEW_CHARS = 80

const factValueCell = (fact: EnvelopeBlock['facts'][number]) => {
  if (fact.value !== null && fact.value !== undefined) return fact.value
  const text = fact.textValue ?? ''
  return text.length > TEXT_PREVIEW_CHARS
    ? `${text.slice(0, TEXT_PREVIEW_CHARS)}…`
    : text
}

const FactTableProjection: FC<FactTableProjectionProps> = ({ envelope }) => {
  const factRows = useMemo<FactRow[]>(() => {
    const elementsById = new Map(envelope.elements.map((e) => [e.id, e]))
    return envelope.facts.map((fact) => {
      const element = elementsById.get(fact.elementId)
      return {
        elementName: element?.name ?? '',
        elementQname: element?.qname ?? fact.elementId,
        periodStart: fact.periodStart ?? fact.periodEnd,
        periodEnd: fact.periodEnd,
        value: factValueCell(fact),
        unit: fact.factType === 'Nonnumeric' ? null : fact.unit,
      }
    })
  }, [envelope.elements, envelope.facts])

  return <FactsTable facts={factRows} />
}

export default FactTableProjection
