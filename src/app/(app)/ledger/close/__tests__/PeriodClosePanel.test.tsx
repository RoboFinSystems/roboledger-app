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
  entriesPublishedToQb: 0,
  entriesPostedLocally: 3,
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

    // Both overrides ride every close, defaulting off — an unchecked box
    // must send false rather than omitting the flag, so a stale value can
    // never carry over from a previous close.
    expect(mockClosePeriod).toHaveBeenCalledWith('kg1', '2026-05', {
      entityId: null,
      allowStaleSync: false,
      allowStrandedObligations: false,
      allowUnreconciledAccounts: false,
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

describe('PeriodClosePanel — blockers name what is holding the close', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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
  })

  it('names the schedules behind a stranded-obligation blocker', async () => {
    mockGetFiscalCalendar.mockResolvedValue({
      ...CALENDAR,
      closeableNow: false,
      blockers: ['stranded_obligations'],
      strandedObligationCount: 2,
      strandedObligationSample: [
        {
          eventId: 'evt_1',
          scheduleId: 'str_prepaid',
          scheduleName: 'Prepaid Insurance',
          period: '2026-05',
        },
        {
          eventId: 'evt_2',
          scheduleId: 'str_prepaid',
          scheduleName: 'Prepaid Insurance',
          period: '2026-05',
        },
      ],
    })
    render(<PeriodClosePanel graphId="kg1" />)

    // The explanation, not the raw code.
    expect(
      await screen.findByText(/promoted but never drafted/)
    ).toBeInTheDocument()
    expect(screen.queryByText('stranded_obligations')).not.toBeInTheDocument()

    // Two obligations, one schedule — named once, not per event.
    expect(
      screen.getByText(
        (_, el) => el?.textContent === '2 affected — Prepaid Insurance'
      )
    ).toBeInTheDocument()
  })

  it('explains a reconciling-item blocker instead of printing its code', async () => {
    mockGetFiscalCalendar.mockResolvedValue({
      ...CALENDAR,
      closeableNow: false,
      blockers: ['reconciling_items'],
    })
    render(<PeriodClosePanel graphId="kg1" />)

    // Unknown codes fall back to the raw string, which reads as a bug to
    // the user and offers no next step. This blocker fires the first time
    // anyone edits a synced transaction in QuickBooks, so it needs copy.
    expect(
      await screen.findByText(/edited in QuickBooks after they were synced/)
    ).toBeInTheDocument()
    expect(screen.queryByText('reconciling_items')).not.toBeInTheDocument()
  })

  it('leads from the reconciling-item blocker to the changes themselves', async () => {
    mockGetFiscalCalendar.mockResolvedValue({
      ...CALENDAR,
      closeableNow: false,
      blockers: ['reconciling_items'],
      reconcilingItemCount: 3,
    })
    const onReviewChanges = vi.fn()
    render(<PeriodClosePanel graphId="kg1" onReviewChanges={onReviewChanges} />)

    const link = await screen.findByRole('button', {
      name: 'Review changed transactions',
    })
    expect(link.parentElement).toHaveTextContent('3 holding this close.')
    fireEvent.click(link)
    expect(onReviewChanges).toHaveBeenCalledTimes(1)
  })

  it('leaves the count out when the calendar reports none', async () => {
    mockGetFiscalCalendar.mockResolvedValue({
      ...CALENDAR,
      closeableNow: false,
      blockers: ['reconciling_items'],
      reconcilingItemCount: 0,
    })
    render(<PeriodClosePanel graphId="kg1" onReviewChanges={vi.fn()} />)

    const link = await screen.findByRole('button', {
      name: 'Review changed transactions',
    })
    expect(link.parentElement).not.toHaveTextContent('holding this close')
  })

  it('offers no review link where nothing can open it', async () => {
    mockGetFiscalCalendar.mockResolvedValue({
      ...CALENDAR,
      closeableNow: false,
      blockers: ['reconciling_items'],
      reconcilingItemCount: 3,
    })
    render(<PeriodClosePanel graphId="kg1" />)

    await screen.findByText(/edited in QuickBooks after they were synced/)
    expect(
      screen.queryByRole('button', { name: 'Review changed transactions' })
    ).not.toBeInTheDocument()
  })

  it('offers Reopen only on the latest closed period', async () => {
    mockGetFiscalCalendar.mockResolvedValue(CALENDAR_AFTER)
    render(<PeriodClosePanel graphId="kg1" />)
    const select = (await screen.findByTestId(
      'period-select'
    )) as HTMLSelectElement

    // An earlier closed month: the server would refuse, so no button.
    fireEvent.change(select, { target: { value: '2026-04' } })
    await waitFor(() =>
      expect(
        screen.getByText(/periods\s+reopen latest to earliest/)
      ).toBeInTheDocument()
    )
    expect(screen.queryByRole('button', { name: /Reopen/ })).toBeNull()

    fireEvent.change(select, { target: { value: '2026-05' } })
    expect(
      await screen.findByRole('button', { name: /Reopen/ })
    ).toBeInTheDocument()
    expect(screen.queryByText(/periods\s+reopen latest to earliest/)).toBeNull()
  })

  it('explains an unposted-source-event blocker instead of printing its code', async () => {
    mockGetFiscalCalendar.mockResolvedValue({
      ...CALENDAR,
      closeableNow: false,
      blockers: ['unposted_source_events'],
    })
    render(<PeriodClosePanel graphId="kg1" />)

    expect(
      await screen.findByText(
        /captured but never posted.*both Captured and Classified/
      )
    ).toBeInTheDocument()
    expect(screen.queryByText('unposted_source_events')).not.toBeInTheDocument()
  })

  it('marks the sample as partial when the count exceeds it', async () => {
    mockGetFiscalCalendar.mockResolvedValue({
      ...CALENDAR,
      closeableNow: false,
      blockers: ['pending_obligations'],
      pendingObligationCount: 9,
      pendingObligationSample: [
        {
          eventId: 'evt_1',
          scheduleId: 'str_dep',
          scheduleName: 'Depreciation',
          period: '2026-05',
        },
      ],
    })
    render(<PeriodClosePanel graphId="kg1" />)

    // The API caps the sample at 5, so the count is the truth and the list
    // is a lead — the copy must not read as a complete inventory.
    expect(
      await screen.findByText(
        (_, el) => el?.textContent === '9 affected — Depreciation and others'
      )
    ).toBeInTheDocument()
  })

  it('adds no detail line for a blocker that carries none', async () => {
    mockGetFiscalCalendar.mockResolvedValue({
      ...CALENDAR,
      closeableNow: false,
      blockers: ['sync_stale'],
    })
    render(<PeriodClosePanel graphId="kg1" />)

    expect(await screen.findByText(/hasn't synced through/)).toBeInTheDocument()
    expect(screen.queryByText(/affected/)).not.toBeInTheDocument()
  })
})

describe('PeriodClosePanel — close overrides', () => {
  const BLOCKED_ON_STRANDED = {
    ...CALENDAR,
    closeableNow: false,
    blockers: ['stranded_obligations'],
    strandedObligationCount: 1,
    strandedObligationSample: [
      {
        eventId: 'evt_1',
        scheduleId: 'str_prepaid',
        scheduleName: 'Prepaid Insurance',
        period: '2026-05',
      },
    ],
  }

  beforeEach(() => {
    vi.clearAllMocks()
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
    mockListInformationBlocks.mockResolvedValue([])
  })

  it('offers an escape hatch for a stranded-obligation block', async () => {
    mockGetFiscalCalendar.mockResolvedValue(BLOCKED_ON_STRANDED)
    render(<PeriodClosePanel graphId="kg1" />)

    // Blocked: the button is dead until the user opts in explicitly.
    const button = (await screen.findByText('Close Period')).closest('button')!
    expect(button).toBeDisabled()

    // findBy, not getBy: the checkbox and the button render off the same
    // fetch but not guaranteed in the same tick, which flaked here once.
    const checkbox = await screen.findByRole('checkbox')
    fireEvent.click(checkbox)

    await waitFor(() => expect(button).not.toBeDisabled())
    fireEvent.click(button)

    await waitFor(() =>
      expect(mockClosePeriod).toHaveBeenCalledWith('kg1', '2026-05', {
        entityId: null,
        allowStaleSync: false,
        allowStrandedObligations: true,
        allowUnreconciledAccounts: false,
      })
    )
  })

  it('names what is unreconciled and lets the close go ahead without it', async () => {
    mockGetFiscalCalendar.mockResolvedValue({
      ...CALENDAR,
      closeableNow: false,
      blockers: ['unreconciled_accounts'],
      unreconciledAccountCount: 1,
      unreconciledAccountSample: [
        'Prepaid Insurance (schedules): unreconciled',
      ],
    })
    render(<PeriodClosePanel graphId="kg1" />)

    expect(
      await screen.findByText('Prepaid Insurance (schedules): unreconciled')
    ).toBeInTheDocument()
    expect(screen.queryByText('unreconciled_accounts')).not.toBeInTheDocument()

    const button = (await screen.findByText('Close Period')).closest('button')!
    expect(button).toBeDisabled()
    fireEvent.click(await screen.findByLabelText('Close without reconciling'))
    await waitFor(() => expect(button).not.toBeDisabled())
    fireEvent.click(button)

    await waitFor(() =>
      expect(mockClosePeriod).toHaveBeenCalledWith('kg1', '2026-05', {
        entityId: null,
        allowStaleSync: false,
        allowStrandedObligations: false,
        allowUnreconciledAccounts: true,
      })
    )
  })

  it('withholds the override when something else also blocks the close', async () => {
    // The override clears one deliberate exception, not a pile of unrelated
    // problems — so it is offered only when its blocker stands alone.
    mockGetFiscalCalendar.mockResolvedValue({
      ...BLOCKED_ON_STRANDED,
      blockers: ['stranded_obligations', 'sequence_violation'],
    })
    render(<PeriodClosePanel graphId="kg1" />)

    const button = (await screen.findByText('Close Period')).closest('button')!
    expect(button).toBeDisabled()
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
  })

  it('splits the close receipt when drafts left by both routes', async () => {
    mockGetFiscalCalendar.mockResolvedValue(CALENDAR)
    mockClosePeriod.mockResolvedValue({
      ...CLOSE_RESULT,
      entriesPosted: 5,
      entriesPublishedToQb: 2,
      entriesPostedLocally: 3,
    })
    render(<PeriodClosePanel graphId="kg1" />)
    fireEvent.click(await screen.findByText('Close Period'))

    expect(
      await screen.findByText(/2 to QuickBooks, 3 local/)
    ).toBeInTheDocument()
  })

  it('omits the split when every draft took the same route', async () => {
    // CLOSE_RESULT posts all 3 locally — a split that says "0 to QuickBooks"
    // is noise, not information.
    mockGetFiscalCalendar.mockResolvedValue(CALENDAR)
    render(<PeriodClosePanel graphId="kg1" />)
    fireEvent.click(await screen.findByText('Close Period'))

    expect(await screen.findByText(/3 drafts posted/)).toBeInTheDocument()
    expect(screen.queryByText(/to QuickBooks/)).not.toBeInTheDocument()
  })
})
