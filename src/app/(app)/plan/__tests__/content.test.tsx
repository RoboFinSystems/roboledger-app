import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockListInformationBlocks = vi.fn()
const mockGetInformationBlock = vi.fn()
const mockGetEntity = vi.fn()
const mockUseGraphContext = vi.fn()
const mockReplace = vi.fn()

let searchParams = new URLSearchParams()

vi.mock('@robosystems/core', () => ({
  customTheme: { card: {} },
  clients: {
    ledger: {
      listInformationBlocks: (...args: any[]) =>
        mockListInformationBlocks(...args),
      getInformationBlock: (...args: any[]) => mockGetInformationBlock(...args),
      getEntity: (...args: any[]) => mockGetEntity(...args),
    },
  },
  GraphFilters: {
    roboledger: (graph: any) =>
      graph.graphType === 'entity' &&
      graph.schemaExtensions?.includes('roboledger'),
  },
  PageLayout: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  useGraphContext: () => mockUseGraphContext(),
  PageHeader: ({ title, actions }: any) => (
    <div data-testid="page-header">
      {title}
      {actions}
    </div>
  ),
  LoadingState: () => (
    <div data-testid="loading-state" role="status">
      Loading
    </div>
  ),
  EmptyState: ({ title }: any) => <div data-testid="empty-state">{title}</div>,
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
  useSearchParams: () => searchParams,
}))

vi.mock('flowbite-react', () => ({
  Button: ({ children, onClick, disabled }: any) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
  Card: ({ children }: any) => <div>{children}</div>,
  Select: ({ children, onChange, value }: any) => (
    <select onChange={onChange} value={value} data-testid="scenario-select">
      {children}
    </select>
  ),
}))

vi.mock('react-icons/hi', () => ({
  HiTable: () => <span />,
  HiDownload: () => <span data-testid="icon-download" />,
  HiExclamationCircle: () => <span data-testid="icon-error" />,
}))

import PlanContent from '../content'

const GRAPH = {
  graphId: 'kg1',
  graphType: 'entity',
  schemaExtensions: ['roboledger'],
}

const BLOCKS = [
  {
    id: 'struct_is',
    blockType: 'income_statement',
    displayName: 'Income Statement',
    name: 'Income Statement',
    facts: [{ id: 'f_is' }],
  },
  {
    id: 'struct_bs',
    blockType: 'balance_sheet',
    displayName: 'Balance Sheet',
    name: 'Balance Sheet',
    facts: [{ id: 'f_bs' }],
  },
  {
    id: 'struct_cf',
    blockType: 'cash_flow_statement',
    displayName: 'Cash Flow Statement',
    name: 'Cash Flow Statement',
    facts: [{ id: 'f_cf' }],
  },
  {
    id: 'struct_budget',
    blockType: 'forecast',
    displayName: 'FY27 Operating Budget',
    name: 'FY27 Operating Budget',
    facts: [{ id: 'f_lever' }],
  },
]

const envelopeFor = (id: string) => ({
  id,
  view: {
    rendering: {
      periods: [
        { start: '2026-05-01', end: '2026-05-31', label: null, forecast: null },
        {
          start: '2026-06-01',
          end: '2026-06-30',
          label: 'Jun 2026 (forecast)',
          forecast: true,
        },
      ],
      rows: [
        {
          elementId: `${id}_row`,
          elementQname: null,
          elementName: `${id} row`,
          classification: null,
          balanceType: null,
          itemType: null,
          values: [1, 2],
          textValue: null,
          isSubtotal: false,
          depth: 0,
        },
      ],
      validation: null,
      unmappedCount: 0,
    },
    chart: null,
  },
})

describe('PlanContent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    searchParams = new URLSearchParams()
    mockUseGraphContext.mockReturnValue({
      state: { graphs: [GRAPH], currentGraphId: 'kg1', isLoading: false },
    })
    mockListInformationBlocks.mockResolvedValue(BLOCKS)
    mockGetEntity.mockResolvedValue({ name: 'Driftline Coffee' })
    mockGetInformationBlock.mockImplementation(async (_g: string, id: string) =>
      envelopeFor(id)
    )
  })

  it('defaults to the first forecast scenario and loads every section in series mode', async () => {
    render(<PlanContent />)

    // The scenario's own envelope = the assumptions grid (no series).
    await waitFor(() =>
      expect(mockGetInformationBlock).toHaveBeenCalledWith(
        'kg1',
        'struct_budget'
      )
    )
    // Every statement family reads in series mode with the scenario.
    for (const id of ['struct_is', 'struct_bs', 'struct_cf']) {
      expect(mockGetInformationBlock).toHaveBeenCalledWith('kg1', id, {
        scenarioId: 'struct_budget',
        series: true,
      })
    }
    expect(await screen.findByTestId('plan-grid')).toBeInTheDocument()
    expect(screen.getByTestId('plan-section-Assumptions')).toBeInTheDocument()
    expect(
      screen.getByTestId('plan-section-Income Statement')
    ).toBeInTheDocument()
  })

  it('?scenario=actuals reads statements without a scenario or assumptions', async () => {
    searchParams = new URLSearchParams('scenario=actuals')
    render(<PlanContent />)

    await waitFor(() =>
      expect(mockGetInformationBlock).toHaveBeenCalledWith('kg1', 'struct_is', {
        series: true,
      })
    )
    expect(mockGetInformationBlock).not.toHaveBeenCalledWith(
      'kg1',
      'struct_budget'
    )
    await screen.findByTestId('plan-grid')
    expect(
      screen.queryByTestId('plan-section-Assumptions')
    ).not.toBeInTheDocument()
  })

  it('shows the empty state when no qualifying graph exists', () => {
    mockUseGraphContext.mockReturnValue({
      state: { graphs: [], currentGraphId: null, isLoading: false },
    })
    render(<PlanContent />)
    expect(screen.getByTestId('empty-state')).toBeInTheDocument()
    expect(mockListInformationBlocks).not.toHaveBeenCalled()
  })

  it('surfaces a list-load failure', async () => {
    mockListInformationBlocks.mockRejectedValue(new Error('boom'))
    render(<PlanContent />)
    expect(
      await screen.findByText('Failed to load information blocks.')
    ).toBeInTheDocument()
  })
})
