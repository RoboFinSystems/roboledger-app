import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('flowbite-react', () => ({
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
  TextInput: ({ value, onChange, placeholder }: any) => (
    <input value={value} onChange={onChange} placeholder={placeholder} />
  ),
  ToggleSwitch: ({ checked, onChange, label }: any) => (
    <button data-testid="variance-toggle" onClick={() => onChange(!checked)}>
      {label}
    </button>
  ),
}))

vi.mock('react-icons/hi', () => ({
  HiSearch: () => <span data-testid="icon-search" />,
}))

import MetricRenderingProjection from '../projections/MetricRendering'
import { makeMetricEnvelope, makeRendering } from './_envelope-fixtures'

describe('MetricRenderingProjection', () => {
  it('formats monetary rows as dollars and pure rows as plain decimals', () => {
    render(<MetricRenderingProjection envelope={makeMetricEnvelope()} />)
    // Working Capital (isMonetary) → $ accounting format
    expect(screen.getByText('$88,047.19')).toBeInTheDocument()
    expect(screen.getByText('$238,543.34')).toBeInTheDocument()
    // Current Ratio (pure) → bare 2-decimal ratio, no $ prefix
    expect(screen.getByText('3.27')).toBeInTheDocument()
    expect(screen.getByText('5.59')).toBeInTheDocument()
  })

  it('renders one period column per standing set, oldest first', () => {
    render(<MetricRenderingProjection envelope={makeMetricEnvelope()} />)
    const headers = screen.getAllByRole('columnheader')
    const labels = headers.map((h) => h.textContent)
    expect(labels).toContain('Dec 31, 2025')
    expect(labels).toContain('Jun 30, 2026')
    expect(labels.indexOf('Dec 31, 2025')).toBeLessThan(
      labels.indexOf('Jun 30, 2026')
    )
  })

  it('renders the entity + block header with the period span', () => {
    render(
      <MetricRenderingProjection
        envelope={makeMetricEnvelope()}
        entityName="Driftline Coffee"
      />
    )
    expect(screen.getByText('Driftline Coffee')).toBeInTheDocument()
    expect(screen.getByText('Key Financial Metrics')).toBeInTheDocument()
    expect(screen.getByText(/2 periods/)).toBeInTheDocument()
  })

  it('adds Δ and Δ% columns from the last two periods when variance is toggled on', () => {
    render(<MetricRenderingProjection envelope={makeMetricEnvelope()} />)
    expect(screen.queryByText('Δ')).not.toBeInTheDocument()

    fireEvent.click(screen.getByTestId('variance-toggle'))

    expect(screen.getByText('Δ')).toBeInTheDocument()
    expect(screen.getByText('Δ%')).toBeInTheDocument()
    // Working Capital: 238,543.34 − 88,047.19 = 150,496.15, monetary format
    expect(screen.getByText('$150,496.15')).toBeInTheDocument()
    // Current Ratio Δ: 5.5905 − 3.2727 = 2.3178 → ratio format
    expect(screen.getByText('2.32')).toBeInTheDocument()
    // Current Ratio Δ%: 2.3178 / 3.2727 → +70.8%
    expect(screen.getByText('+70.8%')).toBeInTheDocument()
  })

  it('filters rows by name through the search input', () => {
    render(<MetricRenderingProjection envelope={makeMetricEnvelope()} />)
    fireEvent.change(screen.getByPlaceholderText('Filter metrics'), {
      target: { value: 'current' },
    })
    expect(screen.getByText('Current Ratio')).toBeInTheDocument()
    expect(screen.queryByText('Working Capital')).not.toBeInTheDocument()
  })

  it('renders the catalog skeleton with a compute hint when no periods are computed', () => {
    const env = makeMetricEnvelope({
      view: {
        rendering: makeRendering({
          rows: [
            {
              elementId: 'elem_cr',
              elementQname: 'rs-metric:CurrentRatio',
              elementName: 'Current Ratio',
              values: [],
              isSubtotal: false,
              depth: 0,
            },
          ] as any,
          periods: [],
        }),
      },
    })
    render(<MetricRenderingProjection envelope={env} />)
    expect(screen.getByText(/No computed periods yet/)).toBeInTheDocument()
    expect(screen.getByText('Current Ratio')).toBeInTheDocument()
  })

  it('shows the empty state when the block has no metric rows', () => {
    const env = makeMetricEnvelope({
      view: { rendering: makeRendering({ rows: [], periods: [] }) },
    })
    render(<MetricRenderingProjection envelope={env} />)
    expect(screen.getByText(/No metrics defined/)).toBeInTheDocument()
  })
})
