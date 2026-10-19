import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockPreview = vi.fn()
const mockPropose = vi.fn()

vi.mock('@robosystems/core', () => ({
  clients: {
    ledger: {
      previewConsolidationEntries: (...args: any[]) => mockPreview(...args),
      proposeConsolidationEntries: (...args: any[]) => mockPropose(...args),
    },
  },
  LoadingState: () => (
    <div data-testid="loading-state" role="status">
      Loading
    </div>
  ),
}))

vi.mock('flowbite-react', () => ({
  Badge: ({ children, color }: any) => (
    <span data-badge-color={color}>{children}</span>
  ),
  Button: ({ children, onClick, disabled }: any) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
  Card: ({ children }: any) => <div>{children}</div>,
  Spinner: () => <span data-testid="spinner" />,
  Table: ({ children }: any) => <table>{children}</table>,
  TableBody: ({ children }: any) => <tbody>{children}</tbody>,
  TableCell: ({ children }: any) => <td>{children}</td>,
  TableHead: ({ children }: any) => <thead>{children}</thead>,
  TableHeadCell: ({ children }: any) => <th>{children}</th>,
  TableRow: ({ children }: any) => <tr>{children}</tr>,
}))

vi.mock('react-icons/hi', () => ({
  HiExclamationCircle: () => <span data-testid="icon-error" />,
}))

vi.mock('react-icons/tb', () => ({
  TbFileInvoice: () => <span />,
}))

import ConsolidationEntriesPanel from '../components/ConsolidationEntriesPanel'

const PROPOSAL = {
  adjustment_kind: 'elimination_investment',
  adjusts_entity_id: 'ent_harbor',
  adjusts_entity_name: 'Harbor Café LLC',
  posting_date: '2026-09-30',
  memo: 'Eliminate the investment — Harbor Café LLC (2026-09)',
  basis: "70% of Harbor Café LLC's capital.",
  lines: [
    {
      element_id: 'el_cap',
      account_name: 'Members Capital',
      concept: 'rs-gaap:MembersEquity',
      debit_amount: 700000,
      credit_amount: 0,
    },
    {
      element_id: 'el_inv',
      account_name: 'Investment in Subsidiaries',
      concept: 'rs-gaap:InvestmentInSubsidiaries',
      debit_amount: 0,
      credit_amount: 700000,
    },
  ],
}

const PREVIEW = {
  period: '2026-09',
  period_start: '2026-09-01',
  period_end: '2026-09-30',
  consolidation_entity_id: 'ent_cons',
  proposals: [PROPOSAL],
  residuals: [],
  reconciling_items: [],
  notes: [],
  up_to_date: false,
  closed: false,
  drafted_entry_ids: [],
}

describe('ConsolidationEntriesPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPreview.mockResolvedValue(PREVIEW)
  })

  it('lists what the month needs, by kind and member', async () => {
    render(<ConsolidationEntriesPanel graphId="kg1" period="2026-09" />)

    expect(
      await screen.findByText('Investment elimination — Harbor Café LLC')
    ).toBeInTheDocument()
    expect(screen.getByText('$7,000.00')).toBeInTheDocument()
    expect(mockPreview).toHaveBeenCalledWith('kg1', '2026-09')
  })

  it('drafts the entries, then reloads the preview and the drafts', async () => {
    const onDrafted = vi.fn()
    mockPropose.mockResolvedValue({
      period: '2026-09',
      consolidation_entity_id: 'ent_cons',
      entries: [{ id: 'je_1' }],
      replaced: 0,
    })
    render(
      <ConsolidationEntriesPanel
        graphId="kg1"
        period="2026-09"
        onDrafted={onDrafted}
      />
    )

    mockPreview.mockResolvedValue({
      ...PREVIEW,
      up_to_date: true,
      drafted_entry_ids: ['je_1'],
    })
    fireEvent.click(await screen.findByText('Draft entries'))

    // Drafted, the month is up to date: the drafts are the entries, so the
    // proposals are not listed again, and there is nothing to draft.
    expect(await screen.findByText('Up to date: drafted')).toBeInTheDocument()
    expect(
      screen.queryByText('Investment elimination — Harbor Café LLC')
    ).not.toBeInTheDocument()
    expect(screen.getByText('Draft again').closest('button')).toBeDisabled()
    expect(mockPropose).toHaveBeenCalledWith('kg1', '2026-09')
    expect(onDrafted).toHaveBeenCalled()
    expect(mockPreview).toHaveBeenCalledTimes(2)
  })

  it('offers to replace drafts that no longer match, even with nothing to propose', async () => {
    mockPreview.mockResolvedValue({
      ...PREVIEW,
      proposals: [],
      up_to_date: false,
      drafted_entry_ids: ['je_1', 'je_2'],
    })
    render(<ConsolidationEntriesPanel graphId="kg1" period="2026-09" />)

    expect(
      await screen.findByText(/no longer match the books/)
    ).toBeInTheDocument()
    expect(screen.getByText('Draft again').closest('button')).toBeEnabled()
  })

  it('shows a residual as withheld, never as an entry', async () => {
    mockPreview.mockResolvedValue({
      ...PREVIEW,
      proposals: [],
      residuals: [
        {
          entity_id: 'ent_harbor',
          entity_name: 'Harbor Café LLC',
          amount: 50000,
          explanation: 'The parent carries more than its share of capital.',
        },
      ],
    })
    render(<ConsolidationEntriesPanel graphId="kg1" period="2026-09" />)

    expect(
      await screen.findByText('Withheld until explained')
    ).toBeInTheDocument()
    expect(
      screen.getByText(/The parent carries more than its share/)
    ).toBeInTheDocument()
    // Nothing to draft: the button is there but holds back.
    expect(screen.getByText('Draft entries').closest('button')).toBeDisabled()
  })

  it('does not call matching drafts stale when a residual holds the month', async () => {
    mockPreview.mockResolvedValue({
      ...PREVIEW,
      up_to_date: false,
      drafted_entry_ids: ['je_1'],
      residuals: [
        {
          entity_id: 'ent_harbor',
          entity_name: 'Harbor Café LLC',
          amount: 50000,
          explanation: 'The parent carries more than its share of capital.',
        },
      ],
    })
    render(<ConsolidationEntriesPanel graphId="kg1" period="2026-09" />)

    expect(
      await screen.findByText('Withheld until explained')
    ).toBeInTheDocument()
    expect(
      screen.queryByText(/no longer match the books/)
    ).not.toBeInTheDocument()
  })

  it('says an entry is left out, and why, rather than that drafts are stale', async () => {
    mockPreview.mockResolvedValue({
      ...PREVIEW,
      up_to_date: false,
      incomplete: true,
      drafted_entry_ids: ['je_1'],
      notes: [
        'Consolidation Adjustments has no account mapped to rs-gaap:AccountsPayableCurrent.',
      ],
    })
    render(<ConsolidationEntriesPanel graphId="kg1" period="2026-09" />)

    expect(
      await screen.findByText(/An entry the month needs is left out/)
    ).toBeInTheDocument()
    expect(
      screen.getByText(/no account mapped to rs-gaap:AccountsPayableCurrent/)
    ).toBeInTheDocument()
    expect(
      screen.queryByText(/no longer match the books/)
    ).not.toBeInTheDocument()
  })

  it('says a closed month is as posted, with nothing to draft', async () => {
    mockPreview.mockResolvedValue({
      ...PREVIEW,
      proposals: [],
      up_to_date: true,
      closed: true,
    })
    render(<ConsolidationEntriesPanel graphId="kg1" period="2026-09" />)

    expect(
      await screen.findByText(/This month is closed here/)
    ).toBeInTheDocument()
    expect(screen.queryByText('Draft entries')).not.toBeInTheDocument()
  })

  it('says when the entity already holds what the month needs', async () => {
    mockPreview.mockResolvedValue({
      ...PREVIEW,
      proposals: [],
      up_to_date: true,
    })
    render(<ConsolidationEntriesPanel graphId="kg1" period="2026-09" />)

    expect(await screen.findByText('Up to date')).toBeInTheDocument()
  })

  it('never shows the raw error envelope', async () => {
    mockPreview.mockRejectedValue(
      new Error(
        'Preview consolidation entries failed: {"detail":"This group has no consolidation entity."}'
      )
    )
    render(<ConsolidationEntriesPanel graphId="kg1" period="2026-09" />)

    await waitFor(() =>
      expect(
        screen.getByText('This group has no consolidation entity.')
      ).toBeInTheDocument()
    )
    expect(screen.queryByText(/"detail"/)).not.toBeInTheDocument()
  })
})
