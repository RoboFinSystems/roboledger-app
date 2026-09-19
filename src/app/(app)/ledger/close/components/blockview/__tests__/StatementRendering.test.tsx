import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@robosystems/core', () => ({ customTheme: { table: {} } }))

// The grid is a raw table — only the banner's Badge comes from flowbite.
vi.mock('flowbite-react', () => ({
  Badge: ({ children, color }: any) => (
    <span data-testid={`badge-${color}`}>{children}</span>
  ),
}))

vi.mock('react-icons/hi', () => ({
  HiCheckCircle: () => <span data-testid="icon-check" />,
  HiChevronDown: () => <span data-testid="icon-chevron-down" />,
  HiChevronRight: () => <span data-testid="icon-chevron-right" />,
  HiExclamationCircle: () => <span data-testid="icon-warn" />,
  HiMinusCircle: () => <span data-testid="icon-neutral" />,
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
    const cogs = screen.getByText('Cost of Goods Sold').closest('td')
    expect(cogs).toHaveStyle({ paddingLeft: '40px' }) // depth=1 → 24+16
    const rev = screen.getByText('Revenue').closest('td')
    expect(rev).toHaveStyle({ paddingLeft: '16px' }) // depth=0 → 0+16
  })

  it('marks subtotal rows as bold + adds the bg highlight class', () => {
    render(<StatementRenderingProjection envelope={makeEnvelope()} />)
    const gpRow = screen.getByText('Gross Profit').closest('tr')
    expect(gpRow?.className).toContain('bg-gray-50')
    expect(screen.getByText('Gross Profit').closest('td')?.className).toContain(
      'font-semibold'
    )
  })

  it('marks forecast columns with the seam tint + marker in a series read', () => {
    const env = makeEnvelope({
      view: {
        rendering: makeRendering({
          periods: [
            { start: '2026-04-01', end: '2026-04-30', label: null },
            { start: '2026-05-01', end: '2026-05-31', label: null },
            {
              start: '2026-06-01',
              end: '2026-06-30',
              label: 'Jun 2026 (forecast)',
              forecast: true,
            },
          ],
          rows: [
            {
              elementId: 'e_rev',
              elementName: 'Revenue',
              depth: 0,
              isSubtotal: false,
              values: [100, 110, 120],
            },
          ],
        }),
      },
    })
    render(<StatementRenderingProjection envelope={env} />)
    const forecastHeader = screen.getByText(/Jun 2026/).closest('th')
    expect(forecastHeader).toHaveAttribute(
      'title',
      'Forecast · Jun 1, 2026 — Jun 30, 2026'
    )
    // " (forecast)" is dropped from the label; the marker + tint carry it.
    expect(forecastHeader).toHaveTextContent(/^Jun 2026\s*f$/)
    // Tint in BOTH themes + the seam border on the first forecast column.
    expect(forecastHeader?.className).toContain('bg-primary-50/60')
    expect(forecastHeader?.className).toContain('dark:bg-primary-900/25')
    expect(forecastHeader?.className).toContain('border-l-2')
    // Actual columns carry neither. An unlabelled calendar month reads
    // "Apr 2026", with the full window on the tooltip.
    const actualHeader = screen.getByText('Apr 2026').closest('th')
    expect(actualHeader).toHaveAttribute(
      'title',
      'Actual · Apr 1, 2026 — Apr 30, 2026'
    )
    expect(actualHeader?.className).not.toContain('bg-primary-50/60')
  })

  it('offers the trailing-window control on long series and slices columns', () => {
    const periods = Array.from({ length: 6 }, (_, i) => ({
      start: `2026-0${i + 1}-01`,
      end: `2026-0${i + 1}-28`,
      label: `M${i + 1}`,
    }))
    const env = makeEnvelope({
      view: {
        rendering: makeRendering({
          periods,
          rows: [
            {
              elementId: 'e_rev',
              elementName: 'Revenue',
              depth: 0,
              isSubtotal: false,
              values: [1, 2, 3, 4, 5, 6],
            },
          ],
        }),
      },
    })
    render(<StatementRenderingProjection envelope={env} />)
    // All six columns by default...
    expect(screen.getByText('M1')).toBeInTheDocument()
    expect(screen.getByText('M6')).toBeInTheDocument()
    // ...then the 3M window keeps only the trailing three, values in
    // register (the off-screen-appended-columns fix: the recent slice —
    // and any seam — comes into view instead of hiding past the scroll).
    fireEvent.click(screen.getByText('3M'))
    expect(screen.queryByText('M1')).not.toBeInTheDocument()
    expect(screen.getByText('M4')).toBeInTheDocument()
    expect(screen.getByText('M6')).toBeInTheDocument()
  })

  it('hides the window control on short statements (default reads unchanged)', () => {
    render(<StatementRenderingProjection envelope={makeEnvelope()} />)
    expect(screen.queryByRole('group', { name: 'Period range' })).toBeNull()
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
            status: 'passed',
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
            status: 'failed',
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
            status: 'passed',
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

  it('renders a neutral badge, not a green one, when nothing was checked', () => {
    // A statement of equity has no validation rules yet: the backend returns
    // status=inconclusive with passed=false. That is "not validated", not
    // "failed" and never "passed".
    const env = makeEnvelope({
      view: {
        rendering: makeRendering({
          validation: {
            passed: false,
            status: 'inconclusive',
            checks: ['no_validation_rules'],
            failures: [],
            warnings: [
              "No validation rules exist for 'equity_statement' — nothing was checked.",
            ],
          },
        }),
      },
    })
    render(<StatementRenderingProjection envelope={env} />)
    const neutral = screen.getByTestId('badge-gray')
    expect(within(neutral).getByText(/Not validated/)).toBeInTheDocument()
    expect(screen.queryByTestId('badge-success')).toBeNull()
    expect(screen.queryByTestId('badge-failure')).toBeNull()
    expect(screen.getByText(/nothing was checked/)).toBeInTheDocument()
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

  it('keeps the title and controls outside the horizontal scroller', () => {
    // Inside it they scrolled off with the columns on a wide monthly series.
    render(
      <StatementRenderingProjection
        envelope={makeEnvelope()}
        entityName="Acme LLC"
      />
    )
    const scroller = screen.getByTestId('statement-grid').parentElement
    expect(scroller?.className).toContain('overflow-x-auto')
    expect(scroller).not.toContainElement(screen.getByText('Acme LLC'))
    expect(scroller).not.toContainElement(
      screen.getByRole('group', { name: 'Sections' })
    )
  })

  it('pins the label column with an opaque background on every row', () => {
    render(<StatementRenderingProjection envelope={makeEnvelope()} />)
    for (const name of ['Revenue', 'Gross Profit']) {
      const cell = screen.getByText(name).closest('td')
      expect(cell?.className).toContain('sticky')
      expect(cell?.className).toContain('left-0')
      // Translucent (`/50`) would let scrolled values show through.
      expect(cell?.className).toMatch(/dark:bg-gray-(800|900)(\s|$)/)
    }
  })

  it('names a non-month window in full, and a balance sheet as a point in time', () => {
    const quarter = makeEnvelope({
      view: {
        rendering: makeRendering({
          periods: [{ start: '2026-01-01', end: '2026-03-31', label: null }],
        }),
      },
    })
    const { unmount } = render(
      <StatementRenderingProjection envelope={quarter} />
    )
    expect(
      screen.getByText('Jan 1, 2026 — Mar 31, 2026').closest('th')
    ).toBeInTheDocument()
    unmount()

    const balanceSheet = makeEnvelope({
      blockType: 'balance_sheet',
      view: {
        rendering: makeRendering({
          periods: [{ start: '2026-03-01', end: '2026-03-31', label: null }],
        }),
      },
    })
    render(<StatementRenderingProjection envelope={balanceSheet} />)
    expect(screen.getByText('Mar 2026').closest('th')).toHaveAttribute(
      'title',
      'Actual · As of Mar 31, 2026'
    )
  })

  it('folds a section onto its subtotal from anywhere in the label cell', () => {
    render(<StatementRenderingProjection envelope={makeEnvelope()} />)
    // Post-order: Gross Profit (depth 0) owns Cost of Goods Sold (depth 1)
    // directly above it, but not Revenue (depth 0).
    const section = screen.getByRole('button', { name: /Gross Profit/ })
    expect(section).toHaveAttribute('aria-expanded', 'true')

    fireEvent.click(section.closest('td') as HTMLElement)
    expect(screen.queryByText('Cost of Goods Sold')).not.toBeInTheDocument()
    expect(screen.getByText('Revenue')).toBeInTheDocument()
    expect(section).toHaveTextContent('1 line')

    fireEvent.click(screen.getByRole('button', { name: 'Expand all' }))
    expect(screen.getByText('Cost of Goods Sold')).toBeInTheDocument()
  })

  it('keeps a section folded when the column window changes', () => {
    const base = makeRendering()
    const env = makeEnvelope({
      view: {
        rendering: makeRendering({
          periods: Array.from({ length: 6 }, (_, i) => ({
            start: `2026-0${i + 1}-01`,
            end: `2026-0${i + 1}-28`,
            label: `M${i + 1}`,
          })),
          rows: base.rows.map((row) => ({
            ...row,
            values: [1, 2, 3, 4, 5, 6],
          })),
        }),
      },
    })
    render(<StatementRenderingProjection envelope={env} />)
    fireEvent.click(screen.getByRole('button', { name: 'Collapse all' }))
    expect(screen.queryByText('Cost of Goods Sold')).not.toBeInTheDocument()

    fireEvent.click(screen.getByText('3M'))
    expect(screen.queryByText('M1')).not.toBeInTheDocument()
    expect(screen.queryByText('Cost of Goods Sold')).not.toBeInTheDocument()
  })

  it('titles the statement without the taxonomy it was seeded from', () => {
    render(
      <StatementRenderingProjection
        envelope={makeEnvelope({
          name: 'rs-gaap — Income Statement — Multi-Step',
          taxonomyName: 'rs-gaap',
        } as any)}
      />
    )
    expect(
      screen.getByText('Income Statement — Multi-Step')
    ).toBeInTheDocument()
    expect(screen.queryByText(/rs-gaap/)).not.toBeInTheDocument()
  })

  it('opens a long series on the trailing twelve, and re-defaults per block', () => {
    const series = (count: number) =>
      makeEnvelope({
        view: {
          rendering: makeRendering({
            periods: Array.from({ length: count }, (_, i) => ({
              start: null,
              end: '2026-01-31',
              label: `M${i + 1}`,
            })),
            rows: [
              {
                elementId: 'e_rev',
                elementQname: 'us-gaap:Revenues',
                elementName: 'Revenue',
                depth: 0,
                isSubtotal: false,
                values: Array.from({ length: count }, (_, i) => i),
              },
            ],
          }),
        },
      } as any)

    const { rerender } = render(
      <StatementRenderingProjection envelope={series(15)} />
    )
    expect(screen.queryByText('M3')).not.toBeInTheDocument()
    expect(screen.getByText('M4')).toBeInTheDocument()
    expect(screen.getByText('M15')).toBeInTheDocument()

    // The same mounted projection, handed a short block: the default follows
    // the block rather than staying frozen at the first one's.
    rerender(<StatementRenderingProjection envelope={series(6)} />)
    expect(screen.getByText('M1')).toBeInTheDocument()

    // Once the reader picks, the pick sticks across blocks.
    fireEvent.click(screen.getByText('3M'))
    rerender(<StatementRenderingProjection envelope={series(15)} />)
    expect(screen.queryByText('M12')).not.toBeInTheDocument()
    expect(screen.getByText('M13')).toBeInTheDocument()
  })
})
