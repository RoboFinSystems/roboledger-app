import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockGetFiscalCalendar = vi.fn()
const mockGetAgedBalances = vi.fn()
const mockGetOpenItemsForAgent = vi.fn()

vi.mock('@robosystems/core', () => ({
  clients: {
    ledger: {
      getFiscalCalendar: (...args: any[]) => mockGetFiscalCalendar(...args),
      getAgedBalances: (...args: any[]) => mockGetAgedBalances(...args),
      getOpenItemsForAgent: (...args: any[]) =>
        mockGetOpenItemsForAgent(...args),
    },
  },
  PageLayout: ({ children }: any) => <div>{children}</div>,
  PageHeader: ({ title }: any) => <div data-testid="page-header">{title}</div>,
  LoadingState: () => <div role="status">Loading</div>,
  EmptyState: ({ title }: any) => <div data-testid="empty-state">{title}</div>,
}))

const GRAPH = { graphId: 'kg1', graphName: 'Books' }
vi.mock('@/lib/useLedgerGraph', () => ({
  useLedgerGraph: () => ({ graph: GRAPH }),
}))

const PARENT = { id: 'ent_parent', name: 'Driftline', entityRole: 'operating' }
const SUB = { id: 'ent_sub', name: 'Driftline Café', entityRole: 'operating' }
const mockScope = vi.fn()
vi.mock('@/lib/entity-scope', () => ({ useEntityScope: () => mockScope() }))

vi.mock('flowbite-react', () => ({
  Alert: ({ children }: any) => <div data-testid="alert">{children}</div>,
  Badge: ({ children }: any) => <span>{children}</span>,
  Button: ({ children, onClick, disabled }: any) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
  Card: ({ children }: any) => <div>{children}</div>,
  Select: (props: any) => <select {...props} />,
  Table: ({ children }: any) => <table>{children}</table>,
  TableBody: ({ children }: any) => <tbody>{children}</tbody>,
  TableCell: ({ children }: any) => <td>{children}</td>,
  TableHead: ({ children }: any) => <thead>{children}</thead>,
  TableHeadCell: ({ children }: any) => <th>{children}</th>,
  TableRow: ({ children, onClick }: any) => (
    <tr onClick={onClick}>{children}</tr>
  ),
  TextInput: ({ icon: _icon, sizing: _sizing, ...props }: any) => (
    <input {...props} />
  ),
}))

import { textCell } from '@/lib/ledger/csv'
import ReceivablesPayablesContent, { agingCsv, monthEnd } from '../content'

const buckets = (over: Record<string, number> = {}) => ({
  currentCents: 0,
  oneToThirtyCents: 0,
  thirtyOneToSixtyCents: 0,
  sixtyOneToNinetyCents: 0,
  overNinetyCents: 0,
  unappliedCreditCents: 0,
  totalCents: 0,
  ...over,
})

function aged(over: Record<string, any> = {}) {
  return {
    kind: 'receivables',
    asOf: '2026-09-30',
    scope: 'entity',
    entityId: 'ent_parent',
    memberEntityIds: ['ent_parent'],
    buckets: buckets({ thirtyOneToSixtyCents: 120000, totalCents: 120000 }),
    agents: [
      {
        agentId: 'agt_acme',
        agentName: 'Acme, Inc.',
        openItemCount: 1,
        oldestDueDate: '2026-08-15',
        buckets: buckets({ thirtyOneToSixtyCents: 120000, totalCents: 120000 }),
      },
    ],
    defaultedDueDateCount: 1,
    intercompany: [],
    pairs: [],
    tieOuts: [
      {
        entityId: 'ent_parent',
        accounts: [{ elementId: 'el_ar', code: '1100', name: 'A/R' }],
        controlBalanceCents: 110000,
        openItemsCents: 120000,
        differenceCents: 10000,
      },
    ],
    ...over,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  mockScope.mockReturnValue({ entityId: null, entities: [PARENT] })
  mockGetFiscalCalendar.mockResolvedValue({ closedThrough: '2026-09' })
  mockGetAgedBalances.mockResolvedValue(aged())
})

describe('ReceivablesPayablesContent', () => {
  it('ages receivables at the last closed month-end by default', async () => {
    render(<ReceivablesPayablesContent />)

    await waitFor(() => expect(mockGetAgedBalances).toHaveBeenCalled())
    expect(mockGetAgedBalances).toHaveBeenCalledWith('kg1', 'receivables', {
      asOf: '2026-09-30',
      entityId: null,
      scope: 'entity',
    })
    expect(await screen.findByText(/Acme, Inc\./)).toBeTruthy()
    expect(screen.getByText(/aged as due on receipt/)).toBeTruthy()
    expect(screen.getByText(/Difference/)).toBeTruthy()
  })

  it('switches to payables', async () => {
    render(<ReceivablesPayablesContent />)
    await screen.findByText(/Acme, Inc\./)

    fireEvent.click(screen.getByRole('button', { name: 'Payables' }))

    await waitFor(() =>
      expect(mockGetAgedBalances).toHaveBeenLastCalledWith(
        'kg1',
        'payables',
        expect.objectContaining({ asOf: '2026-09-30' })
      )
    )
  })

  it("opens a counterparty's row into its documents", async () => {
    mockGetOpenItemsForAgent.mockResolvedValue([
      {
        eventId: 'evt_1',
        entityId: 'ent_parent',
        agentId: 'agt_acme',
        occurredOn: '2026-08-15',
        documentNumber: 'INV-1042',
        description: null,
        originalCents: 120000,
        settledCents: 0,
        openCents: 120000,
        currency: 'USD',
        dueDate: '2026-08-15',
        dueDateBasis: 'defaulted',
        daysPastDue: 46,
        bucket: 'thirty_one_to_sixty',
      },
    ])
    render(<ReceivablesPayablesContent />)

    fireEvent.click(await screen.findByText(/Acme, Inc\./))

    expect(await screen.findByText('INV-1042')).toBeTruthy()
    expect(mockGetOpenItemsForAgent).toHaveBeenCalledWith(
      'kg1',
      'agt_acme',
      'receivables',
      { asOf: '2026-09-30', entityId: null }
    )
    expect(screen.getByText('46d late')).toBeTruthy()
  })

  it('offers the group on a parent with members, and shows the pairs', async () => {
    mockScope.mockReturnValue({ entityId: null, entities: [PARENT, SUB] })
    mockGetAgedBalances.mockImplementation(async (_g, _k, opts) =>
      opts.scope === 'group'
        ? aged({
            scope: 'group',
            pairs: [
              {
                creditorEntityId: 'ent_parent',
                debtorEntityId: 'ent_sub',
                receivableCents: 50000,
                payableCents: 45000,
                differenceCents: 5000,
              },
            ],
          })
        : aged()
    )
    render(<ReceivablesPayablesContent />)
    await screen.findByText(/Acme, Inc\./)

    fireEvent.click(screen.getByRole('button', { name: 'Group' }))

    expect(await screen.findByText('Between group entities')).toBeTruthy()
    expect(screen.getByText('Driftline Café')).toBeTruthy()
  })

  it('offers no group on a single-entity graph', async () => {
    render(<ReceivablesPayablesContent />)
    await screen.findByText(/Acme, Inc\./)

    expect(screen.queryByRole('button', { name: 'Group' })).toBeNull()
  })

  it('ages at today when no month has closed', async () => {
    mockGetFiscalCalendar.mockResolvedValue({ closedThrough: null })
    render(<ReceivablesPayablesContent />)

    await waitFor(() => expect(mockGetAgedBalances).toHaveBeenCalled())
    const asOf = mockGetAgedBalances.mock.calls[0][2].asOf
    expect(asOf).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(asOf).not.toBe('2026-09-30')
  })
})

describe('review follow-ups', () => {
  it('drops documents that answer after the table was reloaded', async () => {
    let answer: (items: any[]) => void = () => {}
    mockGetOpenItemsForAgent.mockReturnValue(
      new Promise((resolve) => {
        answer = resolve
      })
    )
    render(<ReceivablesPayablesContent />)
    fireEvent.click(await screen.findByText(/Acme, Inc\./))
    await waitFor(() => expect(mockGetOpenItemsForAgent).toHaveBeenCalled())

    fireEvent.click(screen.getByRole('button', { name: 'Payables' }))
    await waitFor(() =>
      expect(mockGetAgedBalances).toHaveBeenLastCalledWith(
        'kg1',
        'payables',
        expect.anything()
      )
    )
    answer([
      {
        eventId: 'evt_stale',
        entityId: 'ent_parent',
        agentId: 'agt_acme',
        occurredOn: '2026-08-15',
        documentNumber: 'INV-STALE',
        description: null,
        originalCents: 1,
        settledCents: 0,
        openCents: 1,
        currency: 'USD',
        dueDate: '2026-08-15',
        dueDateBasis: 'stated',
        daysPastDue: 0,
        bucket: 'current',
      },
    ])
    await screen.findByText(/Acme, Inc\./)

    expect(screen.queryByText('INV-STALE')).toBeNull()
  })

  it('opens a row from its button, which says whether it is open', async () => {
    mockGetOpenItemsForAgent.mockResolvedValue([])
    render(<ReceivablesPayablesContent />)
    const button = await screen.findByRole('button', {
      name: 'Show Acme, Inc. documents',
    })
    expect(button.getAttribute('aria-expanded')).toBe('false')

    fireEvent.click(button)

    expect(
      (
        await screen.findByRole('button', { name: 'Hide Acme, Inc. documents' })
      ).getAttribute('aria-expanded')
    ).toBe('true')
    expect(mockGetOpenItemsForAgent).toHaveBeenCalledTimes(1)
  })
})

describe('helpers', () => {
  it('keeps a name that starts like a formula as text', () => {
    expect(textCell('=HYPERLINK("x")')).toBe(`'=HYPERLINK("x")`)
    expect(textCell('+1 Supplies')).toBe("'+1 Supplies")
    expect(textCell('Acme')).toBe('Acme')
    const csv = agingCsv(
      aged({
        agents: [{ ...aged().agents[0], agentName: '=cmd' }],
      }) as any
    )
    expect(csv.split('\n')[1].startsWith("'=cmd,")).toBe(true)
  })

  it('finds the last day of a month', () => {
    expect(monthEnd('2026-02')).toBe('2026-02-28')
    expect(monthEnd('2026-09')).toBe('2026-09-30')
  })

  it('writes the counterparty table as CSV, quoting names', () => {
    const csv = agingCsv(aged() as any)
    const [header, row] = csv.split('\n')
    expect(header.startsWith('Counterparty,Current,')).toBe(true)
    expect(
      row.startsWith('"Acme, Inc.",0,0,1200,0,0,0,1200,1,2026-08-15')
    ).toBe(true)
  })
})
