import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockLiveFinancialStatement = vi.fn()
const mockScope = vi.fn()

vi.mock('@robosystems/core', () => ({
  clients: {
    ledger: {
      liveFinancialStatement: (...args: any[]) =>
        mockLiveFinancialStatement(...args),
    },
  },
  PageLayout: ({ children }: any) => <div>{children}</div>,
  PageHeader: ({ title }: any) => <h1>{title}</h1>,
  LoadingState: () => <div data-testid="loading-state" />,
  EmptyState: ({ title }: any) => <div data-testid="empty-state">{title}</div>,
}))

vi.mock('@/lib/useLedgerGraph', () => ({
  useLedgerGraph: () => ({
    graph: { graphId: 'kg_a', graphName: 'Harbinger Group' },
    ledgerGraphs: [],
    mismatch: false,
  }),
}))

vi.mock('@/lib/entity-scope', () => ({
  useEntityScope: () => mockScope(),
}))

vi.mock('../components/LiveStatementTable', () => ({
  default: () => <div data-testid="statement-table" />,
}))

vi.mock('@/components/RefreshControl', () => ({
  default: () => <button>Refresh</button>,
}))

vi.mock('@/components/ValidationBanner', () => ({
  default: () => null,
}))

vi.mock('flowbite-react', () => ({
  Alert: ({ children }: any) => <div role="alert">{children}</div>,
  Card: ({ children }: any) => <div>{children}</div>,
  Label: ({ children, htmlFor }: any) => (
    <label htmlFor={htmlFor}>{children}</label>
  ),
  Select: ({ children, ...props }: any) => (
    <select {...props}>{children}</select>
  ),
  TextInput: (props: any) => <input {...props} />,
}))

vi.mock('react-icons/hi', () => ({
  HiExclamationCircle: () => <span />,
  HiSearch: () => <span />,
}))

vi.mock('react-icons/tb', () => ({
  TbReportMoney: () => <span />,
}))

import LiveStatementsContent from '../content'

const entity = (over: Record<string, unknown>) => ({
  id: 'ent',
  name: 'Entity',
  isParent: false,
  parentEntityId: null,
  ...over,
})
const parent = entity({ id: 'ent_p', name: 'Harbinger', isParent: true })
const sub = entity({
  id: 'ent_s',
  name: 'Maple Court',
  parentEntityId: 'ent_p',
})

const statement = (over: Record<string, unknown> = {}) => ({
  periods: [{ start: '2026-01-01', end: '2026-08-31' }],
  facts: [{ qname: 'rs-gaap:Cash', values: {} }],
  fact_count: 1,
  unmapped_count: 0,
  truncated: false,
  ...over,
})

function scope(over: Record<string, unknown> = {}) {
  mockScope.mockReturnValue({
    entities: [parent],
    entity: parent,
    parent,
    entityId: null,
    ...over,
  })
}

const lastBody = () =>
  mockLiveFinancialStatement.mock.calls[
    mockLiveFinancialStatement.mock.calls.length - 1
  ][1]

describe('LiveStatementsContent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLiveFinancialStatement.mockResolvedValue(statement())
  })

  it('renders the group parent of a single-entity graph with no scope control', async () => {
    scope()
    render(<LiveStatementsContent />)
    await waitFor(() => expect(mockLiveFinancialStatement).toHaveBeenCalled())
    expect(mockLiveFinancialStatement).toHaveBeenCalledWith(
      'kg_a',
      expect.objectContaining({ entity_id: null, consolidated: false })
    )
    expect(
      screen.queryByRole('group', { name: 'Scope' })
    ).not.toBeInTheDocument()
  })

  it('renders the subsidiary in scope, with no scope control', async () => {
    scope({ entities: [parent, sub], entity: sub, entityId: 'ent_s' })
    render(<LiveStatementsContent />)
    await waitFor(() => expect(mockLiveFinancialStatement).toHaveBeenCalled())
    expect(lastBody()).toEqual(
      expect.objectContaining({ entity_id: 'ent_s', consolidated: false })
    )
    expect(
      screen.queryByRole('group', { name: 'Scope' })
    ).not.toBeInTheDocument()
  })

  it('offers the combined statement on the parent of a group, and names what it combined', async () => {
    scope({ entities: [parent, sub] })
    mockLiveFinancialStatement.mockImplementation(
      (_graphId: string, body: { consolidated?: boolean }) =>
        Promise.resolve(
          statement(
            body.consolidated ? { combined_entity_ids: ['ent_p', 'ent_s'] } : {}
          )
        )
    )
    render(<LiveStatementsContent />)
    await waitFor(() => expect(mockLiveFinancialStatement).toHaveBeenCalled())
    expect(lastBody()).toEqual(expect.objectContaining({ consolidated: false }))
    expect(screen.queryByText(/combined across/)).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Combined' }))

    await waitFor(() =>
      expect(lastBody()).toEqual(
        expect.objectContaining({ entity_id: null, consolidated: true })
      )
    )
    expect(
      await screen.findByText(/combined across 2 entities, nothing eliminated/)
    ).toBeInTheDocument()
  })
})
