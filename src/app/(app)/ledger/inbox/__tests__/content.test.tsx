import { act, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockListEventBlocks = vi.fn()
let onGraphWrites: (() => void) | null = null

vi.mock('@robosystems/core', () => ({
  clients: {
    ledger: {
      listEventBlocks: (...args: any[]) => mockListEventBlocks(...args),
      listAgents: vi.fn().mockResolvedValue([]),
    },
  },
  useGraphWrites: (_graphId: string | null | undefined, cb: () => void) => {
    onGraphWrites = cb
  },
  PageLayout: ({ children }: any) => <div>{children}</div>,
  PageHeader: ({ title }: any) => <h1>{title}</h1>,
  LoadingState: () => <div data-testid="loading" />,
  EmptyState: ({ title }: any) => <div>{title}</div>,
}))

// One stable object: the page reloads whenever the graph's identity changes.
const { GRAPH } = vi.hoisted(() => ({ GRAPH: { graphId: 'kg1' } }))
vi.mock('@/lib/useLedgerGraph', () => ({
  useLedgerGraph: () => ({ graph: GRAPH }),
}))
vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(''),
}))
vi.mock('next/link', () => ({ default: ({ children }: any) => children }))
vi.mock('../EventBlockDetailModal', () => ({ default: () => null }))

import InboxContent from '../content'

const line = (id: string, externalId: string, status = 'captured') => ({
  id,
  externalId,
  description: null,
  status,
  eventType: 'bank_transaction',
  eventCategory: 'adjustment',
  source: 'plaid',
  amount: 1250,
  currency: 'USD',
  occurredAt: '2026-09-15T00:00:00Z',
  agentId: null,
  metadata: {},
})

describe('Inbox page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    onGraphWrites = null
  })

  it('reloads after a console write, keeping the table on screen', async () => {
    mockListEventBlocks.mockResolvedValueOnce([
      line('evt_1', 'TXN-STRIPE'),
      line('evt_2', 'TXN-AWS'),
    ])
    render(<InboxContent />)
    expect(await screen.findByText('TXN-STRIPE')).toBeInTheDocument()

    let finishReload: (rows: unknown[]) => void = () => {}
    mockListEventBlocks.mockReturnValueOnce(
      new Promise((resolve) => {
        finishReload = resolve
      })
    )
    // A /do classified the first line, so it leaves the captured view.
    act(() => onGraphWrites?.())

    await waitFor(() => expect(mockListEventBlocks).toHaveBeenCalledTimes(2))
    expect(screen.getByText('TXN-STRIPE')).toBeInTheDocument()
    expect(screen.queryByTestId('loading')).toBeNull()

    await act(async () => {
      finishReload([line('evt_2', 'TXN-AWS')])
    })
    await waitFor(() => expect(screen.queryByText('TXN-STRIPE')).toBeNull())
    expect(screen.getByText('TXN-AWS')).toBeInTheDocument()
  })
})
