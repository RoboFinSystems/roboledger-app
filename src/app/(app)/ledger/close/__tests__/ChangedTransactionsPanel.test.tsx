import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockListEventBlocks = vi.fn()
const mockPreviewReconcilingItem = vi.fn()
const mockResolveReconcilingItem = vi.fn()

vi.mock('@robosystems/core', () => ({
  clients: {
    ledger: {
      listEventBlocks: (...args: any[]) => mockListEventBlocks(...args),
      previewReconcilingItem: (...args: any[]) =>
        mockPreviewReconcilingItem(...args),
      resolveReconcilingItem: (...args: any[]) =>
        mockResolveReconcilingItem(...args),
    },
  },
  LoadingState: () => (
    <div data-testid="loading-state" role="status">
      Loading
    </div>
  ),
}))

vi.mock('flowbite-react', () => ({
  Button: ({ children, onClick, disabled }: any) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
  Label: ({ children, htmlFor }: any) => (
    <label htmlFor={htmlFor}>{children}</label>
  ),
  Spinner: () => <span data-testid="spinner" />,
  Table: ({ children }: any) => <table>{children}</table>,
  TableBody: ({ children }: any) => <tbody>{children}</tbody>,
  TableCell: ({ children }: any) => <td>{children}</td>,
  TableHead: ({ children }: any) => <thead>{children}</thead>,
  TableHeadCell: ({ children }: any) => <th>{children}</th>,
  TableRow: ({ children }: any) => <tr>{children}</tr>,
  Textarea: ({ value, onChange, id }: any) => (
    <textarea id={id} value={value} onChange={onChange} />
  ),
}))

vi.mock('react-icons/hi', () => ({
  HiCheckCircle: () => <span />,
  HiExclamationCircle: () => <span />,
}))

import ChangedTransactionsPanel from '../components/ChangedTransactionsPanel'

const event = (overrides: Record<string, unknown> = {}) => ({
  id: 'evt_invoice',
  eventType: 'invoice_issued',
  occurredAt: '2026-07-14T00:00:00Z',
  externalId: 'qb-inv-1042',
  externalUrl: null,
  source: 'quickbooks',
  amount: 150000,
  currency: 'USD',
  description: 'Invoice 1042 to Northwind',
  ...overrides,
})

const plan = (overrides: Record<string, unknown> = {}) => ({
  event_id: 'evt_invoice',
  source: 'quickbooks',
  event_type: 'invoice_issued',
  event_status: 'fulfilled',
  default_disposition: 'restate',
  default_posting_date: '2026-09-30',
  closed_periods: [],
  prior_entries: [
    {
      entry_id: 'ent_1',
      posting_date: '2026-07-14',
      memo: 'Invoice 1042',
      total_debit: 120000,
      total_credit: 120000,
    },
  ],
  accepted_entries: [
    {
      entry_id: null,
      posting_date: '2026-07-14',
      memo: 'Invoice 1042',
      total_debit: 150000,
      total_credit: 150000,
    },
  ],
  delta: [
    {
      element_id: 'elem_ar',
      element_code: '1200',
      element_name: 'Accounts Receivable',
      prior_net: 120000,
      accepted_net: 150000,
      delta: 30000,
    },
    {
      element_id: 'elem_rev',
      element_code: '4000',
      element_name: 'Service Revenue',
      prior_net: -120000,
      accepted_net: -150000,
      delta: -30000,
    },
  ],
  no_gl_effect: false,
  restate_blockers: [],
  unmapped_element_external_ids: [],
  ...overrides,
})

const resolved = (overrides: Record<string, unknown> = {}) => ({
  event_id: 'evt_invoice',
  disposition: 'restate',
  regenerated: { entry_ids: ['ent_2'] },
  resolved_at: '2026-10-03T12:00:00Z',
  resolved_by: 'user_1',
  ...overrides,
})

const refusal = (detail: string) => new Error(JSON.stringify({ detail }))

async function openFirst() {
  render(<ChangedTransactionsPanel graphId="kg_books" />)
  fireEvent.click(await screen.findByRole('button', { name: 'Review' }))
  await screen.findByText('Difference by account')
}

describe('ChangedTransactionsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    mockListEventBlocks.mockResolvedValue([event()])
    mockPreviewReconcilingItem.mockResolvedValue(plan())
    mockResolveReconcilingItem.mockResolvedValue(resolved())
  })

  it('asks only for the transactions changed at the source', async () => {
    render(<ChangedTransactionsPanel graphId="kg_books" />)

    await screen.findByText('qb-inv-1042')
    expect(mockListEventBlocks).toHaveBeenCalledWith(
      'kg_books',
      expect.objectContaining({ isReconcilingItem: true })
    )
    expect(screen.getByText('Invoice 1042 to Northwind')).toBeInTheDocument()
    expect(screen.getByText('invoice issued')).toBeInTheDocument()
    expect(screen.getByText('$1,500.00')).toBeInTheDocument()
  })

  it('names where each change came from, and links to it there', async () => {
    mockListEventBlocks.mockResolvedValue([
      event({ externalUrl: 'https://qbo.example/txn/1042' }),
      event({
        id: 'evt_bank',
        source: 'plaid',
        externalId: 'bank-line-7',
        occurredAt: '2026-06-02T00:00:00Z',
      }),
    ])
    mockPreviewReconcilingItem.mockResolvedValue(
      plan({ event_id: 'evt_bank', source: 'plaid' })
    )
    render(<ChangedTransactionsPanel graphId="kg_books" />)

    expect(await screen.findByText('QuickBooks')).toBeInTheDocument()
    expect(screen.getByText('Plaid')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'qb-inv-1042' })).toHaveAttribute(
      'href',
      'https://qbo.example/txn/1042'
    )
    // No link where the source gave none.
    expect(
      screen.queryByRole('link', { name: 'bank-line-7' })
    ).not.toBeInTheDocument()

    fireEvent.click(screen.getAllByRole('button', { name: 'Review' })[1])
    expect(await screen.findByText('Plaid now')).toBeInTheDocument()
  })

  it('names a transaction by its type when it has no description', async () => {
    mockListEventBlocks.mockResolvedValue([event({ description: null })])
    render(<ChangedTransactionsPanel graphId="kg_books" />)

    expect(await screen.findAllByText('invoice issued')).toHaveLength(1)
  })

  it('says so when nothing is waiting', async () => {
    mockListEventBlocks.mockResolvedValue([])
    render(<ChangedTransactionsPanel graphId="kg_books" />)

    expect(
      await screen.findByText('Nothing is waiting to be settled.')
    ).toBeInTheDocument()
  })

  it('does not claim nothing is waiting when the list failed to load', async () => {
    mockListEventBlocks.mockRejectedValue(new Error('boom'))
    render(<ChangedTransactionsPanel graphId="kg_books" />)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Failed to load changed transactions.'
    )
    expect(
      screen.queryByText('Nothing is waiting to be settled.')
    ).not.toBeInTheDocument()
  })

  it('shows what was posted, what the source says now, and the difference', async () => {
    await openFirst()

    expect(mockPreviewReconcilingItem).toHaveBeenCalledWith(
      'kg_books',
      'evt_invoice'
    )
    expect(screen.getByText('Accounts Receivable')).toBeInTheDocument()
    expect(screen.getByText('$1,200.00 Dr')).toBeInTheDocument()
    expect(screen.getByText('$1,500.00 Dr')).toBeInTheDocument()
    expect(screen.getByText('$300.00 Dr')).toBeInTheDocument()
    expect(screen.getByText('$300.00 Cr')).toBeInTheDocument()
    // Looking at a change settles nothing.
    expect(mockResolveReconcilingItem).not.toHaveBeenCalled()
  })

  it('starts on the treatment the plan recommends', async () => {
    mockPreviewReconcilingItem.mockResolvedValue(
      plan({ default_disposition: 'catch_up' })
    )
    await openFirst()

    expect(screen.getByRole('radio', { name: /^Catch up/ })).toBeChecked()
    expect(screen.getByRole('radio', { name: /^Restate/ })).not.toBeChecked()
  })

  it('settles with the chosen treatment and takes the row off the list', async () => {
    await openFirst()
    fireEvent.click(screen.getByRole('button', { name: 'Settle' }))

    await waitFor(() =>
      expect(mockResolveReconcilingItem).toHaveBeenCalledWith('kg_books', {
        event_id: 'evt_invoice',
        disposition: 'restate',
      })
    )
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Restated. 1 entry was rebuilt to match the source.'
    )
    expect(screen.queryByText('qb-inv-1042')).not.toBeInTheDocument()
  })

  it('reports a catch-up as drafted, with its date', async () => {
    mockResolveReconcilingItem.mockResolvedValue(
      resolved({
        disposition: 'catch_up',
        regenerated: null,
        catch_up: {
          event_id: 'evt_catch_up',
          posting_date: '2026-09-30',
          status: 'draft',
        },
      })
    )
    await openFirst()
    fireEvent.click(screen.getByRole('radio', { name: /^Catch up/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Settle' }))

    expect(await screen.findByRole('status')).toHaveTextContent(
      /A catch-up entry was drafted for .*2026/
    )
    expect(mockResolveReconcilingItem).toHaveBeenCalledWith('kg_books', {
      event_id: 'evt_invoice',
      disposition: 'catch_up',
    })
  })

  it('will not offer a restate the ledger would refuse', async () => {
    mockPreviewReconcilingItem.mockResolvedValue(
      plan({
        default_disposition: 'catch_up',
        closed_periods: ['2026-07'],
        restate_blockers: [
          'posted in closed period(s) 2026-07 — reopen first, or catch up',
        ],
      })
    )
    await openFirst()

    expect(screen.getByRole('radio', { name: /^Restate/ })).toBeDisabled()
    expect(
      screen.getByText(/Not available: posted in closed period\(s\) 2026-07/)
    ).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /^Catch up/ })).toBeChecked()
    expect(screen.getByRole('button', { name: 'Settle' })).toBeEnabled()
  })

  it('leaves only "mark as handled" when the source uses an unmapped account', async () => {
    mockPreviewReconcilingItem.mockResolvedValue(
      plan({
        default_disposition: 'catch_up',
        unmapped_element_external_ids: ['qb-acct-88'],
      })
    )
    await openFirst()

    expect(screen.getByRole('radio', { name: /^Restate/ })).toBeDisabled()
    expect(screen.getByRole('radio', { name: /^Catch up/ })).toBeDisabled()
    expect(
      screen.getByRole('radio', { name: /^Mark as handled/ })
    ).toBeEnabled()
    // The recommended treatment is one that cannot run, so nothing settles
    // until another is chosen.
    expect(screen.getByRole('button', { name: 'Settle' })).toBeDisabled()
  })

  it('requires a note to mark a change as handled, and sends it', async () => {
    mockResolveReconcilingItem.mockResolvedValue(
      resolved({ disposition: 'acknowledge', regenerated: null })
    )
    await openFirst()
    fireEvent.click(screen.getByRole('radio', { name: /^Mark as handled/ }))

    const settle = screen.getByRole('button', { name: 'Settle' })
    expect(settle).toBeDisabled()

    fireEvent.change(screen.getByLabelText(/Note/), {
      target: { value: '  Booked by JE-88 in September  ' },
    })
    expect(settle).toBeEnabled()
    fireEvent.click(settle)

    await waitFor(() =>
      expect(mockResolveReconcilingItem).toHaveBeenCalledWith('kg_books', {
        event_id: 'evt_invoice',
        disposition: 'acknowledge',
        note: 'Booked by JE-88 in September',
      })
    )
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Marked as handled. Nothing was posted.'
    )
  })

  it('holds the other rows still while one is being settled', async () => {
    mockListEventBlocks.mockResolvedValue([
      event(),
      event({ id: 'evt_bill', externalId: 'qb-bill-7' }),
    ])
    let finish: (value: unknown) => void = () => {}
    mockResolveReconcilingItem.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve
      })
    )
    render(<ChangedTransactionsPanel graphId="kg_books" />)
    fireEvent.click(
      (await screen.findAllByRole('button', { name: 'Review' }))[0]
    )
    await screen.findByText('Difference by account')
    fireEvent.click(screen.getByRole('button', { name: 'Settle' }))

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Review' })).toBeDisabled()
    )
    expect(screen.getByRole('button', { name: 'Hide' })).toBeDisabled()

    finish(resolved())
    expect(await screen.findByRole('status')).toHaveTextContent('Restated.')
    expect(screen.getByRole('button', { name: 'Review' })).toBeEnabled()
  })

  it('says a wording-only change moves no figures', async () => {
    mockPreviewReconcilingItem.mockResolvedValue(
      plan({ delta: [], no_gl_effect: true })
    )
    await openFirst()

    expect(screen.getByText(/No account's balance changes/)).toBeInTheDocument()
    expect(screen.getByText(/No figures change\./)).toBeInTheDocument()
    expect(
      screen.getByText(/This change moves no money, so nothing posts\./)
    ).toBeInTheDocument()
  })

  it('keeps the change open and shows the refusal when settling fails', async () => {
    mockResolveReconcilingItem.mockRejectedValue(
      refusal('Event evt_invoice is being written by another process.')
    )
    await openFirst()
    fireEvent.click(screen.getByRole('button', { name: 'Settle' }))

    // The app's words for the refusal, not the API's.
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Another process (usually a running sync) is writing this right now.'
    )
    expect(screen.getByText('qb-inv-1042')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Settle' })).toBeEnabled()
  })

  it('drops a change someone else already settled', async () => {
    mockResolveReconcilingItem.mockRejectedValue(
      refusal(
        "Event evt_invoice is not a reconciling item — its payload matches the source system. It was already resolved as 'restate'."
      )
    )
    await openFirst()
    fireEvent.click(screen.getByRole('button', { name: 'Settle' }))

    expect(await screen.findByRole('status')).toHaveTextContent(
      'That change was already settled. Nothing was done.'
    )
    expect(screen.queryByText('qb-inv-1042')).not.toBeInTheDocument()
  })

  it('shows the newer figures when the source changed again mid-review', async () => {
    mockResolveReconcilingItem.mockRejectedValue(
      refusal(
        'Event evt_invoice was re-flagged with a newer payload while this resolution was being prepared. Preview it again.'
      )
    )
    await openFirst()
    mockPreviewReconcilingItem.mockResolvedValue(
      plan({
        delta: [
          {
            element_id: 'elem_ar',
            element_name: 'Accounts Receivable',
            prior_net: 120000,
            accepted_net: 175000,
            delta: 55000,
          },
        ],
      })
    )
    fireEvent.click(screen.getByRole('button', { name: 'Settle' }))

    expect(await screen.findByText('$550.00 Dr')).toBeInTheDocument()
    expect(
      screen.getByText(/This transaction changed again at the source/)
    ).toBeInTheDocument()
    expect(mockPreviewReconcilingItem).toHaveBeenCalledTimes(2)
    expect(screen.getByText('qb-inv-1042')).toBeInTheDocument()
  })

  it('drops a change that was settled before it could be reviewed', async () => {
    mockPreviewReconcilingItem.mockRejectedValue(
      refusal(
        'Event evt_invoice is not a reconciling item — its payload matches the source system.'
      )
    )
    render(<ChangedTransactionsPanel graphId="kg_books" />)
    fireEvent.click(await screen.findByRole('button', { name: 'Review' }))

    expect(
      await screen.findByText(
        'That change was already settled. Nothing was done.'
      )
    ).toBeInTheDocument()
    expect(screen.queryByText('qb-inv-1042')).not.toBeInTheDocument()
  })

  it('clears the last outcome when another change is opened', async () => {
    mockListEventBlocks.mockResolvedValue([
      event(),
      event({ id: 'evt_bill', externalId: 'qb-bill-7' }),
    ])
    render(<ChangedTransactionsPanel graphId="kg_books" />)
    fireEvent.click(
      (await screen.findAllByRole('button', { name: 'Review' }))[0]
    )
    await screen.findByText('Difference by account')
    fireEvent.click(screen.getByRole('button', { name: 'Settle' }))
    expect(await screen.findByText(/^Restated\./)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Review' }))
    await screen.findByText('Difference by account')
    expect(screen.queryByText(/^Restated\./)).not.toBeInTheDocument()
  })

  it('brings in the changes a full page hid once one is settled', async () => {
    const page = Array.from({ length: 200 }, (_, i) =>
      event({ id: `evt_${i}`, externalId: `qb-${i}` })
    )
    mockListEventBlocks.mockResolvedValueOnce(page)
    mockListEventBlocks.mockResolvedValueOnce([
      ...page.slice(1),
      event({ id: 'evt_next', externalId: 'qb-next' }),
    ])
    render(<ChangedTransactionsPanel graphId="kg_books" />)

    expect(
      await screen.findByText('Showing 200. More appear as these are settled.')
    ).toBeInTheDocument()
    fireEvent.click(screen.getAllByRole('button', { name: 'Review' })[0])
    await screen.findByText('Difference by account')
    fireEvent.click(screen.getByRole('button', { name: 'Settle' }))

    expect(await screen.findByText('qb-next')).toBeInTheDocument()
    expect(mockListEventBlocks).toHaveBeenCalledTimes(2)
    expect(screen.queryByText('qb-0')).not.toBeInTheDocument()
  })

  it('does not refetch after a settle when the whole list was on screen', async () => {
    await openFirst()
    fireEvent.click(screen.getByRole('button', { name: 'Settle' }))

    await screen.findByText(/^Restated\./)
    expect(mockListEventBlocks).toHaveBeenCalledTimes(1)
  })

  it('links a reference only to a web address', async () => {
    mockListEventBlocks.mockResolvedValue([
      event({ externalUrl: 'javascript:alert(1)' }),
    ])
    render(<ChangedTransactionsPanel graphId="kg_books" />)

    expect(await screen.findByText('qb-inv-1042')).toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: 'qb-inv-1042' })
    ).not.toBeInTheDocument()
  })

  it('ignores a preview that lands after another change was opened', async () => {
    mockListEventBlocks.mockResolvedValue([
      event(),
      event({
        id: 'evt_bill',
        externalId: 'qb-bill-7',
        occurredAt: '2026-06-02T00:00:00Z',
      }),
    ])
    let releaseFirst: (value: unknown) => void = () => {}
    mockPreviewReconcilingItem.mockImplementation((_graph, eventId) =>
      eventId === 'evt_invoice'
        ? new Promise((resolve) => {
            releaseFirst = resolve
          })
        : Promise.resolve(
            plan({
              event_id: 'evt_bill',
              delta: [
                {
                  element_id: 'elem_ap',
                  element_name: 'Accounts Payable',
                  prior_net: -5000,
                  accepted_net: -9000,
                  delta: -4000,
                },
              ],
            })
          )
    )
    render(<ChangedTransactionsPanel graphId="kg_books" />)

    const [first, second] = await screen.findAllByRole('button', {
      name: 'Review',
    })
    fireEvent.click(first)
    fireEvent.click(second)
    expect(await screen.findByText('Accounts Payable')).toBeInTheDocument()

    releaseFirst(plan())
    await waitFor(() =>
      expect(screen.queryByText('Accounts Receivable')).not.toBeInTheDocument()
    )
  })
})
