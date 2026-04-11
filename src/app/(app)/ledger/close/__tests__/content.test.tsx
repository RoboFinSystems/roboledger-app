import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

const mockGetClosingBookStructures = vi.fn()
const mockGetEntity = vi.fn()
const mockUseGraphContext = vi.fn()

vi.mock('@/lib/core', () => ({
  customTheme: { card: {} },
  extensions: {
    ledger: {
      getClosingBookStructures: (...args: any[]) =>
        mockGetClosingBookStructures(...args),
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
}))

vi.mock('@/components/PageHeader', () => ({
  PageHeader: ({ title, actions }: any) => (
    <div data-testid="page-header">
      {title}
      {actions}
    </div>
  ),
}))

vi.mock('flowbite-react', () => ({
  Card: ({ children }: any) => <div>{children}</div>,
  Spinner: () => <div data-testid="spinner" />,
}))

vi.mock('react-icons/hi', () => ({
  HiExclamationCircle: () => <span />,
}))

vi.mock('react-icons/tb', () => ({
  TbBook2: () => <span />,
}))

// Mock all child panels to isolate orchestrator logic
vi.mock('../components/StructureSidebar', () => ({
  default: ({ categories, selectedItem }: any) => (
    <div data-testid="sidebar">
      {categories?.map((c: any) => (
        <div key={c.label} data-testid={`category-${c.label}`}>
          {c.label}: {c.items.length} items
        </div>
      ))}
      {selectedItem && <div data-testid="selected">{selectedItem.type}</div>}
    </div>
  ),
  itemToSelected: (item: any) => {
    switch (item.item_type) {
      case 'statement':
        return {
          type: 'statement',
          reportId: item.report_id || '',
          structureType: item.structure_type || '',
          label: item.name,
        }
      case 'schedule':
        return { type: 'schedule', structureId: item.id, name: item.name }
      case 'account_rollups':
        return {
          type: 'account_rollups',
          mappingId: item.id,
          name: item.name,
        }
      case 'period_close':
        return { type: 'period_close' }
      default:
        return { type: 'period_close' }
    }
  },
}))

vi.mock('../components/StatementPanel', () => ({
  default: ({ structureType }: any) => (
    <div data-testid="statement-panel">{structureType}</div>
  ),
}))

vi.mock('../components/SchedulePanel', () => ({
  default: ({ scheduleName }: any) => (
    <div data-testid="schedule-panel">{scheduleName}</div>
  ),
}))

vi.mock('../components/AccountRollupsPanel', () => ({
  default: ({ mappingId }: any) => (
    <div data-testid="rollups-panel">{mappingId}</div>
  ),
}))

vi.mock('../components/PeriodClosePanel', () => ({
  default: () => <div data-testid="period-close-panel" />,
}))

vi.mock('../components/ViewModeToggle', () => ({
  default: () => <div data-testid="view-mode-toggle" />,
}))

import CloseContent from '../content'

const makeGraph = (id: string) => ({
  graphId: id,
  graphName: 'Test Graph',
  graphType: 'entity' as const,
  schemaExtensions: ['roboledger'],
  isSubgraph: false,
  isRepository: false,
  createdAt: '2025-01-01T00:00:00Z',
})

const makeGraphState = (
  graphs: any[] = [],
  currentId: string | null = null
) => ({
  state: {
    graphs,
    currentGraphId: currentId,
    isLoading: false,
    error: null,
  },
})

describe('CloseContent', () => {
  it('shows "No Ledger Found" when no qualifying graph', () => {
    mockUseGraphContext.mockReturnValue(makeGraphState())
    render(<CloseContent />)
    expect(screen.getByText('No Ledger Found')).toBeInTheDocument()
  })

  it('shows spinner while loading sidebar data', () => {
    const graph = makeGraph('kg_test')
    mockUseGraphContext.mockReturnValue(makeGraphState([graph], 'kg_test'))
    mockGetClosingBookStructures.mockReturnValue(new Promise(() => {}))
    mockGetEntity.mockReturnValue(new Promise(() => {}))

    render(<CloseContent />)
    expect(screen.getByTestId('spinner')).toBeInTheDocument()
  })

  it('renders sidebar with categories after loading', async () => {
    const graph = makeGraph('kg_test')
    mockUseGraphContext.mockReturnValue(makeGraphState([graph], 'kg_test'))
    mockGetClosingBookStructures.mockResolvedValue({
      categories: [
        {
          label: 'Statements',
          items: [
            {
              id: 'struct_is',
              name: 'Income Statement',
              item_type: 'statement',
              structure_type: 'income_statement',
              report_id: 'rpt_01',
            },
          ],
        },
        {
          label: 'Period Close',
          items: [
            { id: 'pc', name: 'Current Period', item_type: 'period_close' },
          ],
        },
      ],
      has_data: true,
    })
    mockGetEntity.mockResolvedValue({ name: 'Harbinger LLC' })

    render(<CloseContent />)

    await waitFor(() => {
      expect(screen.getByTestId('sidebar')).toBeInTheDocument()
      expect(screen.getByTestId('category-Statements')).toBeInTheDocument()
      expect(screen.getByText('Statements: 1 items')).toBeInTheDocument()
    })
  })

  it('auto-selects first statement item', async () => {
    const graph = makeGraph('kg_test')
    mockUseGraphContext.mockReturnValue(makeGraphState([graph], 'kg_test'))
    mockGetClosingBookStructures.mockResolvedValue({
      categories: [
        {
          label: 'Statements',
          items: [
            {
              id: 'struct_is',
              name: 'Income Statement',
              item_type: 'statement',
              structure_type: 'income_statement',
              report_id: 'rpt_01',
            },
          ],
        },
      ],
      has_data: true,
    })
    mockGetEntity.mockResolvedValue(null)

    render(<CloseContent />)

    await waitFor(() => {
      expect(screen.getByTestId('statement-panel')).toBeInTheDocument()
      expect(screen.getByText('income_statement')).toBeInTheDocument()
    })
  })

  it('falls back to period_close when no categories have items', async () => {
    const graph = makeGraph('kg_test')
    mockUseGraphContext.mockReturnValue(makeGraphState([graph], 'kg_test'))
    mockGetClosingBookStructures.mockResolvedValue({
      categories: [],
      has_data: false,
    })
    mockGetEntity.mockResolvedValue(null)

    render(<CloseContent />)

    await waitFor(() => {
      expect(screen.getByTestId('period-close-panel')).toBeInTheDocument()
    })
  })

  it('shows error message on API failure', async () => {
    const graph = makeGraph('kg_test')
    mockUseGraphContext.mockReturnValue(makeGraphState([graph], 'kg_test'))
    mockGetClosingBookStructures.mockRejectedValue(new Error('Server error'))
    mockGetEntity.mockRejectedValue(new Error('Server error'))

    render(<CloseContent />)

    await waitFor(() => {
      expect(
        screen.getByText('Failed to load closing book data.')
      ).toBeInTheDocument()
    })
  })

  it('renders page header with Closing Book title', async () => {
    const graph = makeGraph('kg_test')
    mockUseGraphContext.mockReturnValue(makeGraphState([graph], 'kg_test'))
    mockGetClosingBookStructures.mockResolvedValue({
      categories: [],
      has_data: false,
    })
    mockGetEntity.mockResolvedValue(null)

    render(<CloseContent />)

    await waitFor(() => {
      expect(screen.getByText('Closing Book')).toBeInTheDocument()
    })
  })

  it('renders view mode toggle', async () => {
    const graph = makeGraph('kg_test')
    mockUseGraphContext.mockReturnValue(makeGraphState([graph], 'kg_test'))
    mockGetClosingBookStructures.mockResolvedValue({
      categories: [],
      has_data: false,
    })
    mockGetEntity.mockResolvedValue(null)

    render(<CloseContent />)

    await waitFor(() => {
      expect(screen.getByTestId('view-mode-toggle')).toBeInTheDocument()
    })
  })

  it('calls API with correct graph ID', async () => {
    const graph = makeGraph('kg_mygraph123')
    mockUseGraphContext.mockReturnValue(
      makeGraphState([graph], 'kg_mygraph123')
    )
    mockGetClosingBookStructures.mockResolvedValue({
      categories: [],
      has_data: false,
    })
    mockGetEntity.mockResolvedValue(null)

    render(<CloseContent />)

    await waitFor(() => {
      expect(mockGetClosingBookStructures).toHaveBeenCalledWith('kg_mygraph123')
      expect(mockGetEntity).toHaveBeenCalledWith('kg_mygraph123')
    })
  })
})
