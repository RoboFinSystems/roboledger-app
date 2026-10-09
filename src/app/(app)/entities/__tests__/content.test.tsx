import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockGetFiscalCalendar = vi.fn()
const mockUseGraphContext = vi.fn()
const mockLedgerGraph = vi.fn()
const mockScope = vi.fn()
const mockSelect = vi.fn()
const mockRefresh = vi.fn()
let mockSearch = ''

vi.mock('@robosystems/core', () => ({
  clients: {
    ledger: {
      getFiscalCalendar: (...args: any[]) => mockGetFiscalCalendar(...args),
    },
  },
  GraphFilters: {
    roboledger: (graph: any) => graph.schemaExtensions?.includes('roboledger'),
  },
  PageLayout: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  useGraphContext: () => mockUseGraphContext(),
  useEntity: vi.fn(),
  PageHeader: ({ title, subtitle, actions }: any) => (
    <div data-testid="page-header">
      <h1>{title}</h1>
      {subtitle ? <p>{subtitle}</p> : null}
      {actions}
    </div>
  ),
  LoadingState: ({ message }: any) => (
    <div data-testid="loading-state" role="status">
      {message ?? 'Loading'}
    </div>
  ),
  EmptyState: ({ title, description, action }: any) => (
    <div data-testid="empty-state">
      <h3>{title}</h3>
      {description}
      {action}
    </div>
  ),
}))

vi.mock('@/lib/useLedgerGraph', () => ({
  useLedgerGraph: () => mockLedgerGraph(),
}))

vi.mock('@/lib/entity-scope', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>
  return { ...actual, useEntityScope: () => mockScope() }
})

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(mockSearch),
}))

vi.mock('../components/NewEntityModal', () => ({
  default: ({ open, entities, onCreated, onClose }: any) =>
    open ? (
      <div data-testid="new-entity-modal">
        <span>{entities.length} in picker</span>
        <button onClick={() => onCreated({ id: 'ent_new' })}>created</button>
        <button onClick={onClose}>close</button>
      </div>
    ) : null,
}))

vi.mock('flowbite-react', () => ({
  Alert: ({ children }: any) => <div role="alert">{children}</div>,
  Badge: ({ children }: any) => <span>{children}</span>,
  Button: ({ children, onClick, disabled }: any) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
  Card: ({ children }: any) => <div>{children}</div>,
  Label: ({ children }: any) => <label>{children}</label>,
  Select: ({ children, ...props }: any) => (
    <select {...props}>{children}</select>
  ),
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
  HiCalendar: () => <span />,
  HiOfficeBuilding: () => <span />,
  HiPlus: () => <span />,
  HiSearch: () => <span />,
}))

import EntitiesListPageContent from '../content'

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

const parent = entity({
  id: 'ent_p',
  name: 'Harbinger',
  isParent: true,
  entityType: 'corporation',
  ticker: 'HRB',
})
const sub = entity({
  id: 'ent_s',
  name: 'Maple Court',
  parentEntityId: 'ent_p',
  ownershipPct: 100,
  entityType: 'llc',
  ticker: 'MCL',
})

const graphA = {
  graphId: 'kg_a',
  graphName: 'Harbinger Group',
  schemaExtensions: ['roboledger'],
}

function scope(over: Record<string, unknown> = {}) {
  mockScope.mockReturnValue({
    entitiesByGraph: new Map([['kg_a', [parent, sub]]]),
    entities: [parent, sub],
    entity: parent,
    parent,
    entityId: null,
    isLoading: false,
    select: mockSelect,
    refresh: mockRefresh,
    ...over,
  })
}

describe('EntitiesListPageContent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSearch = ''
    mockUseGraphContext.mockReturnValue({
      state: { graphs: [graphA], currentGraphId: 'kg_a', isLoading: false },
    })
    mockLedgerGraph.mockReturnValue({
      graph: graphA,
      ledgerGraphs: [graphA],
      mismatch: false,
    })
    mockGetFiscalCalendar.mockImplementation(
      (_graphId: string, options: { entityId: string | null }) =>
        Promise.resolve({
          closedThrough: options.entityId === null ? '2026-08' : '2026-07',
        })
    )
    scope()
  })

  it('shows the empty state when no ledger graph is selected', () => {
    mockLedgerGraph.mockReturnValue({
      graph: null,
      ledgerGraphs: [],
      mismatch: false,
    })
    mockUseGraphContext.mockReturnValue({
      state: { graphs: [], currentGraphId: null, isLoading: false },
    })
    scope({
      entitiesByGraph: new Map(),
      entities: [],
      entity: null,
      parent: null,
    })
    render(<EntitiesListPageContent />)
    expect(screen.getByText('No Ledger Found')).toBeInTheDocument()
  })

  it('shows the loading state before the list arrives', () => {
    scope({ entities: [], entity: null, parent: null, isLoading: true })
    render(<EntitiesListPageContent />)
    expect(screen.getByTestId('loading-state')).toBeInTheDocument()
  })

  it('lists the group in hierarchy order with the close status of each entity', async () => {
    render(<EntitiesListPageContent />)

    expect(screen.getByText('Harbinger Group · 2 entities')).toBeInTheDocument()
    expect(screen.getByText('Harbinger')).toBeInTheDocument()
    expect(screen.getByText('group parent')).toBeInTheDocument()
    expect(screen.getByText('Maple Court')).toBeInTheDocument()
    expect(screen.getByText('Corporation')).toBeInTheDocument()
    expect(screen.getByText('LLC')).toBeInTheDocument()
    expect(screen.getByText('100%')).toBeInTheDocument()

    // Each entity closes on its own calendar: the parent is the server's
    // default (null), the subsidiary is named.
    expect(await screen.findByText('2026-08')).toBeInTheDocument()
    expect(await screen.findByText('2026-07')).toBeInTheDocument()
    expect(mockGetFiscalCalendar).toHaveBeenCalledWith('kg_a', {
      entityId: null,
    })
    expect(mockGetFiscalCalendar).toHaveBeenCalledWith('kg_a', {
      entityId: 'ent_s',
    })

    // The row in scope is marked; the other offers Select.
    expect(screen.getByText('selected')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Select' }))
    expect(mockSelect).toHaveBeenCalledWith(sub, 'kg_a')
  })

  it('offers calendar setup where an entity has none', async () => {
    mockGetFiscalCalendar.mockResolvedValue(null)
    render(<EntitiesListPageContent />)
    expect(
      await screen.findAllByRole('button', { name: /Set up calendar/ })
    ).toHaveLength(2)
  })

  it('tells a calendar with nothing closed from no calendar', async () => {
    mockGetFiscalCalendar.mockResolvedValue({
      closedThrough: null,
      fiscalYearStartMonth: 1,
    })
    render(<EntitiesListPageContent />)
    expect(await screen.findAllByText('Nothing closed yet')).toHaveLength(2)
    expect(
      screen.queryByRole('button', { name: /Set up calendar/ })
    ).not.toBeInTheDocument()
  })

  it('narrows the rows as the user types', () => {
    render(<EntitiesListPageContent />)
    fireEvent.change(screen.getByPlaceholderText('Search entities…'), {
      target: { value: 'mcl' },
    })
    expect(screen.queryByText('Harbinger')).not.toBeInTheDocument()
    expect(screen.getByText('Maple Court')).toBeInTheDocument()
  })

  it('opens the create form and re-reads the group once an entity is created', async () => {
    render(<EntitiesListPageContent />)
    expect(screen.queryByTestId('new-entity-modal')).not.toBeInTheDocument()

    fireEvent.click(screen.getByText('New Entity'))
    expect(screen.getByTestId('new-entity-modal')).toBeInTheDocument()
    expect(screen.getByText('2 in picker')).toBeInTheDocument()

    fireEvent.click(screen.getByText('created'))
    await waitFor(() => expect(mockRefresh).toHaveBeenCalledTimes(1))
    expect(screen.queryByTestId('new-entity-modal')).not.toBeInTheDocument()
  })

  it('opens the create form when the header sends ?new=1', () => {
    mockSearch = 'new=1'
    render(<EntitiesListPageContent />)
    expect(screen.getByTestId('new-entity-modal')).toBeInTheDocument()
  })

  it('offers to create the first entity of an empty graph', () => {
    scope({
      entitiesByGraph: new Map([['kg_a', []]]),
      entities: [],
      entity: null,
      parent: null,
    })
    render(<EntitiesListPageContent />)
    expect(screen.getByText('No Entities Yet')).toBeInTheDocument()
    expect(screen.getAllByText('New Entity').length).toBeGreaterThan(0)
  })
})
