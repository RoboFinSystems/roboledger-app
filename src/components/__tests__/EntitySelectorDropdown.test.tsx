import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockSetCurrentGraph = vi.fn()
const mockSetCurrentEntity = vi.fn()
const mockNavigateToApp = vi.fn()
const mockGetEntity = vi.fn()

vi.mock('@/lib/core', () => ({
  GraphFilters: {
    roboledger: (graph: any) =>
      graph.graphType === 'entity' &&
      graph.schemaExtensions?.includes('roboledger'),
  },
  useGraphContext: vi.fn(),
  useEntity: vi.fn(),
  // The component now calls extensions.ledger.getEntity(graphId) directly
  // — no more raw `getLedgerEntity` SDK import.
  extensions: {
    ledger: {
      getEntity: (graphId: string) => mockGetEntity(graphId),
    },
  },
}))

vi.mock('@/lib/core/auth-core/sso', () => ({
  useSSO: () => ({ navigateToApp: mockNavigateToApp }),
}))

vi.mock('react-icons/hi', () => ({
  HiChevronDown: () => <span data-testid="chevron" />,
  HiOfficeBuilding: () => <span data-testid="office-icon" />,
}))

import { useEntity, useGraphContext } from '@/lib/core'
import { EntitySelectorDropdown } from '../EntitySelectorDropdown'

const mockUseGraphContext = vi.mocked(useGraphContext)
const mockUseEntity = vi.mocked(useEntity)

const makeGraph = (id: string, name: string) => ({
  graphId: id,
  graphName: name,
  graphType: 'entity' as const,
  schemaExtensions: ['roboledger'],
  isSubgraph: false,
  isRepository: false,
  createdAt: '2025-01-01T00:00:00Z',
})

describe('EntitySelectorDropdown', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseEntity.mockReturnValue({
      currentEntity: null,
      setCurrentEntity: mockSetCurrentEntity,
      clearEntity: vi.fn(),
    } as any)
    mockUseGraphContext.mockReturnValue({
      state: { graphs: [], currentGraphId: null, isLoading: false },
      setCurrentGraph: mockSetCurrentGraph,
    } as any)
  })

  it('shows "Create Graph" button when no graphs exist', () => {
    render(<EntitySelectorDropdown />)
    expect(screen.getByText('Create Graph')).toBeInTheDocument()
  })

  it('redirects to platform when Create Graph is clicked', () => {
    render(<EntitySelectorDropdown />)
    fireEvent.click(screen.getByText('Create Graph'))
    expect(mockNavigateToApp).toHaveBeenCalledWith('robosystems', '/graphs/new')
  })

  it('loads entities in parallel via Promise.allSettled', async () => {
    const graphs = [makeGraph('g1', 'Graph 1'), makeGraph('g2', 'Graph 2')]

    mockUseGraphContext.mockReturnValue({
      state: { graphs, currentGraphId: 'g1', isLoading: false },
      setCurrentGraph: mockSetCurrentGraph,
    } as any)

    mockGetEntity.mockImplementation((graphId: string) =>
      Promise.resolve({
        id: graphId,
        name: `Entity ${graphId}`,
        parentEntityId: null,
        isParent: true,
      })
    )

    render(<EntitySelectorDropdown />)

    await waitFor(() => {
      expect(mockGetEntity).toHaveBeenCalledTimes(2)
    })
  })

  it('auto-selects entity for current graph when none selected', async () => {
    const graphs = [makeGraph('g1', 'Graph 1')]

    mockUseGraphContext.mockReturnValue({
      state: { graphs, currentGraphId: 'g1', isLoading: false },
      setCurrentGraph: mockSetCurrentGraph,
    } as any)

    mockGetEntity.mockResolvedValue({
      id: 'g1',
      name: 'Auto Entity',
      parentEntityId: null,
      isParent: true,
    })

    render(<EntitySelectorDropdown />)

    await waitFor(() => {
      expect(mockSetCurrentEntity).toHaveBeenCalledWith({
        identifier: 'g1',
        name: 'Auto Entity',
        parentEntityId: null,
        isParent: true,
      })
    })
  })

  it('does not auto-select if entity is already selected', async () => {
    const graphs = [makeGraph('g1', 'Graph 1')]

    mockUseGraphContext.mockReturnValue({
      state: { graphs, currentGraphId: 'g1', isLoading: false },
      setCurrentGraph: mockSetCurrentGraph,
    } as any)

    mockUseEntity.mockReturnValue({
      currentEntity: {
        identifier: 'g1',
        name: 'Already Selected Entity',
        parentEntityId: null,
        isParent: true,
      },
      setCurrentEntity: mockSetCurrentEntity,
      clearEntity: vi.fn(),
    } as any)

    mockGetEntity.mockResolvedValue({
      id: 'g1',
      name: 'Already Selected Entity',
      parentEntityId: null,
      isParent: true,
    })

    render(<EntitySelectorDropdown />)

    await waitFor(() => {
      expect(mockGetEntity).toHaveBeenCalledTimes(1)
    })

    expect(mockSetCurrentEntity).not.toHaveBeenCalled()
  })

  it('shows selected entity name in button', async () => {
    const graphs = [makeGraph('g1', 'Graph 1')]

    mockUseGraphContext.mockReturnValue({
      state: { graphs, currentGraphId: 'g1', isLoading: false },
      setCurrentGraph: mockSetCurrentGraph,
    } as any)

    mockUseEntity.mockReturnValue({
      currentEntity: {
        identifier: 'e1',
        name: 'My Company',
        parentEntityId: null,
        isParent: true,
      },
      setCurrentEntity: mockSetCurrentEntity,
      clearEntity: vi.fn(),
    } as any)

    mockGetEntity.mockResolvedValue({
      id: 'g1',
      name: 'My Company',
      parentEntityId: null,
      isParent: true,
    })

    render(<EntitySelectorDropdown />)

    await waitFor(() => {
      expect(screen.getByText('My Company')).toBeInTheDocument()
    })
  })

  it('opens dropdown and shows entities on click', async () => {
    const graphs = [makeGraph('g1', 'Graph 1'), makeGraph('g2', 'Graph 2')]

    mockUseGraphContext.mockReturnValue({
      state: { graphs, currentGraphId: 'g1', isLoading: false },
      setCurrentGraph: mockSetCurrentGraph,
    } as any)

    mockGetEntity.mockImplementation((graphId: string) =>
      Promise.resolve({
        id: graphId,
        name: `Entity ${graphId}`,
        parentEntityId: null,
        isParent: true,
      })
    )

    render(<EntitySelectorDropdown />)

    // Wait for entities to load
    await waitFor(() => {
      expect(mockGetEntity).toHaveBeenCalledTimes(2)
    })

    // Click dropdown button
    fireEvent.click(screen.getByText('Select Entity'))

    // Should show entity names and graph names
    expect(screen.getByText('Entity g1')).toBeInTheDocument()
    expect(screen.getByText('Entity g2')).toBeInTheDocument()
    expect(screen.getByText('Graph 1')).toBeInTheDocument()
    expect(screen.getByText('Graph 2')).toBeInTheDocument()
  })

  it('switches graph and entity on selection', async () => {
    const graphs = [makeGraph('g1', 'Graph 1'), makeGraph('g2', 'Graph 2')]

    mockUseGraphContext.mockReturnValue({
      state: { graphs, currentGraphId: 'g1', isLoading: false },
      setCurrentGraph: mockSetCurrentGraph,
    } as any)

    mockGetEntity.mockImplementation((graphId: string) =>
      Promise.resolve({
        id: graphId,
        name: `Entity ${graphId}`,
        parentEntityId: null,
        isParent: true,
      })
    )

    render(<EntitySelectorDropdown />)

    await waitFor(() => {
      expect(mockGetEntity).toHaveBeenCalledTimes(2)
    })

    // Open dropdown
    fireEvent.click(screen.getByText('Select Entity'))

    // Click on Entity g2 (different graph)
    fireEvent.click(screen.getByText('Entity g2'))

    await waitFor(() => {
      expect(mockSetCurrentGraph).toHaveBeenCalledWith('g2')
      expect(mockSetCurrentEntity).toHaveBeenCalledWith({
        identifier: 'g2',
        name: 'Entity g2',
        parentEntityId: null,
        isParent: true,
      })
    })
  })

  it('handles API failures gracefully', async () => {
    const graphs = [makeGraph('g1', 'Graph 1')]

    mockUseGraphContext.mockReturnValue({
      state: { graphs, currentGraphId: 'g1', isLoading: false },
      setCurrentGraph: mockSetCurrentGraph,
    } as any)

    mockGetEntity.mockRejectedValue(new Error('Network error'))

    render(<EntitySelectorDropdown />)

    await waitFor(() => {
      expect(mockGetEntity).toHaveBeenCalledTimes(1)
    })

    // Should not crash — button should still render
    expect(screen.getByText('Select Entity')).toBeInTheDocument()
  })

  it('shows Create New Entity option in dropdown', async () => {
    const graphs = [makeGraph('g1', 'Graph 1')]

    mockUseGraphContext.mockReturnValue({
      state: { graphs, currentGraphId: 'g1', isLoading: false },
      setCurrentGraph: mockSetCurrentGraph,
    } as any)

    mockGetEntity.mockResolvedValue({
      id: 'g1',
      name: 'Entity 1',
      parentEntityId: null,
      isParent: true,
    })

    render(<EntitySelectorDropdown />)

    await waitFor(() => {
      expect(mockGetEntity).toHaveBeenCalledTimes(1)
    })

    fireEvent.click(screen.getByText('Select Entity'))

    const createButton = screen.getByText('+ Create New Entity')
    expect(createButton).toBeInTheDocument()

    fireEvent.click(createButton)
    expect(mockNavigateToApp).toHaveBeenCalledWith('robosystems', '/graphs/new')
  })
})
