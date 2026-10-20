import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockListAccounts = vi.fn()
const mockGetAccountRegister = vi.fn()
const mockReplace = vi.fn()
let search = new URLSearchParams('')
let modalProps: any = null

vi.mock('@robosystems/core', () => ({
  clients: {
    ledger: {
      listAccounts: (...args: any[]) => mockListAccounts(...args),
      getAccountRegister: (...args: any[]) => mockGetAccountRegister(...args),
    },
  },
  PageLayout: ({ children }: any) => <div>{children}</div>,
  PageHeader: ({ title }: any) => <div data-testid="page-header">{title}</div>,
  LoadingState: () => <div data-testid="loading-state" />,
  EmptyState: ({ title, description }: any) => (
    <div data-testid="empty-state">
      <h3>{title}</h3>
      {description}
    </div>
  ),
}))

vi.mock('@/lib/useLedgerGraph', () => ({
  useLedgerGraph: () => ({ graph: { graphId: 'kg_a' } }),
}))

const mockScope = vi.fn(() => ({
  entityId: null as string | null,
  entities: [
    { id: 'ent_parent', name: 'Harbor Holdings' },
    { id: 'ent_sub', name: 'Maple Court' },
  ],
}))
vi.mock('@/lib/entity-scope', () => ({ useEntityScope: () => mockScope() }))

vi.mock('next/navigation', () => ({
  useSearchParams: () => search,
  useRouter: () => ({ replace: mockReplace }),
  usePathname: () => '/ledger/account-register',
}))

vi.mock('../../inbox/EventBlockDetailModal', () => ({
  default: (props: any) => {
    modalProps = props
    return <div data-testid="event-modal" />
  },
}))

vi.mock('flowbite-react', () => ({
  Alert: ({ children }: any) => <div data-testid="alert">{children}</div>,
  Badge: ({ children }: any) => <span>{children}</span>,
  Button: ({ children, onClick, disabled }: any) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
  Card: ({ children }: any) => <div>{children}</div>,
  Label: ({ children }: any) => <label>{children}</label>,
  Select: ({ children, ...props }: any) => (
    <select {...props}>{children}</select>
  ),
  Table: ({ children }: any) => <table>{children}</table>,
  TableBody: ({ children }: any) => <tbody>{children}</tbody>,
  TableCell: ({ children, colSpan }: any) => (
    <td colSpan={colSpan}>{children}</td>
  ),
  TableHead: ({ children }: any) => <thead>{children}</thead>,
  TableHeadCell: ({ children }: any) => <th>{children}</th>,
  TableRow: ({ children }: any) => <tr>{children}</tr>,
  TextInput: (props: any) => <input type="text" {...props} />,
  ToggleSwitch: ({ checked, onChange, label }: any) => (
    <input
      type="checkbox"
      aria-label={label}
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
    />
  ),
}))

import AccountRegisterContent from '../content'

function line(overrides: Record<string, unknown> = {}) {
  return {
    lineId: 'li_1',
    entryId: 'je_1',
    entryNumber: '42',
    postingDate: '2026-09-03',
    entryType: 'standard',
    provenance: 'event_handler',
    status: 'posted',
    memo: 'Consulting fees',
    description: null,
    debit: 25,
    credit: 0,
    balance: 125,
    triggeredByEventId: 'evt_1',
    triggeredByEventType: 'invoice_issued',
    reversalOf: null,
    reversedBy: null,
    agentId: 'agt_acme',
    agentName: 'Acme',
    flowElementId: null,
    dimensions: [],
    ...overrides,
  }
}

function register(overrides: Record<string, unknown> = {}) {
  return {
    account: {
      id: 'elem_cash',
      code: '1000',
      name: 'Cash',
      balanceType: 'debit',
      trait: 'asset',
      temporary: false,
    },
    entityId: 'ent_sub',
    startDate: '2026-09-01',
    endDate: '2026-09-30',
    openingFrom: null,
    openingBalance: 100,
    totalDebits: 25,
    totalCredits: 0,
    closingBalance: 125,
    lineCount: 1,
    pageOpeningBalance: 100,
    nextCursor: null,
    sliced: false,
    draftsTruncated: false,
    lines: [line()],
    drafts: [],
    ...overrides,
  }
}

describe('AccountRegisterContent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    modalProps = null
    search = new URLSearchParams('')
    mockListAccounts.mockResolvedValue({
      accounts: [{ id: 'elem_cash', code: '1000', name: 'Cash' }],
    })
    mockGetAccountRegister.mockResolvedValue(register())
  })

  it('asks for an account before reading anything', async () => {
    render(<AccountRegisterContent />)
    expect(await screen.findByText('Choose an account')).toBeInTheDocument()
    expect(mockGetAccountRegister).not.toHaveBeenCalled()
  })

  it("reads the linked account in the linked entity's books", async () => {
    search = new URLSearchParams(
      'accountId=elem_cash&entityId=ent_sub&start=2026-09-01&end=2026-09-30'
    )
    render(<AccountRegisterContent />)

    await waitFor(() => expect(mockGetAccountRegister).toHaveBeenCalled())
    expect(mockGetAccountRegister).toHaveBeenCalledWith('kg_a', 'elem_cash', {
      entityId: 'ent_sub',
      startDate: '2026-09-01',
      endDate: '2026-09-30',
      dimension: null,
      includeDrafts: false,
    })
    expect(mockListAccounts).toHaveBeenCalledWith('kg_a', {
      entityId: 'ent_sub',
      isActive: true,
      limit: 500,
    })
    expect(await screen.findByText('Consulting fees')).toBeInTheDocument()
    expect(screen.getByText('Acme')).toBeInTheDocument()
    expect(
      screen.getByText('Closing balance', { selector: 'td' })
    ).toBeInTheDocument()
  })

  it('passes a dimension slice and says the balances are the slice', async () => {
    search = new URLSearchParams(
      'accountId=elem_cash&dimensionType=department&dimensionMemberId=dim_sales'
    )
    mockGetAccountRegister.mockResolvedValue(register({ sliced: true }))
    render(<AccountRegisterContent />)

    await waitFor(() => expect(mockGetAccountRegister).toHaveBeenCalled())
    expect(mockGetAccountRegister.mock.calls[0][2].dimension).toEqual({
      type: 'department',
      memberId: 'dim_sales',
    })
    expect(await screen.findByText(/Read for one slice/)).toBeInTheDocument()
  })

  it('loads the next page and keeps the running balance', async () => {
    search = new URLSearchParams('accountId=elem_cash')
    mockGetAccountRegister
      .mockResolvedValueOnce(
        register({ lineCount: 2, nextCursor: 'cur_2', closingBalance: 135 })
      )
      .mockResolvedValueOnce(
        register({
          lines: [line({ lineId: 'li_2', memo: 'Second sale', balance: 135 })],
          nextCursor: null,
        })
      )
    render(<AccountRegisterContent />)

    fireEvent.click(await screen.findByText('Load more'))

    expect(await screen.findByText('Second sale')).toBeInTheDocument()
    expect(mockGetAccountRegister.mock.calls[1][2].after).toBe('cur_2')
    expect(screen.queryByText('Load more')).not.toBeInTheDocument()
  })

  it("opens a line's event read-only", async () => {
    search = new URLSearchParams('accountId=elem_cash')
    render(<AccountRegisterContent />)

    fireEvent.click(await screen.findByText(/from invoice issued/))

    expect(screen.getByTestId('event-modal')).toBeInTheDocument()
    expect(modalProps.eventId).toBe('evt_1')
    expect(modalProps.readOnly).toBe(true)
  })

  it('changing the account rewrites the URL', async () => {
    render(<AccountRegisterContent />)
    const picker = await screen.findByRole('combobox')
    await waitFor(() =>
      expect(screen.getByText('1000 — Cash')).toBeInTheDocument()
    )
    fireEvent.change(picker, { target: { value: 'elem_cash' } })
    expect(mockReplace).toHaveBeenCalledWith(
      '/ledger/account-register?accountId=elem_cash'
    )
  })
})
