import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockLiveFinancialStatement = vi.fn()
const mockConsolidationWorksheet = vi.fn()
const mockGetDimensions = vi.fn()
const mockScope = vi.fn()

vi.mock('@robosystems/core', () => ({
  clients: {
    ledger: {
      liveFinancialStatement: (...args: any[]) =>
        mockLiveFinancialStatement(...args),
      consolidationWorksheet: (...args: any[]) =>
        mockConsolidationWorksheet(...args),
      getDimensions: (...args: any[]) => mockGetDimensions(...args),
    },
  },
  PageLayout: ({ children }: any) => <div>{children}</div>,
  PageHeader: ({ title }: any) => <h1>{title}</h1>,
  LoadingState: () => <div data-testid="loading-state" />,
  EmptyState: ({ title, description }: any) => (
    <div data-testid="empty-state">
      {title}
      <p>{description}</p>
    </div>
  ),
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

vi.mock('../components/WorksheetTable', () => ({
  default: () => <div data-testid="worksheet-table" />,
}))

vi.mock('@/components/RefreshControl', () => ({
  default: () => <button>Refresh</button>,
}))

vi.mock('@/components/ValidationBanner', () => ({
  default: () => null,
}))

vi.mock('flowbite-react', () => ({
  Alert: ({ children }: any) => <div role="alert">{children}</div>,
  Button: ({ children, onClick, disabled }: any) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
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
  HiDownload: () => <span />,
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
    mockGetDimensions.mockResolvedValue({ types: [], dimensions: [] })
  })

  it('names a column left out because it reaches back before the books begin', async () => {
    scope()
    mockLiveFinancialStatement.mockResolvedValue(
      statement({
        omitted_periods: [
          { start: '2025-01-01', end: '2025-08-31', label: 'YTD 2025' },
        ],
      })
    )
    render(<LiveStatementsContent />)

    expect(
      await screen.findByText('Left out: YTD 2025, before the books begin.')
    ).toBeInTheDocument()
    expect(screen.getByTestId('statement-table')).toBeInTheDocument()
  })

  it("shows the server's reason, not an empty table, when every column is left out", async () => {
    scope()
    mockLiveFinancialStatement.mockResolvedValue(
      statement({
        periods: [],
        omitted_periods: [
          { start: '2025-01-01', end: '2025-12-31', label: '2025' },
        ],
        // An equity roll-forward row survives with no values.
        facts: [
          {
            qname: 'rs-gaap:MembersEquity',
            values: [],
            period_role: 'opening',
          },
        ],
        validation: {
          passed: false,
          status: 'inconclusive',
          checks: [],
          warnings: [
            'Every column reaches back before the books begin; record the window from the first month the books cover.',
          ],
        },
      })
    )
    render(<LiveStatementsContent />)

    expect(
      await screen.findByText(/record the window from the first month/)
    ).toBeInTheDocument()
    expect(
      screen.getByText('Left out: 2025, before the books begin.')
    ).toBeInTheDocument()
    expect(screen.queryByTestId('statement-table')).not.toBeInTheDocument()
    expect(screen.queryByText(/No ledger activity/)).not.toBeInTheDocument()
  })

  it('renders the group parent of a single-entity graph with no scope control', async () => {
    scope()
    render(<LiveStatementsContent />)
    await waitFor(() => expect(mockLiveFinancialStatement).toHaveBeenCalled())
    expect(mockLiveFinancialStatement).toHaveBeenCalledWith(
      'kg_a',
      expect.objectContaining({
        entity_id: null,
        scope: 'entity',
        include_sources: true,
      })
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
      expect.objectContaining({ entity_id: 'ent_s', scope: 'entity' })
    )
    expect(
      screen.queryByRole('group', { name: 'Scope' })
    ).not.toBeInTheDocument()
  })

  it('offers the combined statement on the parent of a group, and names what it combined', async () => {
    scope({ entities: [parent, sub] })
    mockLiveFinancialStatement.mockImplementation(
      (_graphId: string, body: { scope?: string }) =>
        Promise.resolve(
          statement(
            body.scope && body.scope !== 'entity'
              ? { combined_entity_ids: ['ent_p', 'ent_s'] }
              : {}
          )
        )
    )
    render(<LiveStatementsContent />)
    await waitFor(() => expect(mockLiveFinancialStatement).toHaveBeenCalled())
    expect(lastBody()).toEqual(expect.objectContaining({ scope: 'entity' }))
    expect(screen.queryByText(/combined across/)).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Combined' }))

    await waitFor(() =>
      expect(lastBody()).toEqual(
        expect.objectContaining({ entity_id: null, scope: 'combined' })
      )
    )
    expect(
      await screen.findByText(/combined across 2 entities, nothing eliminated/)
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Consolidated' }))

    await waitFor(() =>
      expect(lastBody()).toEqual(
        expect.objectContaining({ entity_id: null, scope: 'consolidated' })
      )
    )
    expect(
      await screen.findByText(
        /consolidated across 2 entities, the consolidation entity's adjustments in/
      )
    ).toBeInTheDocument()
  })

  it('lays the group out by entity on the worksheet, and says what sits beside the sum', async () => {
    scope({ entities: [parent, sub] })
    mockConsolidationWorksheet.mockResolvedValue({
      period: { start: '2026-01-01', end: '2026-08-31' },
      columns: [
        { key: 'consolidated', kind: 'consolidated', in_sum: true },
        { key: 'ent_k', kind: 'not_summed', in_sum: false },
      ],
      rows: [{ qname: 'rs-gaap:Cash', name: 'Cash', values: [1, 2] }],
      validation: null,
      unmapped_entity_ids: [],
      truncated: false,
    })
    render(<LiveStatementsContent />)
    await waitFor(() => expect(mockLiveFinancialStatement).toHaveBeenCalled())

    fireEvent.click(screen.getByRole('button', { name: 'Worksheet' }))

    await waitFor(() =>
      expect(mockConsolidationWorksheet).toHaveBeenCalledWith(
        'kg_a',
        expect.objectContaining({ statement_type: 'balance_sheet' })
      )
    )
    expect(await screen.findByTestId('worksheet-table')).toBeInTheDocument()
    expect(
      screen.getByText(/shown beside the sum, not in it/)
    ).toBeInTheDocument()
    expect(screen.queryByTestId('statement-table')).not.toBeInTheDocument()
  })

  it('reads the income statement by department, and says whether it ties out', async () => {
    scope()
    mockGetDimensions.mockResolvedValue({
      types: ['department'],
      dimensions: [],
    })
    mockLiveFinancialStatement.mockImplementation(
      (_graphId: string, body: { dimension?: { type: string } }) =>
        Promise.resolve(
          statement(
            body.dimension
              ? {
                  dimension: {
                    type: 'department',
                    member_id: null,
                    columns: [
                      { member_id: 'dim_s', name: 'Sales' },
                      { member_id: 'unallocated', name: 'Unallocated' },
                      { member_id: null, name: 'Total' },
                    ],
                    ties_out: true,
                    differences: [],
                  },
                }
              : {}
          )
        )
    )
    render(<LiveStatementsContent />)
    await waitFor(() => expect(mockLiveFinancialStatement).toHaveBeenCalled())
    expect(screen.queryByLabelText('Columns by')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Income Statement' }))
    fireEvent.change(await screen.findByLabelText('Columns by'), {
      target: { value: 'department' },
    })

    await waitFor(() =>
      expect(lastBody()).toEqual(
        expect.objectContaining({
          statement_type: 'income_statement',
          dimension: { type: 'department' },
        })
      )
    )
    // Columns are members, not periods: the figures do not open on accounts.
    expect(lastBody().include_sources).toBeUndefined()
    expect(
      await screen.findByText(
        /by department: every row's members plus Unallocated equal its Total/
      )
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Balance Sheet' }))

    await waitFor(() =>
      expect(lastBody()).toEqual(
        expect.objectContaining({ statement_type: 'balance_sheet' })
      )
    )
    expect(lastBody().dimension).toBeUndefined()
    expect(screen.queryByLabelText('Columns by')).not.toBeInTheDocument()
  })

  it('offers no columns-by picker on a graph with no dimensions', async () => {
    scope()
    render(<LiveStatementsContent />)
    fireEvent.click(screen.getByRole('button', { name: 'Income Statement' }))
    await waitFor(() =>
      expect(lastBody()).toEqual(
        expect.objectContaining({ statement_type: 'income_statement' })
      )
    )
    expect(screen.queryByLabelText('Columns by')).not.toBeInTheDocument()
  })
})
