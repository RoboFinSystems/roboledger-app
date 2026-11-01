import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockGetFiscalCalendar = vi.fn()
const mockListJournalEntries = vi.fn()

vi.mock('@robosystems/core', () => ({
  clients: {
    ledger: {
      getFiscalCalendar: (...args: any[]) => mockGetFiscalCalendar(...args),
      listJournalEntries: (...args: any[]) => mockListJournalEntries(...args),
    },
  },
}))

vi.mock('@/components/OpeningBalanceForm', () => ({
  default: ({ asOf, existing, onRecorded }: any) => (
    <div
      data-testid="opening-form"
      data-as-of={asOf}
      data-lines={existing ? existing.length : 0}
    >
      <button onClick={onRecorded}>record</button>
    </div>
  ),
  dayBefore: (iso: string) => {
    const t = new Date(`${iso}T00:00:00Z`)
    t.setUTCDate(t.getUTCDate() - 1)
    return t.toISOString().slice(0, 10)
  },
}))

vi.mock('@robosystems/core/ui', () => ({
  Button: ({ children, onClick }: any) => (
    <button onClick={onClick}>{children}</button>
  ),
  Card: ({ children }: any) => <section>{children}</section>,
  Modal: ({ children }: any) => <div>{children}</div>,
  ModalHeader: ({ children }: any) => <h3>{children}</h3>,
}))

import OpeningBalanceCard from '../components/OpeningBalanceCard'

const period = (name: string, status = 'open') => ({
  name,
  startDate: `${name}-01`,
  endDate: `${name}-28`,
  status,
})
const OPEN_CALENDAR = {
  closedThrough: null,
  periods: [period('2026-07'), period('2026-06')],
}
const OPENING = {
  id: 'je_open',
  postingDate: '2026-05-31',
  totalDebit: 700,
  lineItems: [
    {
      accountId: 'acc_cash',
      accountName: 'Checking',
      accountCode: '1000',
      debitAmount: 700,
      creditAmount: 0,
    },
    {
      accountId: 'acc_obe',
      accountName: 'Opening Balance Equity',
      accountCode: '3900',
      debitAmount: 0,
      creditAmount: 700,
    },
  ],
}

const native = { id: 'ent_sub', name: 'Harbor Café', source: 'native' } as any

function renderCard(entity = native) {
  return render(
    <OpeningBalanceCard graphId="kg_a" entityId="ent_sub" entity={entity} />
  )
}

describe('OpeningBalanceCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetFiscalCalendar.mockResolvedValue(OPEN_CALENDAR)
    mockListJournalEntries.mockResolvedValue({ entries: [] })
  })

  it('offers the opening on new books, as of the eve of the first month', async () => {
    renderCard()
    fireEvent.click(
      await screen.findByRole('button', { name: 'Record opening balance' })
    )
    expect(screen.getByTestId('opening-form')).toHaveAttribute(
      'data-as-of',
      '2026-05-31'
    )
    expect(mockListJournalEntries).toHaveBeenCalledWith('kg_a', {
      type: 'opening',
      status: 'posted',
      entityId: 'ent_sub',
      limit: 1,
    })
  })

  it('shows a recorded opening and replaces it until the first close', async () => {
    mockListJournalEntries.mockResolvedValue({ entries: [OPENING] })
    renderCard()
    expect(
      await screen.findByText('Opening Balance Equity', { exact: false })
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Replace…' }))
    expect(screen.getByTestId('opening-form')).toHaveAttribute(
      'data-lines',
      '2'
    )

    fireEvent.click(screen.getByRole('button', { name: 'record' }))
    await waitFor(() => expect(mockListJournalEntries).toHaveBeenCalledTimes(2))
  })

  it('is read-only once a month has closed', async () => {
    mockListJournalEntries.mockResolvedValue({ entries: [OPENING] })
    mockGetFiscalCalendar.mockResolvedValue({
      closedThrough: '2026-06',
      periods: [period('2026-07'), period('2026-06', 'closed')],
    })
    renderCard()
    expect(
      await screen.findByText(/Locked: the first month has closed/)
    ).toBeInTheDocument()
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('renders nothing where an opening does not apply', async () => {
    const { container, unmount } = renderCard({
      ...native,
      source: 'quickbooks',
    })
    await waitFor(() => expect(mockListJournalEntries).toHaveBeenCalled())
    expect(container).toBeEmptyDOMElement()
    unmount()

    // History closed elsewhere starts locked, with nothing recorded.
    mockGetFiscalCalendar.mockResolvedValue({
      closedThrough: '2026-05',
      periods: [period('2026-06')],
    })
    const locked = renderCard()
    await waitFor(() => expect(mockGetFiscalCalendar).toHaveBeenCalledTimes(2))
    expect(locked.container).toBeEmptyDOMElement()
  })
})
