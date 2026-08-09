import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockListBlockedSourceGraphs = vi.fn()
const mockUnblockSourceGraph = vi.fn()
const mockUseGraphContext = vi.fn()

vi.mock('@robosystems/core', () => ({
  clients: {
    ledger: {
      listBlockedSourceGraphs: (...args: any[]) =>
        mockListBlockedSourceGraphs(...args),
      unblockSourceGraph: (...args: any[]) => mockUnblockSourceGraph(...args),
    },
  },
  GraphFilters: {
    roboledger: (graph: any) =>
      graph.graphType === 'entity' &&
      graph.schemaExtensions?.includes('roboledger'),
  },
  useGraphContext: () => mockUseGraphContext(),
  PageLayout: ({ children }: any) => <div>{children}</div>,
  PageHeader: ({ title }: any) => <div data-testid="page-header">{title}</div>,
  LoadingState: () => <div data-testid="loading-state" role="status" />,
  EmptyState: ({ title, description }: any) => (
    <div data-testid="empty-state">
      <h3>{title}</h3>
      {description}
    </div>
  ),
}))

vi.mock('flowbite-react', () => ({
  Alert: ({ children }: any) => <div data-testid="alert">{children}</div>,
  Button: ({ children, onClick, disabled }: any) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
  Card: ({ children }: any) => <div>{children}</div>,
  Modal: ({ children, show }: any) =>
    show ? <div data-testid="modal">{children}</div> : null,
  ModalBody: ({ children }: any) => <div>{children}</div>,
  ModalFooter: ({ children }: any) => <div>{children}</div>,
  ModalHeader: ({ children }: any) => <div>{children}</div>,
  Spinner: () => <span role="status" />,
  Table: ({ children }: any) => <table>{children}</table>,
  TableBody: ({ children }: any) => <tbody>{children}</tbody>,
  TableCell: ({ children }: any) => <td>{children}</td>,
  TableHead: ({ children }: any) => <thead>{children}</thead>,
  TableHeadCell: ({ children }: any) => <th>{children}</th>,
  TableRow: ({ children }: any) => <tr>{children}</tr>,
}))

import BlockedSendersContent from '../content'

const ledgerGraph = (role: string) => ({
  graphId: 'kg_mine',
  graphType: 'entity',
  schemaExtensions: ['roboledger'],
  role,
})

const setGraphRole = (role: string) =>
  mockUseGraphContext.mockReturnValue({
    state: { graphs: [ledgerGraph(role)], currentGraphId: 'kg_mine' },
  })

const blockedRow = {
  id: 'blk_1',
  sourceGraphId: 'kg_sender',
  sourceGraphName: 'Acme Capital',
  blockedBy: 'user_7',
  blockedAt: '2026-08-09T12:00:00Z',
  reason: 'Sent the wrong quarter',
}

describe('BlockedSendersContent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setGraphRole('admin')
    mockListBlockedSourceGraphs.mockResolvedValue([])
  })

  it('renders an empty state pointing at where blocking happens', async () => {
    render(<BlockedSendersContent />)
    await waitFor(() =>
      expect(screen.getByTestId('empty-state')).toBeInTheDocument()
    )
    expect(screen.getByText('No blocked senders')).toBeInTheDocument()
  })

  it('lists who is blocked, by whom, and why', async () => {
    mockListBlockedSourceGraphs.mockResolvedValue([blockedRow])
    render(<BlockedSendersContent />)

    await waitFor(() =>
      expect(screen.getByText('Acme Capital')).toBeInTheDocument()
    )
    expect(screen.getByText('kg_sender')).toBeInTheDocument()
    expect(screen.getByText('Sent the wrong quarter')).toBeInTheDocument()
    expect(screen.getByText('by user_7')).toBeInTheDocument()
  })

  it('requests the first page scoped to the current graph', async () => {
    render(<BlockedSendersContent />)
    await waitFor(() =>
      expect(mockListBlockedSourceGraphs).toHaveBeenCalledWith('kg_mine', {
        limit: 50,
        offset: 0,
      })
    )
  })

  it('offers unblock to an admin and lifts the block on confirm', async () => {
    mockListBlockedSourceGraphs.mockResolvedValue([blockedRow])
    mockUnblockSourceGraph.mockResolvedValue({ source_graph_id: 'kg_sender' })
    render(<BlockedSendersContent />)

    await waitFor(() =>
      expect(screen.getByText('Acme Capital')).toBeInTheDocument()
    )
    fireEvent.click(screen.getByRole('button', { name: 'Unblock' }))

    // Confirm step, not a bare click-through.
    await waitFor(() => expect(screen.getByTestId('modal')).toBeInTheDocument())
    const confirm = screen
      .getAllByRole('button', { name: 'Unblock' })
      .find((b) => b.closest('[data-testid="modal"]'))
    fireEvent.click(confirm!)

    await waitFor(() =>
      expect(mockUnblockSourceGraph).toHaveBeenCalledWith(
        'kg_mine',
        'kg_sender'
      )
    )
  })

  it('hides unblock from a non-admin and says why', async () => {
    setGraphRole('member')
    mockListBlockedSourceGraphs.mockResolvedValue([blockedRow])
    render(<BlockedSendersContent />)

    await waitFor(() =>
      expect(screen.getByText('Acme Capital')).toBeInTheDocument()
    )
    expect(
      screen.queryByRole('button', { name: 'Unblock' })
    ).not.toBeInTheDocument()
    expect(
      screen.getByText('Lifting a block requires the graph admin role.')
    ).toBeInTheDocument()
  })

  it('surfaces a mapped message rather than the raw SDK envelope on failure', async () => {
    mockListBlockedSourceGraphs.mockResolvedValue([blockedRow])
    mockUnblockSourceGraph.mockRejectedValue(
      new Error(
        'Unblock source graph failed: {"detail":"Lifting a block requires the graph admin role."}'
      )
    )
    render(<BlockedSendersContent />)

    await waitFor(() =>
      expect(screen.getByText('Acme Capital')).toBeInTheDocument()
    )
    fireEvent.click(screen.getByRole('button', { name: 'Unblock' }))
    await waitFor(() => expect(screen.getByTestId('modal')).toBeInTheDocument())
    const confirm = screen
      .getAllByRole('button', { name: 'Unblock' })
      .find((b) => b.closest('[data-testid="modal"]'))
    fireEvent.click(confirm!)

    await waitFor(() =>
      expect(
        screen.getByText('Lifting a block requires the graph admin role.')
      ).toBeInTheDocument()
    )
    expect(screen.queryByText(/failed: \{/)).not.toBeInTheDocument()
  })
})
