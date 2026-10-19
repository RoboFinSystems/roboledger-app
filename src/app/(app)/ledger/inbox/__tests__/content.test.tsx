import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockListEventBlocks = vi.fn()
const mockAcceptSuggestions = vi.fn()
let onGraphWrites: (() => void) | null = null
let modalProps: any = null

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
vi.mock('../EventBlockDetailModal', () => ({
  default: (props: any) => {
    modalProps = props
    return null
  },
}))

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
    mockListEventBlocks.mockReset()
    mockAcceptSuggestions.mockReset()
    onGraphWrites = null
    modalProps = null
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

  it('re-reads the list after a single approve, not just the approved row', async () => {
    mockListEventBlocks.mockResolvedValueOnce([
      line('evt_1', 'TXN-GUSTO', 'captured', fromBank),
      line('evt_2', 'TXN-GUSTO-2', 'captured', fromBank),
    ])
    render(<InboxContent />)
    fireEvent.click(await screen.findByText('TXN-GUSTO'))
    await waitFor(() => expect(modalProps?.eventId).toBe('evt_1'))

    // The commit taught the counterparty Software, which the server put on
    // its other open line.
    mockListEventBlocks.mockResolvedValueOnce([
      line('evt_2', 'TXN-GUSTO-2', 'captured', learned),
    ])
    act(() => modalProps.onApproved('evt_1'))

    await waitFor(() => expect(mockListEventBlocks).toHaveBeenCalledTimes(2))
    expect(await screen.findByText('Software')).toBeInTheDocument()
    expect(screen.queryByText('Bank fees')).toBeNull()
    expect(screen.queryByTestId('loading')).toBeNull()
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
      // The re-read after the commit: the posted line has left the view.
      mockListEventBlocks.mockResolvedValueOnce(rows().slice(1))
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
      mockListEventBlocks.mockResolvedValueOnce(rows().slice(1))
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

    it('re-reads the list after a batch, so a re-suggested line shows its new account', async () => {
      const gusto2 = line('evt_gusto2', 'TXN-GUSTO-2', 'captured', fromBank)
      mockListEventBlocks.mockResolvedValueOnce([...rows(), gusto2])
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
      // The commit taught the counterparty its default, which the server
      // put on the counterparty's other open line.
      mockListEventBlocks.mockResolvedValueOnce([
        ...rows().slice(1),
        { ...gusto2, metadata: learned },
      ])
      render(<InboxContent />)
      await screen.findByText('TXN-GUSTO-2')
      expect(screen.getByText('Select learned (1)')).toBeInTheDocument()
      fireEvent.click(screen.getByText('Select learned (1)'))
      fireEvent.click(screen.getByText('Approve 1'))
      expect(await screen.findByText('Posted 1 of 1.')).toBeInTheDocument()
      await waitFor(() => expect(mockListEventBlocks).toHaveBeenCalledTimes(2))
      expect(await screen.findByText('Select learned (1)')).toBeInTheDocument()
      expect(screen.queryByTestId('loading')).toBeNull()
      expect(screen.getAllByText('Software')).toHaveLength(2)
    })

    it('names a line whose suggestion changed while the batch ran', async () => {
      mockListEventBlocks.mockResolvedValueOnce(rows())
      mockAcceptSuggestions.mockResolvedValueOnce(
        batchResult([
          {
            event_id: 'evt_bank',
            outcome: 'skipped',
            reason: 'suggestion_changed',
            detail: null,
            element_id: 'elem_fees',
            description: null,
          },
        ])
      )
      render(<InboxContent />)
      await screen.findByText('TXN-FEE')
      fireEvent.click(screen.getByLabelText('Select TXN-FEE'))
      fireEvent.click(screen.getByText('Approve 1'))
      expect(
        await screen.findByText(
          'TXN-FEE: its suggestion changed while the batch ran; review it again'
        )
      ).toBeInTheDocument()
    })

    it('a batch that fails partway says so, re-reads the list and clears the ticks', async () => {
      mockListEventBlocks.mockResolvedValueOnce(rows())
      mockAcceptSuggestions.mockRejectedValueOnce(
        new Error('Accept suggestions failed: {"detail":"Gateway timeout"}')
      )
      // The first line posted before the walk stopped.
      mockListEventBlocks.mockResolvedValueOnce(rows().slice(1))
      render(<InboxContent />)
      await screen.findByText('TXN-GUSTO')
      fireEvent.click(
        screen.getByLabelText('Select every line with a suggestion')
      )
      fireEvent.click(screen.getByText('Approve 2'))
      expect(
        await screen.findByText(
          'The approval may have stopped partway; the list has been reloaded.'
        )
      ).toBeInTheDocument()
      expect(screen.getByText('Gateway timeout')).toBeInTheDocument()
      await waitFor(() => expect(screen.queryByText('TXN-GUSTO')).toBeNull())
      expect(mockListEventBlocks).toHaveBeenCalledTimes(2)
      expect(screen.getByLabelText('Select TXN-FEE')).not.toBeChecked()
      expect(screen.getByText('Approve 0')).toBeDisabled()
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
