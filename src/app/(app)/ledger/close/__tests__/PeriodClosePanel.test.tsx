import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockGetFiscalCalendar = vi.fn()
const mockGetPeriodCloseStatus = vi.fn()
const mockListPeriodDrafts = vi.fn()
const mockClosePeriod = vi.fn()
const mockReopenPeriod = vi.fn()
const mockInitializeLedger = vi.fn()
const mockCreateClosingEntry = vi.fn()
const mockListInformationBlocks = vi.fn()

vi.mock('@robosystems/core', () => ({
  clients: {
    ledger: {
      getFiscalCalendar: (...args: any[]) => mockGetFiscalCalendar(...args),
      getPeriodCloseStatus: (...args: any[]) =>
        mockGetPeriodCloseStatus(...args),
      listPeriodDrafts: (...args: any[]) => mockListPeriodDrafts(...args),
      closePeriod: (...args: any[]) => mockClosePeriod(...args),
      reopenPeriod: (...args: any[]) => mockReopenPeriod(...args),
      initializeLedger: (...args: any[]) => mockInitializeLedger(...args),
      createClosingEntry: (...args: any[]) => mockCreateClosingEntry(...args),
      listInformationBlocks: (...args: any[]) =>
        mockListInformationBlocks(...args),
    },
  },
  EmptyState: ({ title, action }: any) => (
    <div data-testid="empty-state">
      {title}
      {action}
    </div>
  ),
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
  Label: ({ children }: any) => <label>{children}</label>,
  Modal: ({ children, show }: any) => (show ? <div>{children}</div> : null),
  ModalBody: ({ children }: any) => <div>{children}</div>,
  ModalFooter: ({ children }: any) => <div>{children}</div>,
  ModalHeader: ({ children }: any) => <div>{children}</div>,
  Select: ({ children, onChange, value, id }: any) => (
    <select id={id} onChange={onChange} value={value} data-testid={id}>
      {children}
    </select>
  ),
  Spinner: () => <span data-testid="spinner" />,
  Table: ({ children }: any) => <table>{children}</table>,
  TableBody: ({ children }: any) => <tbody>{children}</tbody>,
  TableCell: ({ children }: any) => <td>{children}</td>,
  TableHead: ({ children }: any) => (
    <thead>
      <tr>{children}</tr>
    </thead>
  ),
  TableHeadCell: ({ children }: any) => <th>{children}</th>,
  TableRow: ({ children }: any) => <tr>{children}</tr>,
  Textarea: ({ value, onChange, id }: any) => (
    <textarea id={id} value={value} onChange={onChange} data-testid={id} />
  ),
}))

vi.mock('react-icons/hi', () => ({
  HiCalendar: () => <span />,
  HiCheck: () => <span />,
  HiClock: () => <span />,
  HiExclamationCircle: () => <span data-testid="icon-error" />,
  HiLockClosed: () => <span />,
  HiLockOpen: () => <span />,
  HiPlay: () => <span />,
  HiRefresh: () => <span />,
  HiTable: () => <span />,
  HiX: () => <span data-testid="icon-x" />,
}))

vi.mock('react-icons/tb', () => ({
  TbFileInvoice: () => <span />,
}))

vi.mock('next/link', () => ({
  default: ({ href, children }: any) => <a href={href}>{children}</a>,
}))

import PeriodClosePanel from '../components/PeriodClosePanel'

const CALENDAR = {
  closedThrough: '2026-04',
  closeTarget: '2026-06',
  gapPeriods: 2,
  catchUpSequence: ['2026-05', '2026-06'],
  closeableNow: true,
  blockers: [],
  periods: [
    { name: '2026-04', status: 'closed' },
    { name: '2026-05', status: 'open' },
    { name: '2026-06', status: 'open' },
  ],
}

const CALENDAR_AFTER = {
  ...CALENDAR,
  closedThrough: '2026-05',
  gapPeriods: 1,
  catchUpSequence: ['2026-06'],
  periods: [
    { name: '2026-04', status: 'closed' },
    { name: '2026-05', status: 'closed' },
    { name: '2026-06', status: 'open' },
  ],
}

const CLOSE_RESULT = {
  period: '2026-05',
  entriesPosted: 3,
  targetAutoAdvanced: false,
  fiscalCalendar: CALENDAR_AFTER,
  ruleSummary: { pass: 2, fail: 1, error: 0, skipped: 0 },
  evaluatedStructureIds: ['struct_dep'],
}

describe('PeriodClosePanel — close success', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetFiscalCalendar.mockResolvedValue(CALENDAR)
    mockGetPeriodCloseStatus.mockResolvedValue({
      schedules: [],
      totalDraft: 0,
      totalPosted: 0,
    })
    mockListPeriodDrafts.mockResolvedValue({
      draftCount: 0,
      totalDebit: 0,
      totalCredit: 0,
      allBalanced: true,
      qbPublishCount: 0,
      localOnlyCount: 0,
      drafts: [],
    })
    mockClosePeriod.mockResolvedValue(CLOSE_RESULT)
    mockListInformationBlocks.mockResolvedValue([
      { id: 'struct_bs', blockType: 'balance_sheet', facts: [{ id: 'f_bs' }] },
      { id: 'struct_m', blockType: 'metric', facts: [] },
    ])
  })

  it('shows what the close did — entries, rules, stamped statements, Plan link', async () => {
    render(<PeriodClosePanel graphId="kg1" />)

    const closeButton = await screen.findByText('Close Period')
    fireEvent.click(closeButton)

    // The success card names the act...
    expect(await screen.findByText(/Closed May 2026/)).toBeInTheDocument()
    expect(screen.getByText('3 drafts posted')).toBeInTheDocument()
    // ...the rule outcomes...
    expect(screen.getByText('2 pass')).toBeInTheDocument()
    expect(screen.getByText('1 fail')).toBeInTheDocument()
    // ...and, once the refetch confirms a fact-bearing statement block,
    // the stamped statements with the natural next step.
    expect(
      await screen.findByText('Financial statements stamped')
    ).toBeInTheDocument()
    const planLink = screen.getByText('View in Plan').closest('a')
    expect(planLink).toHaveAttribute('href', '/plan')

    expect(mockClosePeriod).toHaveBeenCalledWith('kg1', '2026-05', {
      allowStaleSync: false,
    })
  })

  it('omits the stamped-statements line when no statement block has facts', async () => {
    mockListInformationBlocks.mockResolvedValue([
      { id: 'struct_bs', blockType: 'balance_sheet', facts: [] },
    ])
    render(<PeriodClosePanel graphId="kg1" />)

    fireEvent.click(await screen.findByText('Close Period'))
    await screen.findByText(/Closed May 2026/)

    await waitFor(() => expect(mockListInformationBlocks).toHaveBeenCalled())
    expect(
      screen.queryByText('Financial statements stamped')
    ).not.toBeInTheDocument()
  })

  it('dismisses the success card', async () => {
    render(<PeriodClosePanel graphId="kg1" />)
    fireEvent.click(await screen.findByText('Close Period'))
    await screen.findByText(/Closed May 2026/)

    fireEvent.click(screen.getByLabelText('Dismiss'))
    expect(screen.queryByText(/Closed May 2026/)).not.toBeInTheDocument()
  })

  it('shows the error and no card when the close fails', async () => {
    mockClosePeriod.mockRejectedValue(new Error('STATEMENT_STAMP_FAILED'))
    render(<PeriodClosePanel graphId="kg1" />)

    fireEvent.click(await screen.findByText('Close Period'))

    expect(
      await screen.findByText(/Close period failed: STATEMENT_STAMP_FAILED/)
    ).toBeInTheDocument()
    expect(screen.queryByText(/Closed May 2026/)).not.toBeInTheDocument()
    expect(mockListInformationBlocks).not.toHaveBeenCalled()
  })

  it('advances the period selection after a successful close', async () => {
    render(<PeriodClosePanel graphId="kg1" />)
    fireEvent.click(await screen.findByText('Close Period'))
    await screen.findByText(/Closed May 2026/)

    // Selection moved to the new catch-up head; the card stays visible
    // (it describes the month just closed, not the selection).
    const select = screen.getByTestId('period-select') as HTMLSelectElement
    await waitFor(() => expect(select.value).toBe('2026-06'))
    expect(screen.getByText(/Closed May 2026/)).toBeInTheDocument()
  })
})
