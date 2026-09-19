import type { LiveFinancialStatementResponse } from '@robosystems/client/types'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import LiveStatementTable from '../components/LiveStatementTable'

// Wire shape: [Current, Prior], rows post-order (children, then subtotal).
const BALANCE_SHEET: LiveFinancialStatementResponse = {
  graph_id: 'kg1',
  statement_type: 'balance_sheet',
  periods: [
    { start: '2026-01-01', end: '2026-09-18', label: 'Current' },
    { start: '2025-01-01', end: '2025-09-18', label: 'Prior' },
  ],
  facts: [
    {
      qname: 'us-gaap:Cash',
      name: 'Cash',
      values: [19112.3, 2043.95],
      depth: 1,
    },
    {
      qname: 'us-gaap:ShortTermInvestments',
      name: 'Short-Term Investments',
      values: [26000, 0],
      depth: 1,
    },
    {
      qname: 'us-gaap:AssetsCurrent',
      name: 'Assets, Current',
      values: [45112.3, 2043.95],
      depth: 0,
      is_subtotal: true,
    },
  ],
  fact_count: 3,
}

const CASH_FLOW: LiveFinancialStatementResponse = {
  ...BALANCE_SHEET,
  statement_type: 'cash_flow_statement',
  periods: [BALANCE_SHEET.periods[0]],
  facts: BALANCE_SHEET.facts.map((f) => ({ ...f, values: [f.values[0]] })),
}

const headerTexts = () =>
  within(screen.getByTestId('live-statement-table'))
    .getAllByRole('columnheader')
    .map((th) => th.textContent)

describe('LiveStatementTable', () => {
  it('puts prior on the left, current on the right, each with its dates', () => {
    render(<LiveStatementTable statement={BALANCE_SHEET} />)
    expect(headerTexts()).toEqual([
      'Concept',
      'PriorAs of Sep 18, 2025',
      'CurrentAs of Sep 18, 2026',
    ])
    const cash = screen.getByText('Cash').closest('tr') as HTMLElement
    expect(
      within(cash)
        .getAllByRole('cell')
        .map((td) => td.textContent)
    ).toEqual(['Cash', '$2,043.95', '$19,112.30'])
  })

  it('dates a flow statement by its window', () => {
    render(
      <LiveStatementTable
        statement={{ ...BALANCE_SHEET, statement_type: 'income_statement' }}
      />
    )
    expect(headerTexts()[2]).toBe('CurrentJan 1 – Sep 18, 2026')
  })

  it('folds a section onto its subtotal and back', () => {
    render(<LiveStatementTable statement={BALANCE_SHEET} />)
    const section = screen.getByRole('button', { name: /Assets, Current/ })
    expect(section).toHaveAttribute('aria-expanded', 'true')

    fireEvent.click(section)
    expect(screen.queryByText('Cash')).not.toBeInTheDocument()
    expect(screen.queryByText('Short-Term Investments')).not.toBeInTheDocument()
    expect(section).toHaveAttribute('aria-expanded', 'false')
    expect(section).toHaveTextContent('2 lines')
    // The subtotal still carries the section's value while folded.
    expect(screen.getByText('$45,112.30')).toBeInTheDocument()

    fireEvent.click(section)
    expect(screen.getByText('Cash')).toBeInTheDocument()
  })

  it('collapses and expands every section at once', () => {
    render(<LiveStatementTable statement={BALANCE_SHEET} />)
    const expandAll = screen.getByRole('button', { name: 'Expand all' })
    const collapseAll = screen.getByRole('button', { name: 'Collapse all' })
    expect(expandAll).toBeDisabled()

    fireEvent.click(collapseAll)
    expect(screen.queryByText('Cash')).not.toBeInTheDocument()
    expect(collapseAll).toBeDisabled()

    fireEvent.click(expandAll)
    expect(screen.getByText('Cash')).toBeInTheDocument()
  })

  it('adds change columns on demand, with no percent off a zero base', () => {
    render(<LiveStatementTable statement={BALANCE_SHEET} />)
    expect(headerTexts()).toHaveLength(3)

    fireEvent.click(screen.getByRole('switch'))
    expect(headerTexts().slice(3)).toEqual(['Change', '%'])

    const cash = screen.getByText('Cash').closest('tr') as HTMLElement
    expect(
      within(cash)
        .getAllByRole('cell')
        .slice(3)
        .map((td) => td.textContent)
    ).toEqual(['+$17,068.35', '+835.1%'])

    const investments = screen
      .getByText('Short-Term Investments')
      .closest('tr') as HTMLElement
    expect(
      within(investments)
        .getAllByRole('cell')
        .slice(3)
        .map((td) => td.textContent)
    ).toEqual(['+$26,000.00', '—'])
  })

  it('offers no change toggle when only one column renders', () => {
    render(<LiveStatementTable statement={CASH_FLOW} />)
    expect(screen.queryByRole('switch')).not.toBeInTheDocument()
    expect(headerTexts()).toEqual(['Concept', 'CurrentJan 1 – Sep 18, 2026'])
  })
})
