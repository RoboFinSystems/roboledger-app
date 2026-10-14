import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockListEventBlocks = vi.fn()
const mockAcceptSuggestions = vi.fn()
let onGraphWrites: (() => void) | null = null

vi.mock('@robosystems/core', () => ({
  clients: {
    ledger: {
      listEventBlocks: (...args: any[]) => mockListEventBlocks(...args),
      acceptSuggestions: (...args: any[]) => mockAcceptSuggestions(...args),
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

const line = (
  id: string,
  externalId: string,
  status = 'captured',
  metadata: Record<string, unknown> = {}
) => ({
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
  metadata,
})

const learned = {
  suggested_element_id: 'elem_software',
  suggested_account_name: 'Software',
  suggestion_source: 'agent_default',
}
const fromBank = {
  suggested_element_id: 'elem_fees',
  suggested_account_name: 'Bank fees',
  suggestion_source: 'tier0',
}

const batchResult = (lines: any[]) => ({
  selected: lines.length,
  classified: 0,
  committed: lines.filter((l) => l.outcome === 'committed').length,
  skipped: lines.filter((l) => l.outcome === 'skipped').length,
  truncated: false,
  dry_run: false,
  lines,
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

  describe('approving suggestions in bulk', () => {
    const rows = () => [
      line('evt_learned', 'TXN-GUSTO', 'captured', learned),
      line('evt_bank', 'TXN-FEE', 'captured', fromBank),
      line('evt_bare', 'TXN-BARE'),
      line('evt_done', 'TXN-DONE', 'classified', learned),
    ]

    it('offers a checkbox only on an open line with a suggestion', async () => {
      mockListEventBlocks.mockResolvedValueOnce(rows())
      render(<InboxContent />)
      expect(await screen.findByText('TXN-GUSTO')).toBeInTheDocument()
      expect(screen.getByLabelText('Select TXN-GUSTO')).toBeInTheDocument()
      expect(screen.getByLabelText('Select TXN-FEE')).toBeInTheDocument()
      expect(screen.queryByLabelText('Select TXN-BARE')).toBeNull()
      expect(screen.queryByLabelText('Select TXN-DONE')).toBeNull()
      expect(screen.getByText('Approve 0')).toBeDisabled()
    })

    it('"Select learned" ticks the learned lines and Approve posts them', async () => {
      mockListEventBlocks.mockResolvedValueOnce(rows())
      mockAcceptSuggestions.mockResolvedValueOnce(
        batchResult([
          {
            event_id: 'evt_learned',
            outcome: 'committed',
            reason: null,
            detail: null,
            element_id: 'elem_software',
            description: null,
          },
        ])
      )
      render(<InboxContent />)
      await screen.findByText('TXN-GUSTO')
      fireEvent.click(screen.getByText('Select learned (1)'))
      expect(screen.getByLabelText('Select TXN-GUSTO')).toBeChecked()
      expect(screen.getByLabelText('Select TXN-FEE')).not.toBeChecked()
      fireEvent.click(screen.getByText('Approve 1'))
      await waitFor(() => expect(mockAcceptSuggestions).toHaveBeenCalled())
      expect(mockAcceptSuggestions).toHaveBeenCalledWith('kg1', {
        event_ids: ['evt_learned'],
        commit: true,
        entity_id: null,
      })
      expect(await screen.findByText('Posted 1 of 1.')).toBeInTheDocument()
      // Posted, so it leaves the captured view; the others stay.
      expect(screen.queryByText('TXN-GUSTO')).toBeNull()
      expect(screen.getByText('TXN-FEE')).toBeInTheDocument()
    })

    it('a line the server would not take stays, with its reason', async () => {
      mockListEventBlocks.mockResolvedValueOnce(rows())
      mockAcceptSuggestions.mockResolvedValueOnce(
        batchResult([
          {
            event_id: 'evt_learned',
            outcome: 'committed',
            reason: null,
            detail: null,
            element_id: 'elem_software',
            description: null,
          },
          {
            event_id: 'evt_bank',
            outcome: 'skipped',
            reason: 'closed_period',
            detail: 'Period 2026-09 is closed.',
            element_id: 'elem_fees',
            description: null,
          },
        ])
      )
      render(<InboxContent />)
      await screen.findByText('TXN-GUSTO')
      fireEvent.click(
        screen.getByLabelText('Select every line with a suggestion')
      )
      fireEvent.click(screen.getByText('Approve 2'))
      expect(
        await screen.findByText('Posted 1 of 2; 1 left as they were.')
      ).toBeInTheDocument()
      expect(
        screen.getByText(
          'TXN-FEE: in a closed month — Period 2026-09 is closed.'
        )
      ).toBeInTheDocument()
      expect(screen.getByText('TXN-FEE')).toBeInTheDocument()
      expect(screen.getByLabelText('Select TXN-FEE')).not.toBeChecked()
    })

    it('the suggestion filter narrows the list', async () => {
      mockListEventBlocks.mockResolvedValueOnce(rows())
      render(<InboxContent />)
      await screen.findByText('TXN-GUSTO')
      fireEvent.change(screen.getByLabelText('Suggestion'), {
        target: { value: 'agent_default' },
      })
      expect(screen.getByText('TXN-GUSTO')).toBeInTheDocument()
      expect(screen.getByText('TXN-DONE')).toBeInTheDocument()
      expect(screen.queryByText('TXN-FEE')).toBeNull()
      expect(screen.queryByText('TXN-BARE')).toBeNull()
      fireEvent.change(screen.getByLabelText('Suggestion'), {
        target: { value: 'none' },
      })
      expect(screen.getByText('TXN-BARE')).toBeInTheDocument()
      expect(screen.queryByText('TXN-GUSTO')).toBeNull()
    })
  })
})
