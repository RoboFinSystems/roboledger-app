import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockUseGraphContext = vi.fn()
const mockSetCurrentGraph = vi.fn()
const mockScope = vi.fn()
const mockRefresh = vi.fn()
let mockPathname = '/ledger/inbox'

vi.mock('@/lib/entity-scope', () => ({
  useEntityScope: () => mockScope(),
}))

vi.mock('@robosystems/core', () => ({
  GraphFilters: {
    roboledger: (g: any) => g.schemaExtensions?.includes('roboledger'),
  },
  useGraphContext: () => mockUseGraphContext(),
  PageLayout: ({ children }: any) => <div>{children}</div>,
  LoadingState: () => <div data-testid="loading-state" role="status" />,
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
    mockRefresh.mockReset()
    mockPathname = '/ledger/inbox'
    mockScope.mockReturnValue({
      isResolved: true,
      error: null,
      refresh: mockRefresh,
    })
  })

  it('holds the page until the entity in scope is known', () => {
    withSelected('kg_ledger')
    mockScope.mockReturnValue({
      isResolved: false,
      error: null,
      refresh: mockRefresh,
    })
    render(<LedgerGraphGate>page</LedgerGraphGate>)
    expect(screen.queryByText('page')).not.toBeInTheDocument()
    expect(screen.getByTestId('loading-state')).toBeInTheDocument()
  })

  it('says so, with a retry, when the entities could not be read', () => {
    withSelected('kg_ledger')
    mockScope.mockReturnValue({
      isResolved: true,
      error: "This graph's entities could not be loaded.",
      refresh: mockRefresh,
    })
    render(<LedgerGraphGate>page</LedgerGraphGate>)
    expect(screen.queryByText('page')).not.toBeInTheDocument()
    expect(screen.getByText('Entities could not be loaded')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Retry'))
    expect(mockRefresh).toHaveBeenCalledTimes(1)
  })

  it('does not hold a graph-independent route on the scope', () => {
    withSelected('kg_ledger')
    mockPathname = '/settings'
    mockScope.mockReturnValue({
      isResolved: false,
      error: null,
      refresh: mockRefresh,
    })
    render(<LedgerGraphGate>page</LedgerGraphGate>)
    expect(screen.getByText('page')).toBeInTheDocument()
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

  it.each(['/reports/rpt_1'])(
    'leaves %s alone (its graph does not come from the selector)',
    (path) => {
      withSelected('kg_investor')
      mockPathname = path
      render(<LedgerGraphGate>page</LedgerGraphGate>)
      expect(screen.getByText('page')).toBeInTheDocument()
    }
  )

  // /entities is the selected graph's reporting group, so it is gated too.
  it.each(['/entities', '/reports', '/reports/new', '/reports/publish-lists'])(
    'gates %s',
    (path) => {
      withSelected('kg_investor')
      mockPathname = path
      render(<LedgerGraphGate>page</LedgerGraphGate>)
      expect(screen.queryByText('page')).not.toBeInTheDocument()
    }
  )
})
