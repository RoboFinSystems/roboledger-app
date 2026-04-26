import { render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/core', () => ({ customTheme: { table: {} } }))

vi.mock('flowbite-react', () => ({
  Badge: ({ children, color }: any) => (
    <span data-testid={`badge-${color}`}>{children}</span>
  ),
  Table: ({ children }: any) => <table>{children}</table>,
  TableBody: ({ children }: any) => <tbody>{children}</tbody>,
  TableCell: ({ children, className, style }: any) => (
    <td className={className} style={style}>
      {children}
    </td>
  ),
  TableHead: ({ children }: any) => <thead>{children}</thead>,
  TableHeadCell: ({ children, className }: any) => (
    <th className={className}>{children}</th>
  ),
  TableRow: ({ children, className }: any) => (
    <tr className={className}>{children}</tr>
  ),
}))

vi.mock('react-icons/hi', () => ({
  HiCheckCircle: () => <span data-testid="icon-check" />,
  HiExclamationCircle: () => <span data-testid="icon-warn" />,
}))

import StatementRenderingProjection from '../projections/StatementRendering'
import { makeEnvelope, makeRendering } from './_envelope-fixtures'

describe('StatementRenderingProjection', () => {
  it('renders the entity name + statement name + period header', () => {
    render(
      <StatementRenderingProjection
        envelope={makeEnvelope()}
        entityName="Acme LLC"
      />
    )
    expect(screen.getByText('Acme LLC')).toBeInTheDocument()
    expect(screen.getByText('Income Statement')).toBeInTheDocument()
    // Single-period header uses "For the Period Ended <end>".
    expect(screen.getByText(/For the Period Ended/)).toBeInTheDocument()
  })

  it('indents non-zero-depth rows by 24px per level + 16px base padding', () => {
    render(<StatementRenderingProjection envelope={makeEnvelope()} />)
    const cogs = screen.getByText('Cost of Goods Sold')
    expect(cogs).toHaveStyle({ paddingLeft: '40px' }) // depth=1 → 24+16
    const rev = screen.getByText('Revenue')
    expect(rev).toHaveStyle({ paddingLeft: '16px' }) // depth=0 → 0+16
  })

  it('marks subtotal rows as bold + adds the bg highlight class', () => {
    render(<StatementRenderingProjection envelope={makeEnvelope()} />)
    const gpRow = screen.getByText('Gross Profit').closest('tr')
    expect(gpRow?.className).toContain('bg-gray-50')
    expect(screen.getByText('Gross Profit').className).toContain(
      'font-semibold'
    )
  })

  it('shows the empty state when rendering.rows is empty', () => {
    const env = makeEnvelope({
      view: { rendering: makeRendering({ rows: [] }) },
    })
    render(<StatementRenderingProjection envelope={env} />)
    expect(screen.getByText(/No data available/)).toBeInTheDocument()
  })

  it('shows the "no rendering" empty state when view.rendering is null', () => {
    const env = makeEnvelope({ view: { rendering: null } })
    render(<StatementRenderingProjection envelope={env} />)
    expect(screen.getByText(/No rendering available/)).toBeInTheDocument()
  })

  it('renders a passing validation banner with no warnings', () => {
    const env = makeEnvelope({
      view: {
        rendering: makeRendering({
          validation: {
            passed: true,
            checks: ['accounting equation'],
            failures: [],
            warnings: [],
          },
        }),
      },
    })
    render(<StatementRenderingProjection envelope={env} />)
    const success = screen.getByTestId('badge-success')
    expect(within(success).getByText(/Validation Passed/)).toBeInTheDocument()
    expect(screen.queryByTestId('badge-warning')).toBeNull()
  })

  it('renders a failing validation banner with failure messages', () => {
    const env = makeEnvelope({
      view: {
        rendering: makeRendering({
          validation: {
            passed: false,
            checks: [],
            failures: ['Assets ≠ Liabilities + Equity'],
            warnings: [],
          },
        }),
      },
    })
    render(<StatementRenderingProjection envelope={env} />)
    expect(screen.getByTestId('badge-failure')).toBeInTheDocument()
    expect(
      screen.getByText('Assets ≠ Liabilities + Equity')
    ).toBeInTheDocument()
  })

  it('renders the warning badge when there are warnings', () => {
    const env = makeEnvelope({
      view: {
        rendering: makeRendering({
          validation: {
            passed: true,
            checks: [],
            failures: [],
            warnings: ['drift > 1%'],
          },
        }),
      },
    })
    render(<StatementRenderingProjection envelope={env} />)
    const warn = screen.getByTestId('badge-warning')
    expect(within(warn).getByText('1 warning')).toBeInTheDocument()
  })

  it('shows the unmapped count footnote when > 0', () => {
    const env = makeEnvelope({
      view: { rendering: makeRendering({ unmappedCount: 3 }) },
    })
    render(<StatementRenderingProjection envelope={env} />)
    expect(
      screen.getByText(/3 unmapped CoA elements not included in report/)
    ).toBeInTheDocument()
  })

  it('omits the unmapped count footnote when 0', () => {
    render(<StatementRenderingProjection envelope={makeEnvelope()} />)
    expect(screen.queryByText(/unmapped CoA element/)).toBeNull()
  })
})
