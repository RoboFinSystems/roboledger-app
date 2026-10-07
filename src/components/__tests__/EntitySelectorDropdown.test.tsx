import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockUseGraphContext = vi.fn()
const mockScope = vi.fn()
const mockSelect = vi.fn()
const mockOpenCreateGraph = vi.fn()

vi.mock('@robosystems/core', () => ({
  GraphFilters: {
    roboledger: (graph: any) =>
      graph.graphType === 'entity' &&
      graph.schemaExtensions?.includes('roboledger'),
  },
  useGraphContext: () => mockUseGraphContext(),
  useEntity: vi.fn(),
  clients: { ledger: {} },
}))

vi.mock('@/lib/entity-scope', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>
  return { ...actual, useEntityScope: () => mockScope() }
})

vi.mock('@/lib/cross-app', () => ({
  useCreateGraphHandoff: () => ({
    openCreateGraph: mockOpenCreateGraph,
    isOpening: false,
  }),
}))

vi.mock('react-icons/hi', () => ({
  HiChevronDown: () => <span data-testid="chevron" />,
  HiOfficeBuilding: () => <span data-testid="office-icon" />,
  HiPlus: () => <span />,
  HiSearch: () => <span />,
}))

import { EntitySelectorDropdown } from '../EntitySelectorDropdown'

const makeGraph = (id: string, name: string) => ({
  graphId: id,
  graphName: name,
  graphType: 'entity' as const,
  schemaExtensions: ['roboledger'],
  isSubgraph: false,
  isRepository: false,
  createdAt: '2025-01-01T00:00:00Z',
})

const entity = (over: Record<string, unknown>) => ({
  id: 'ent',
  name: 'Entity',
  legalName: null,
  ticker: null,
  cik: null,
  industry: null,
  entityType: null,
  status: 'active',
  isParent: false,
  parentEntityId: null,
  ownershipPct: null,
  source: 'native',
  sourceGraphId: null,
  connectionId: null,
  createdAt: null,
  updatedAt: null,
  ...over,
})

const parent = entity({ id: 'ent_p', name: 'Harbinger', isParent: true })
const sub = entity({
  id: 'ent_s',
  name: 'Maple Court',
  parentEntityId: 'ent_p',
  ticker: 'MCL',
})
const bParent = entity({ id: 'ent_b', name: 'Beta Co', isParent: true })

const graphA = makeGraph('kg_a', 'Graph A')
const graphB = makeGraph('kg_b', 'Graph B')

function scope(over: Record<string, unknown> = {}) {
  mockScope.mockReturnValue({
    entitiesByGraph: new Map([
      ['kg_a', [parent, sub]],
      ['kg_b', [bParent]],
    ]),
    entities: [parent, sub],
    entity: parent,
    parent,
    entityId: null,
    isLoading: false,
    select: mockSelect,
    refresh: vi.fn(),
    ...over,
  })
}

describe('EntitySelectorDropdown', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSelect.mockResolvedValue(undefined)
    mockUseGraphContext.mockReturnValue({
      state: { graphs: [graphA, graphB], currentGraphId: 'kg_a' },
    })
    scope()
  })

  it('shows "Create Graph" when no graphs exist', () => {
    mockUseGraphContext.mockReturnValue({
      state: { graphs: [], currentGraphId: null },
    })
    scope({ entitiesByGraph: new Map(), entities: [], entity: null })
    render(<EntitySelectorDropdown />)
    fireEvent.click(screen.getByText('Create Graph'))
    // No argument means the hook's `_blank` default — this app's tab stays put.
    expect(mockOpenCreateGraph).toHaveBeenCalledWith()
  })

  it('names the entity in scope on the button', () => {
    scope({ entity: sub, entityId: 'ent_s' })
    render(<EntitySelectorDropdown />)
    expect(screen.getByText('Maple Court')).toBeInTheDocument()
  })

  it('lists every graph’s entities grouped by graph, subsidiaries indented', () => {
    render(<EntitySelectorDropdown />)
    fireEvent.click(screen.getByText('Harbinger'))

    expect(screen.getByText('Graph A')).toBeInTheDocument()
    expect(screen.getByText('Graph B')).toBeInTheDocument()
    expect(screen.getByText('Beta Co')).toBeInTheDocument()
    expect(screen.getByText('MCL')).toBeInTheDocument()

    const options = screen.getAllByRole('option')
    expect(options.map((o) => o.textContent)).toEqual([
      'Harbingerparent',
      'Maple CourtMCL',
      'Beta Co',
    ])
    expect(options[0]).toHaveStyle({ paddingLeft: '16px' })
    expect(options[1]).toHaveStyle({ paddingLeft: '32px' })
    expect(options[0]).toHaveAttribute('aria-selected', 'true')
    expect(options[1]).toHaveAttribute('aria-selected', 'false')
  })

  it('narrows the list as the user types', () => {
    render(<EntitySelectorDropdown />)
    fireEvent.click(screen.getByText('Harbinger'))
    const search = screen.getByLabelText('Search entities')

    fireEvent.change(search, { target: { value: 'maple' } })
    expect(screen.getAllByRole('option')).toHaveLength(1)
    expect(screen.getByText('Maple Court')).toBeInTheDocument()
    expect(screen.queryByText('Graph B')).not.toBeInTheDocument()

    // A ticker matches too.
    fireEvent.change(search, { target: { value: 'mcl' } })
    expect(screen.getAllByRole('option')).toHaveLength(1)

    // A graph name keeps all of its entities.
    fireEvent.change(search, { target: { value: 'graph b' } })
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual([
      'Beta Co',
    ])

    fireEvent.change(search, { target: { value: 'zzz' } })
    expect(screen.getByText('No entities match “zzz”.')).toBeInTheDocument()
  })

  it('hands a pick to the scope with its graph, and closes', async () => {
    render(<EntitySelectorDropdown />)
    fireEvent.click(screen.getByText('Harbinger'))
    fireEvent.click(screen.getByText('Beta Co'))

    expect(mockSelect).toHaveBeenCalledWith(bParent, 'kg_b')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('offers a new entity in the selected graph and a new graph', () => {
    render(<EntitySelectorDropdown />)
    fireEvent.click(screen.getByText('Harbinger'))

    expect(screen.getByText('Add Entity').closest('a')).toHaveAttribute(
      'href',
      '/entities?new=1'
    )
    fireEvent.click(screen.getByText('New Graph'))
    expect(mockOpenCreateGraph).toHaveBeenCalledWith()
  })

  it('says it is loading before the first list arrives', () => {
    scope({
      entitiesByGraph: new Map(),
      entities: [],
      entity: null,
      parent: null,
      isLoading: true,
    })
    render(<EntitySelectorDropdown />)
    fireEvent.click(screen.getByText('Select Entity'))
    expect(screen.getByText('Loading entities...')).toBeInTheDocument()
  })

  it('is disabled when the graphs hold no entity', () => {
    scope({
      entitiesByGraph: new Map(),
      entities: [],
      entity: null,
      parent: null,
    })
    render(<EntitySelectorDropdown />)
    expect(screen.getByText('Select Entity').closest('button')).toBeDisabled()
  })
})
