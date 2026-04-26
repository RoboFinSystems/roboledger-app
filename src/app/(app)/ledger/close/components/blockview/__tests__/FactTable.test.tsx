import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

// Stub FactsTable so we can inspect exactly what the projection passes.
vi.mock('../../FactsTable', () => ({
  default: ({ facts }: any) => (
    <div data-testid="facts-table">
      {facts.map((f: any, i: number) => (
        <div key={i} data-testid={`row-${i}`}>
          {f.elementName}|{f.elementQname}|{f.value}|{f.unit}|{f.periodStart}|
          {f.periodEnd}
        </div>
      ))}
    </div>
  ),
}))

import FactTableProjection from '../projections/FactTable'
import { makeElement, makeEnvelope, makeFact } from './_envelope-fixtures'

describe('FactTableProjection', () => {
  it('looks up element name + qname by elementId from envelope.elements', () => {
    const env = makeEnvelope({
      elements: [
        makeElement({
          id: 'elem_rev',
          qname: 'us-gaap:Revenues',
          name: 'Revenue',
        }),
      ],
      facts: [makeFact({ id: 'f1', elementId: 'elem_rev', value: 8500 })],
    })
    render(<FactTableProjection envelope={env} />)
    expect(screen.getByTestId('row-0')).toHaveTextContent(
      'Revenue|us-gaap:Revenues|8500|USD|2026-01-01|2026-03-31'
    )
  })

  it('falls back to the elementId for qname when no element matches', () => {
    const env = makeEnvelope({
      elements: [],
      facts: [makeFact({ id: 'f1', elementId: 'elem_orphan', value: 10 })],
    })
    render(<FactTableProjection envelope={env} />)
    // No matching element → qname falls back to the elementId,
    // elementName is empty.
    expect(screen.getByTestId('row-0')).toHaveTextContent(
      '|elem_orphan|10|USD|2026-01-01|2026-03-31'
    )
  })

  it('uses periodEnd when periodStart is null', () => {
    const env = makeEnvelope({
      facts: [
        makeFact({
          id: 'f_inst',
          periodStart: null,
          periodEnd: '2026-03-31',
        }),
      ],
    })
    render(<FactTableProjection envelope={env} />)
    // periodStart falls back to periodEnd in the projection.
    expect(screen.getByTestId('row-0')).toHaveTextContent(
      'Revenue|us-gaap:Revenues|8500|USD|2026-03-31|2026-03-31'
    )
  })

  it('renders one fact-row per envelope.fact preserving order', () => {
    const env = makeEnvelope({
      facts: [
        makeFact({ id: 'f1', value: 1 }),
        makeFact({ id: 'f2', value: 2 }),
        makeFact({ id: 'f3', value: 3 }),
      ],
    })
    render(<FactTableProjection envelope={env} />)
    expect(screen.getByTestId('row-0')).toHaveTextContent('|1|')
    expect(screen.getByTestId('row-1')).toHaveTextContent('|2|')
    expect(screen.getByTestId('row-2')).toHaveTextContent('|3|')
  })
})
