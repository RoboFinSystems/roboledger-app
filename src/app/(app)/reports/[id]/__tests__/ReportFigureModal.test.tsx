import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockListAccounts = vi.fn()
vi.mock('@robosystems/core', () => ({
  clients: {
    ledger: { listAccounts: (...args: any[]) => mockListAccounts(...args) },
  },
}))
vi.mock('@robosystems/core/ui', () => ({
  Modal: ({ children }: any) => <div role="dialog">{children}</div>,
  ModalHeader: ({ children }: any) => <h2>{children}</h2>,
  ModalBody: ({ children }: any) => <div>{children}</div>,
  Table: ({ children }: any) => <table>{children}</table>,
  TableBody: ({ children }: any) => <tbody>{children}</tbody>,
  TableCell: ({ children }: any) => <td>{children}</td>,
  TableRow: ({ children }: any) => <tr>{children}</tr>,
}))
vi.mock('next/link', () => ({
  default: ({ href, children }: any) => <a href={href}>{children}</a>,
}))

import ReportFigureModal from '../components/ReportFigureModal'

const row = {
  elementId: 'elem_rev',
  elementQname: 'rs-gaap:Revenues',
  elementName: 'Revenue',
  values: [1000],
  isSubtotal: false,
  depth: 0,
} as any
const period = { start: '2026-06-01', end: '2026-06-30', label: 'June' } as any
const elements = [
  { id: 'el_rev', qname: 'rs-gaap:Revenues', name: 'Revenue' },
  { id: 'el_cogs', qname: 'rs-gaap:CostOfRevenue', name: 'Cost of revenue' },
] as any
const entities = [
  { id: 'ent_1', name: 'Harbor Holdings' },
  { id: 'ent_adj', name: 'Consolidation Adjustments' },
]

function fact(overrides: Record<string, unknown> = {}) {
  return {
    id: 'fact_1',
    elementId: 'elem_rev',
    value: 1000,
    periodStart: '2026-06-01',
    periodEnd: '2026-06-30',
    periodType: 'duration',
    unit: 'USD',
    factScope: 'in_scope',
    factSetId: 'fs_1',
    provenance: null,
    frozenAt: null,
    ...overrides,
  } as any
}

describe('ReportFigureModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockListAccounts.mockResolvedValue({
      accounts: [{ id: 'acct_4000', code: '4000', name: 'Sales' }],
    })
  })

  it('opens a frozen pivot onto its accounts, each on its register for the column', async () => {
    render(
      <ReportFigureModal
        graphId="kg_a"
        row={row}
        period={period}
        fact={fact({
          frozenAt: '2026-07-02T09:00:00Z',
          provenance: {
            origin: 'pivot',
            mapping_id: 'map_1',
            period: '2026-06-01/2026-06-30',
            sources: [
              { entity_id: 'ent_1', account_id: 'acct_4000', value: 1000 },
            ],
            content_hash: 'sha256:abcdef0123456789',
            line_count: 1,
          },
        })}
        elements={elements}
        entities={entities}
        onClose={() => {}}
      />
    )
    expect(screen.getByTestId('figure-freeze')).toHaveTextContent(/^Frozen/)
    expect(screen.getByText('Summed from accounts')).toBeInTheDocument()
    const link = await screen.findByRole('link', { name: /4000 Sales/ })
    expect(link).toHaveAttribute(
      'href',
      '/ledger/account-register?accountId=acct_4000&entityId=ent_1&start=2026-06-01&end=2026-06-30'
    )
    expect(mockListAccounts).toHaveBeenCalledWith('kg_a', {
      entityId: 'ent_1',
      limit: 500,
    })
    expect(screen.getByTestId('figure-lines')).toHaveTextContent(
      '1 landed line behind it · sha256:abcdef012345'
    )
    // One entity: no entity line under the account.
    expect(screen.queryByText('Harbor Holdings')).toBeNull()
  })

  it('names whose account each is when the sources span entities', async () => {
    render(
      <ReportFigureModal
        graphId="kg_a"
        row={row}
        period={period}
        fact={fact({
          provenance: {
            origin: 'pivot',
            mapping_id: 'map_1',
            period: 'x',
            sources: [
              { entity_id: 'ent_1', account_id: 'acct_4000', value: 700 },
              { entity_id: 'ent_adj', account_id: 'acct_4000', value: 300 },
            ],
          },
        })}
        elements={elements}
        entities={entities}
        onClose={() => {}}
      />
    )
    expect(screen.getByTestId('figure-freeze')).toHaveTextContent(/^Live/)
    await waitFor(() =>
      expect(screen.getByText('Consolidation Adjustments')).toBeInTheDocument()
    )
    expect(screen.getByText('Harbor Holdings')).toBeInTheDocument()
    expect(screen.queryByTestId('figure-lines')).toBeNull()
  })

  it('opens a rollup onto the concepts it summed, by name and sign', () => {
    render(
      <ReportFigureModal
        graphId="kg_a"
        row={{ ...row, elementName: 'Gross profit' }}
        period={period}
        fact={fact({
          provenance: {
            origin: 'rollup',
            rule: 'calculation',
            children: [
              { qname: 'rs-gaap:Revenues', weight: 1 },
              { qname: 'rs-gaap:CostOfRevenue', weight: -1 },
            ],
          },
        })}
        elements={elements}
        entities={entities}
        onClose={() => {}}
      />
    )
    expect(
      screen.getByText('Subtotal of the lines beneath it')
    ).toBeInTheDocument()
    expect(
      screen.getByText('Revenue', { selector: 'li span' })
    ).toBeInTheDocument()
    expect(screen.getByText('Cost of revenue')).toBeInTheDocument()
    expect(screen.getByText('−')).toBeInTheDocument()
    expect(mockListAccounts).not.toHaveBeenCalled()
  })

  it('opens a derivation onto its parts', () => {
    render(
      <ReportFigureModal
        graphId="kg_a"
        row={{ ...row, elementName: 'Retained earnings' }}
        period={period}
        fact={fact({
          value: 1250,
          periodType: 'instant',
          provenance: {
            origin: 'derived',
            computation: 'pivot+close_to_retained_earnings',
            amounts: { pivot: 1000, close_to_retained_earnings: 250 },
            source_concepts: [
              'rs-gaap:Revenues',
              'rs-gaap:ReceivablesNetCurrent',
            ],
            sources: [
              { entity_id: 'ent_1', account_id: 'acct_4000', value: 1000 },
            ],
          },
        })}
        elements={elements}
        entities={entities}
        onClose={() => {}}
      />
    )
    expect(screen.getByText(/As of/)).toBeInTheDocument()
    expect(screen.getByTestId('figure-computation')).toHaveTextContent(
      'pivot + close to retained earnings'
    )
    expect(screen.getByText('close to retained earnings')).toBeInTheDocument()
    expect(
      screen.getByText('Reads Revenue, Receivables Net Current')
    ).toBeInTheDocument()
  })

  it('says so when a figure has no record of how it was made', () => {
    render(
      <ReportFigureModal
        graphId="kg_a"
        row={row}
        period={period}
        fact={fact()}
        elements={elements}
        entities={entities}
        onClose={() => {}}
      />
    )
    expect(
      screen.getByText('No record of how this figure was made.')
    ).toBeInTheDocument()
  })
})
