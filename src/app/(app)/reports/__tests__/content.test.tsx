import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockListReports = vi.fn()
let onGraphWrites: (() => void) | null = null

vi.mock('@robosystems/core', () => ({
  clients: {
    reports: {
      listReports: (...args: any[]) => mockListReports(...args),
    },
  },
  useGraphWrites: (_graphId: string | null | undefined, cb: () => void) => {
    onGraphWrites = cb
  },
  GraphFilters: {
    roboledger: (graph: any) =>
      graph.graphType === 'entity' &&
      graph.schemaExtensions?.includes('roboledger'),
  },
  useGraphContext: () => ({
    state: {
      graphs: [
        {
          graphId: 'kg_mine',
          graphName: 'Mine',
          graphType: 'entity',
          schemaExtensions: ['roboledger'],
        },
      ],
      currentGraphId: 'kg_mine',
    },
  }),
  PageLayout: ({ children }: any) => <div>{children}</div>,
  PageHeader: ({ title }: any) => <div>{title}</div>,
  LoadingState: () => <div role="status" />,
  EmptyState: ({ title, description }: any) => (
    <div data-testid="empty-state">
      <h3>{title}</h3>
      {description}
    </div>
  ),
}))

vi.mock('@/components/DocsLink', () => ({ default: () => null }))

// One stable object: the page reloads whenever the graph's identity changes.
const { GRAPH } = vi.hoisted(() => ({
  GRAPH: { graphId: 'kg_mine', graphName: 'Mine' },
}))
vi.mock('@/lib/useLedgerGraph', () => ({
  useLedgerGraph: () => ({ graph: GRAPH }),
}))

import ReportsContent from '../content'

const report = (id: string, filingStatus: string) => ({
  id,
  name: id,
  filingStatus,
  generationStatus: 'published',
  periodType: 'annual',
  periodStart: '2025-01-01',
  periodEnd: '2025-12-31',
  createdAt: '2026-01-01T00:00:00Z',
  sourceGraphId: null,
  structures: [],
})

describe('ReportsContent', () => {
  beforeEach(() => {
    mockListReports.mockReset()
  })

  it('lists current reports by default and shows their filing status', async () => {
    mockListReports.mockResolvedValue([report('FY2025', 'filed')])
    render(<ReportsContent />)

    await waitFor(() => expect(screen.getByText('FY2025')).toBeInTheDocument())
    expect(mockListReports).toHaveBeenCalledWith('kg_mine', {
      lifecycle: 'CURRENT',
    })
    expect(screen.getByText('Filing')).toBeInTheDocument()
    expect(screen.getByText('Filed')).toBeInTheDocument()
  })

  it('switches to the archived reports', async () => {
    mockListReports.mockImplementation(async (_graphId, { lifecycle }) =>
      lifecycle === 'ARCHIVED' ? [report('FY2024', 'archived')] : []
    )
    render(<ReportsContent />)
    await waitFor(() =>
      expect(screen.getByText('No Reports Found')).toBeInTheDocument()
    )

    fireEvent.click(screen.getByRole('button', { name: 'Archived' }))

    expect(await screen.findByText('FY2024')).toBeInTheDocument()
    expect(mockListReports).toHaveBeenLastCalledWith('kg_mine', {
      lifecycle: 'ARCHIVED',
    })
    expect(screen.getAllByText('Archived').length).toBeGreaterThan(1)
  })

  it('reloads after a console write, keeping the table on screen', async () => {
    mockListReports.mockResolvedValueOnce([report('FY2025', 'filed')])
    render(<ReportsContent />)
    await waitFor(() => expect(screen.getByText('FY2025')).toBeInTheDocument())

    let finishReload: (rows: unknown[]) => void = () => {}
    mockListReports.mockReturnValueOnce(
      new Promise((resolve) => {
        finishReload = resolve
      })
    )
    act(() => onGraphWrites?.())

    await waitFor(() => expect(mockListReports).toHaveBeenCalledTimes(2))
    // Mid-reload the existing rows stay, with no spinner in their place.
    expect(screen.getByText('FY2025')).toBeInTheDocument()
    expect(screen.queryByRole('status')).toBeNull()

    await act(async () => {
      finishReload([report('FY2025', 'filed'), report('September', 'draft')])
    })
    expect(await screen.findByText('September')).toBeInTheDocument()
  })

  it('explains an empty archived view', async () => {
    mockListReports.mockResolvedValue([])
    render(<ReportsContent />)
    await waitFor(() => expect(mockListReports).toHaveBeenCalledTimes(1))

    fireEvent.click(screen.getByRole('button', { name: 'Archived' }))

    await waitFor(() =>
      expect(screen.getByText('No Archived Reports')).toBeInTheDocument()
    )
  })
})
