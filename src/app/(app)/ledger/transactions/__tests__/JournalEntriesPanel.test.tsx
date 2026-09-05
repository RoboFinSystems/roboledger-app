import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockListJournalEntries = vi.fn()

vi.mock('@robosystems/core', () => ({
  clients: {
    ledger: {
      listJournalEntries: (...args: any[]) => mockListJournalEntries(...args),
    },
  },
  EmptyState: ({ title }: any) => <div>{title}</div>,
  LoadingState: () => <div>Loading…</div>,
}))

vi.mock('flowbite-react', () => ({
  Alert: ({ children }: any) => <div role="alert">{children}</div>,
  Badge: ({ children }: any) => <span>{children}</span>,
  Card: ({ children }: any) => <div>{children}</div>,
  Select: ({ children, id, value, onChange }: any) => (
    <select id={id} value={value} onChange={onChange}>
      {children}
    </select>
  ),
  Table: ({ children }: any) => <table>{children}</table>,
  TableBody: ({ children }: any) => <tbody>{children}</tbody>,
  TableCell: ({ children, colSpan }: any) => (
    <td colSpan={colSpan}>{children}</td>
  ),
  TableHead: ({ children }: any) => (
    <thead>
      <tr>{children}</tr>
    </thead>
  ),
  TableHeadCell: ({ children }: any) => <th>{children}</th>,
  TableRow: ({ children, onClick }: any) => (
    <tr onClick={onClick}>{children}</tr>
  ),
  TextInput: ({ id, value, onChange, placeholder }: any) => (
    <input
      id={id}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
    />
  ),
}))

import { JournalEntriesPanel } from '../JournalEntriesPanel'

const STANDALONE_ENTRY = {
  id: 'je_sched',
  number: null,
  // No parent transaction — the shape the Transactions tab cannot show.
  transactionId: null,
  type: 'adjusting',
  status: 'posted',
  postingDate: '2026-07-31',
  memo: 'MacBook depreciation',
  provenance: 'schedule_derived',
  sourceStructureId: 'struct_1',
  sourceStructureName: 'MacBook Pro Depreciation',
  triggeredByEventId: null,
  reversalOf: null,
  postedAt: '2026-08-01T12:00:00',
  totalDebit: 42.41,
  totalCredit: 42.41,
  balanced: true,
  lineItems: [
    {
      id: 'li_1',
      accountId: 'el_1',
      accountName: 'Depreciation Expense',
      accountCode: '6100',
      debitAmount: 42.41,
      creditAmount: 0,
      description: null,
      lineOrder: 1,
    },
  ],
}

const renderPanel = () =>
  render(
    <JournalEntriesPanel
      graphId="kg_1"
      startDate="2026-07-01"
      endDate="2026-07-31"
      refreshKey={0}
    />
  )

describe('JournalEntriesPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockListJournalEntries.mockResolvedValue({
      entries: [STANDALONE_ENTRY],
      pagination: { total: 1, limit: 500, offset: 0, hasMore: false },
    })
  })

  it('renders an entry that has no parent transaction', async () => {
    renderPanel()
    expect(await screen.findByText('MacBook depreciation')).toBeInTheDocument()
    expect(screen.getByText('MacBook Pro Depreciation')).toBeInTheDocument()
  })

  it('treats amounts as dollars, not cents', async () => {
    // Regression guard. These fields are Float/dollars on LedgerJournalEntry,
    // but Int/cents on DraftEntry — the sibling shape PeriodClosePanel reads
    // and divides by 100. A reviewer read this panel as the cents case; if
    // someone "fixes" it that way, $42.41 becomes $0.42 and this fails.
    renderPanel()
    expect(await screen.findByText('$42.41')).toBeInTheDocument()
    expect(screen.queryByText('$0.42')).not.toBeInTheDocument()
    expect(screen.queryByText('$4,241.00')).not.toBeInTheDocument()
  })

  it('shows the credit side when an unbalanced entry has no debits', async () => {
    mockListJournalEntries.mockResolvedValue({
      entries: [
        {
          ...STANDALONE_ENTRY,
          id: 'je_credit_only',
          balanced: false,
          totalDebit: 0,
          totalCredit: 99.5,
        },
      ],
      pagination: { total: 1, limit: 500, offset: 0, hasMore: false },
    })
    renderPanel()
    // Would render $0.00 if the column always read totalDebit.
    expect(await screen.findByText('$99.50')).toBeInTheDocument()
  })

  it('passes the date range and status through to the client', async () => {
    renderPanel()
    await waitFor(() => expect(mockListJournalEntries).toHaveBeenCalled())
    const [graphId, options] = mockListJournalEntries.mock.calls[0]
    expect(graphId).toBe('kg_1')
    expect(options).toMatchObject({
      startDate: '2026-07-01',
      endDate: '2026-07-31',
      status: 'posted',
    })
  })

  it('refetches when the provenance filter changes', async () => {
    renderPanel()
    await waitFor(() => expect(mockListJournalEntries).toHaveBeenCalledTimes(1))
    fireEvent.change(screen.getByLabelText('Source'), {
      target: { value: 'schedule_derived' },
    })
    await waitFor(() => expect(mockListJournalEntries).toHaveBeenCalledTimes(2))
    expect(mockListJournalEntries.mock.calls[1][1]).toMatchObject({
      provenance: 'schedule_derived',
    })
  })

  it('expands line items without a second request', async () => {
    renderPanel()
    const row = await screen.findByText('MacBook depreciation')
    fireEvent.click(row)
    expect(await screen.findByText('Depreciation Expense')).toBeInTheDocument()
    // Line items arrive with the entry, unlike the transaction detail.
    expect(mockListJournalEntries).toHaveBeenCalledTimes(1)
  })

  it('surfaces a load failure instead of an empty state', async () => {
    mockListJournalEntries.mockRejectedValue(new Error('boom'))
    renderPanel()
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Failed to load journal entries'
    )
  })
})
