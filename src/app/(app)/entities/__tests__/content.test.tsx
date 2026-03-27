import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/core', () => ({
  customTheme: { card: {}, alert: {}, table: {}, textInput: {} },
  GraphFilters: {
    roboledger: (graph: any) =>
      graph.graphType === 'entity' &&
      graph.schemaExtensions?.includes('roboledger'),
  },
  PageLayout: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  useGraphContext: vi.fn(),
}))

vi.mock('@/components/PageHeader', () => ({
  PageHeader: () => <div data-testid="page-header" />,
}))

vi.mock('flowbite-react', () => ({
  Alert: ({ children }: any) => <div role="alert">{children}</div>,
  Badge: ({ children }: any) => <span>{children}</span>,
  Card: ({ children }: any) => <div>{children}</div>,
  Spinner: () => <div data-testid="spinner" />,
  Table: ({ children }: any) => <table>{children}</table>,
  TableBody: ({ children }: any) => <tbody>{children}</tbody>,
  TableCell: ({ children }: any) => <td>{children}</td>,
  TableHead: ({ children }: any) => <thead>{children}</thead>,
  TableHeadCell: ({ children }: any) => <th>{children}</th>,
  TableRow: ({ children }: any) => <tr>{children}</tr>,
  TextInput: (props: any) => <input {...props} />,
}))

vi.mock('react-icons/hi', () => ({
  HiExclamationCircle: () => <span />,
  HiOfficeBuilding: () => <span />,
  HiSearch: () => <span />,
}))

import { useGraphContext } from '@/lib/core'
import { getLedgerEntity } from '@robosystems/client'
import EntitiesListPageContent from '../content'

const mockUseGraphContext = vi.mocked(useGraphContext)
const mockGetLedgerEntity = vi.mocked(getLedgerEntity)

const makeGraph = (id: string, name: string) => ({
  graphId: id,
  graphName: name,
  graphType: 'entity' as const,
  schemaExtensions: ['roboledger'],
  isSubgraph: false,
  isRepository: false,
  createdAt: '2025-01-01T00:00:00Z',
})

describe('EntitiesListPageContent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseGraphContext.mockReturnValue({
      state: {
        graphs: [],
        currentGraphId: null,
        isLoading: false,
      },
      setCurrentGraph: vi.fn(),
    } as any)
  })

  it('shows spinner while loading', () => {
    mockUseGraphContext.mockReturnValue({
      state: {
        graphs: [makeGraph('g1', 'Graph 1')],
        currentGraphId: 'g1',
        isLoading: false,
      },
      setCurrentGraph: vi.fn(),
    } as any)

    mockGetLedgerEntity.mockReturnValue(new Promise(() => {})) // never resolves

    render(<EntitiesListPageContent />)
    expect(screen.getByTestId('spinner')).toBeInTheDocument()
  })

  it('shows empty state when no entities', async () => {
    render(<EntitiesListPageContent />)
    await waitFor(() => {
      expect(screen.getByText('No Entities Found')).toBeInTheDocument()
    })
  })

  it('loads entities in parallel via Promise.allSettled', async () => {
    const graphs = [makeGraph('g1', 'Graph 1'), makeGraph('g2', 'Graph 2')]

    mockUseGraphContext.mockReturnValue({
      state: { graphs, currentGraphId: 'g1', isLoading: false },
      setCurrentGraph: vi.fn(),
    } as any)

    mockGetLedgerEntity.mockImplementation(({ path }: any) =>
      Promise.resolve({
        data: {
          id: path.graph_id,
          name: `Entity for ${path.graph_id}`,
          parent_entity_id: null,
          is_parent: true,
          entity_type: 'corporation',
          status: 'active',
        },
      })
    )

    render(<EntitiesListPageContent />)

    await waitFor(() => {
      expect(screen.getByText('Entity for g1')).toBeInTheDocument()
      expect(screen.getByText('Entity for g2')).toBeInTheDocument()
    })

    // Both calls should have been made (parallel)
    expect(mockGetLedgerEntity).toHaveBeenCalledTimes(2)
  })

  it('handles partial failures gracefully', async () => {
    const graphs = [makeGraph('g1', 'Graph 1'), makeGraph('g2', 'Graph 2')]

    mockUseGraphContext.mockReturnValue({
      state: { graphs, currentGraphId: 'g1', isLoading: false },
      setCurrentGraph: vi.fn(),
    } as any)

    mockGetLedgerEntity
      .mockResolvedValueOnce({
        data: {
          id: 'g1',
          name: 'Entity 1',
          parent_entity_id: null,
          is_parent: true,
        },
      })
      .mockRejectedValueOnce(new Error('API error'))

    render(<EntitiesListPageContent />)

    await waitFor(() => {
      expect(screen.getByText('Entity 1')).toBeInTheDocument()
    })

    // The failed entity should not appear, but the page shouldn't crash
    expect(screen.queryByText('Entity for g2')).not.toBeInTheDocument()
  })

  it('filters non-roboledger graphs', async () => {
    const graphs = [
      makeGraph('g1', 'Ledger Graph'),
      {
        graphId: 'g2',
        graphName: 'Other Graph',
        graphType: 'generic',
        schemaExtensions: [],
        isSubgraph: false,
        isRepository: false,
        createdAt: '2025-01-01T00:00:00Z',
      },
    ]

    mockUseGraphContext.mockReturnValue({
      state: { graphs, currentGraphId: 'g1', isLoading: false },
      setCurrentGraph: vi.fn(),
    } as any)

    mockGetLedgerEntity.mockResolvedValueOnce({
      data: {
        id: 'g1',
        name: 'Ledger Entity',
        parent_entity_id: null,
        is_parent: true,
      },
    })

    render(<EntitiesListPageContent />)

    await waitFor(() => {
      expect(screen.getByText('Ledger Entity')).toBeInTheDocument()
    })

    // Only the roboledger graph should have been queried
    expect(mockGetLedgerEntity).toHaveBeenCalledTimes(1)
  })
})
