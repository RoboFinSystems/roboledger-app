import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockListBankAccounts = vi.fn()
const mockUseGraphContext = vi.fn()
const mockLedgerGraph = vi.fn()
const mockScope = vi.fn()
const mockShowSuccess = vi.fn()
const mockShowError = vi.fn()
const mockPush = vi.fn()
let moveProps: any = null

vi.mock('@/lib/useLedgerGraph', () => ({
  useLedgerGraph: () => mockLedgerGraph(),
}))

vi.mock('@/lib/entity-scope', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>
  return { ...actual, useEntityScope: () => mockScope() }
})

vi.mock('@robosystems/core', () => ({
  clients: {
    ledger: {
      listBankAccounts: (...args: any[]) => mockListBankAccounts(...args),
    },
  },
  PageLayout: ({ children }: any) => <div>{children}</div>,
  PageHeader: ({ title, subtitle, actions }: any) => (
    <div>
      <h1>{title}</h1>
      {subtitle ? <p>{subtitle}</p> : null}
      {actions}
    </div>
  ),
  LoadingState: () => <div data-testid="loading-state" />,
  EmptyState: ({ title, description, action }: any) => (
    <div data-testid="empty-state">
      <h3>{title}</h3>
      {description ? <p>{description}</p> : null}
      {action}
    </div>
  ),
  useGraphContext: () => mockUseGraphContext(),
  useToast: () => ({
    showSuccess: mockShowSuccess,
    showError: mockShowError,
    ToastContainer: () => null,
  }),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

vi.mock('../components/MoveAccountModal', () => ({
  default: (props: any) => {
    moveProps = props
    return props.show ? (
      <div data-testid="move-modal">{props.account?.name}</div>
    ) : null
  },
}))

import BankAccountsContent from '../content'

const graph = {
  graphId: 'kg_a',
  graphName: 'Cascade Group',
  schemaExtensions: ['roboledger'],
}

const entity = (over: Record<string, unknown>) => ({
  id: 'ent',
  name: 'Entity',
  legalName: null,
  ticker: null,
  cik: null,
  industry: null,
  entityType: null,
  status: 'active',
  isParent: false,
  parentEntityId: null,
  ownershipPct: null,
  source: 'native',
  sourceGraphId: null,
  connectionId: null,
  createdAt: null,
  updatedAt: null,
  ...over,
})
const parent = entity({ id: 'ent_p', name: 'Cascade', isParent: true })
const sub = entity({ id: 'ent_s', name: 'Cadence', parentEntityId: 'ent_p' })

const row = (over: Record<string, unknown>) => ({
  id: 'elem',
  code: null,
  name: 'Account',
  kind: 'bank',
  balanceType: 'debit',
  isActive: true,
  entityId: 'ent_p',
  entityName: 'Cascade',
  source: null,
  connectionId: null,
  institution: null,
  feedAccountId: null,
  feedAccountName: null,
  feedAccountKind: null,
  connectionStatus: null,
  lastSyncAt: null,
  lastSyncStatus: null,
  ...over,
})

const checking = row({
  id: 'elem_chk',
  code: '1010',
  name: 'Chase Checking ••1234',
  source: 'plaid',
  connectionId: 'conn_plaid',
  institution: 'Chase',
  feedAccountId: 'acc_1',
  feedAccountName: 'Chase Checking ••1234',
  connectionStatus: 'active',
  lastSyncAt: '2026-10-07T12:00:00+00:00',
})
const card = row({
  id: 'elem_card',
  code: '2100',
  name: 'Amex',
  kind: 'credit',
  balanceType: 'credit',
  entityId: 'ent_s',
  entityName: 'Cadence',
  source: 'quickbooks',
  connectionId: 'conn_qb',
  connectionStatus: 'needs_reauth',
})

function scope(entities = [parent, sub]) {
  mockScope.mockReturnValue({
    entitiesByGraph: new Map([['kg_a', entities]]),
    entities,
    entity: parent,
    parent,
    entityId: null,
    isLoading: false,
    isResolved: true,
    error: null,
    select: vi.fn(),
    refresh: vi.fn(),
  })
}

describe('BankAccountsContent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    moveProps = null
    mockUseGraphContext.mockReturnValue({
      state: { graphs: [graph], currentGraphId: 'kg_a', isLoading: false },
    })
    mockLedgerGraph.mockReturnValue({
      graph,
      ledgerGraphs: [graph],
      mismatch: false,
    })
    scope()
    mockListBankAccounts.mockResolvedValue({
      total: 2,
      accounts: [checking, card],
    })
  })

  it('lists every account of the group with its entity, source and status', async () => {
    render(<BankAccountsContent />)
    expect(await screen.findByText('Chase Checking ••1234')).toBeInTheDocument()
    expect(mockListBankAccounts).toHaveBeenCalledWith('kg_a')
    expect(screen.getByText('Cascade Group · 2 accounts')).toBeInTheDocument()
    expect(screen.getByText('Chase · Plaid')).toBeInTheDocument()
    expect(screen.getByText('QuickBooks')).toBeInTheDocument()
    expect(screen.getByText('Auto-synced')).toBeInTheDocument()
    // The entity column shows on a group; the needs_reauth card links to Connections.
    expect(screen.getByText('Cadence')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Reconnect' })).toHaveAttribute(
      'href',
      '/connections'
    )
  })

  it('offers Move only on an account a feed books to', async () => {
    render(<BankAccountsContent />)
    await screen.findByText('Chase Checking ••1234')
    expect(screen.getAllByRole('button', { name: /Move/ })).toHaveLength(1)
  })

  it('filters by type and by search', async () => {
    render(<BankAccountsContent />)
    await screen.findByText('Chase Checking ••1234')
    fireEvent.change(screen.getByLabelText('Type'), {
      target: { value: 'credit' },
    })
    expect(screen.queryByText('Chase Checking ••1234')).not.toBeInTheDocument()
    expect(screen.getByText('Amex')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Type'), {
      target: { value: 'all' },
    })
    fireEvent.change(screen.getByPlaceholderText('Search accounts…'), {
      target: { value: 'chase' },
    })
    expect(screen.getByText('Chase Checking ••1234')).toBeInTheDocument()
    expect(screen.queryByText('Amex')).not.toBeInTheDocument()
  })

  it('opens the move modal for the row and reloads after a move', async () => {
    render(<BankAccountsContent />)
    await screen.findByText('Chase Checking ••1234')
    fireEvent.click(screen.getByRole('button', { name: /Move/ }))
    expect(screen.getByTestId('move-modal')).toHaveTextContent(
      'Chase Checking ••1234'
    )
    expect(moveProps.graphId).toBe('kg_a')
    expect(moveProps.entities).toHaveLength(2)

    moveProps.onMoved({
      account_created: true,
      events_repointed: 3,
      events_unclassified: 1,
      pairs_across_entities: 0,
    })
    await waitFor(() => expect(mockListBankAccounts).toHaveBeenCalledTimes(2))
    expect(mockShowSuccess).toHaveBeenCalledWith(
      'Account created in the entity’s chart · 3 inbox lines moved · 1 returned to the inbox to classify'
    )
    expect(screen.queryByTestId('move-modal')).not.toBeInTheDocument()
  })

  it('shows an empty state that leads to Connections', async () => {
    mockListBankAccounts.mockResolvedValue({ total: 0, accounts: [] })
    render(<BankAccountsContent />)
    expect(await screen.findByText('No bank accounts yet')).toBeInTheDocument()
    fireEvent.click(screen.getAllByRole('button', { name: /Add account/ })[0])
    expect(mockPush).toHaveBeenCalledWith('/connections')
  })

  it('shows the error with a retry when the read fails', async () => {
    mockListBankAccounts.mockRejectedValueOnce(new Error('nope'))
    render(<BankAccountsContent />)
    expect(
      await screen.findByText('Bank accounts could not be loaded')
    ).toBeInTheDocument()
    mockListBankAccounts.mockResolvedValueOnce({
      total: 2,
      accounts: [checking, card],
    })
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(await screen.findByText('Chase Checking ••1234')).toBeInTheDocument()
  })

  it('prompts for a ledger graph when none is selected', () => {
    mockLedgerGraph.mockReturnValue({
      graph: null,
      ledgerGraphs: [],
      mismatch: false,
    })
    mockUseGraphContext.mockReturnValue({
      state: { graphs: [], currentGraphId: null, isLoading: false },
    })
    render(<BankAccountsContent />)
    expect(screen.getByText('No Ledger Found')).toBeInTheDocument()
    expect(mockListBankAccounts).not.toHaveBeenCalled()
  })
})
