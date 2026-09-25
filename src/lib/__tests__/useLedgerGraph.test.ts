import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockUseGraphContext = vi.fn()

vi.mock('@robosystems/core', () => ({
  GraphFilters: {
    roboledger: (g: any) => g.schemaExtensions?.includes('roboledger'),
  },
  useGraphContext: () => mockUseGraphContext(),
}))

import { useLedgerGraph } from '../useLedgerGraph'

const ledgerA = { graphId: 'kg_a', schemaExtensions: ['roboledger'] }
const ledgerB = { graphId: 'kg_b', schemaExtensions: ['roboledger'] }
const investor = { graphId: 'kg_i', schemaExtensions: ['roboinvestor'] }

const withState = (graphs: any[], currentGraphId: string | null) =>
  mockUseGraphContext.mockReturnValue({ state: { graphs, currentGraphId } })

describe('useLedgerGraph', () => {
  beforeEach(() => mockUseGraphContext.mockReset())

  it('returns the selected graph when it is a ledger graph', () => {
    withState([ledgerA, ledgerB], 'kg_b')
    const { result } = renderHook(() => useLedgerGraph())
    expect(result.current.graph?.graphId).toBe('kg_b')
    expect(result.current.mismatch).toBe(false)
  })

  it('never falls back to another ledger graph', () => {
    withState([investor, ledgerA], 'kg_i')
    const { result } = renderHook(() => useLedgerGraph())
    expect(result.current.graph).toBeNull()
    expect(result.current.mismatch).toBe(true)
    expect(result.current.ledgerGraphs.map((g) => g.graphId)).toEqual(['kg_a'])
  })

  it('is not a mismatch when the user has no ledger graph at all', () => {
    withState([investor], 'kg_i')
    const { result } = renderHook(() => useLedgerGraph())
    expect(result.current.graph).toBeNull()
    expect(result.current.mismatch).toBe(false)
  })
})
