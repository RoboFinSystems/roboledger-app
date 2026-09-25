import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockUseGraphContext = vi.fn()
const mockSetCurrentGraph = vi.fn()
let mockPathname = '/ledger/inbox'

vi.mock('@robosystems/core', () => ({
  GraphFilters: {
    roboledger: (g: any) => g.schemaExtensions?.includes('roboledger'),
  },
  useGraphContext: () => mockUseGraphContext(),
  PageLayout: ({ children }: any) => <div>{children}</div>,
  EmptyState: ({ title, action }: any) => (
    <div>
      <h2>{title}</h2>
      {action}
    </div>
  ),
}))

vi.mock('flowbite-react', () => ({
  Button: ({ children, onClick }: any) => (
    <button onClick={onClick}>{children}</button>
  ),
  Card: ({ children }: any) => <div>{children}</div>,
}))

vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
}))

import { LedgerGraphGate } from '../LedgerGraphGate'

const ledger = {
  graphId: 'kg_ledger',
  graphName: 'Books',
  schemaExtensions: ['roboledger'],
}
const investor = { graphId: 'kg_investor', schemaExtensions: ['roboinvestor'] }

const withSelected = (currentGraphId: string) =>
  mockUseGraphContext.mockReturnValue({
    state: { graphs: [investor, ledger], currentGraphId },
    setCurrentGraph: mockSetCurrentGraph,
  })

describe('LedgerGraphGate', () => {
  beforeEach(() => {
    mockSetCurrentGraph.mockReset()
    mockPathname = '/ledger/inbox'
  })

  it('renders the page for a ledger graph', () => {
    withSelected('kg_ledger')
    render(<LedgerGraphGate>page</LedgerGraphGate>)
    expect(screen.getByText('page')).toBeInTheDocument()
  })

  it('shows the switch prompt instead of the page for a non-ledger graph', () => {
    withSelected('kg_investor')
    render(<LedgerGraphGate>page</LedgerGraphGate>)
    expect(screen.queryByText('page')).not.toBeInTheDocument()
    expect(screen.getByText('Select a RoboLedger graph')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Books' }))
    expect(mockSetCurrentGraph).toHaveBeenCalledWith('kg_ledger')
  })

  it('leaves graph-independent routes alone', () => {
    withSelected('kg_investor')
    mockPathname = '/entities'
    render(<LedgerGraphGate>page</LedgerGraphGate>)
    expect(screen.getByText('page')).toBeInTheDocument()
  })
})
