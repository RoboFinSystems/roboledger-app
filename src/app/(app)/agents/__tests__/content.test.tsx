import { act, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockListAgents = vi.fn()
let onGraphWrites: (() => void) | null = null
let watchedGraphId: string | null | undefined

vi.mock('@robosystems/core', () => ({
  clients: {
    ledger: { listAgents: (...args: any[]) => mockListAgents(...args) },
  },
  useGraphWrites: (graphId: string | null | undefined, cb: () => void) => {
    watchedGraphId = graphId
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
vi.mock('../AgentDetailModal', () => ({ default: () => null }))

import AgentsContent from '../content'

const agent = (id: string, name: string) => ({
  id,
  name,
  agentType: 'vendor',
  source: 'manual',
  isActive: true,
  createdAt: '2026-09-01T00:00:00Z',
})

describe('Agents page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    onGraphWrites = null
  })

  it('reloads after a console write, keeping the table on screen', async () => {
    mockListAgents.mockResolvedValueOnce([agent('agt_1', 'Acme Supply')])
    render(<AgentsContent />)
    expect(await screen.findByText('Acme Supply')).toBeInTheDocument()
    expect(watchedGraphId).toBe('kg1')

    let finishReload: (rows: unknown[]) => void = () => {}
    mockListAgents.mockReturnValueOnce(
      new Promise((resolve) => {
        finishReload = resolve
      })
    )
    act(() => onGraphWrites?.())

    await waitFor(() => expect(mockListAgents).toHaveBeenCalledTimes(2))
    // Mid-reload: the existing rows stay, with no spinner in their place.
    expect(screen.getByText('Acme Supply')).toBeInTheDocument()
    expect(screen.queryByTestId('loading')).toBeNull()

    await act(async () => {
      finishReload([
        agent('agt_1', 'Acme Supply'),
        agent('agt_2', 'Notion Labs'),
      ])
    })
    expect(await screen.findByText('Notion Labs')).toBeInTheDocument()
  })
})
