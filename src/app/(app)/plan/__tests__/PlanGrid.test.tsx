import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import PlanGrid from '../components/PlanGrid'
import type { PlanModel } from '../planModel'

const MODEL: PlanModel = {
  columns: [
    { end: '2026-05-31', label: null, forecast: false },
    { end: '2026-06-30', label: 'Jun 2026 (forecast)', forecast: true },
  ],
  sections: [
    {
      title: 'Assumptions',
      rows: [
        {
          key: 'a:growth',
          label: 'RevenueGrowthRate',
          itemType: 'percent',
          isSubtotal: false,
          depth: 0,
          values: [null, 0.03],
        },
      ],
    },
    {
      title: 'Income Statement',
      rows: [
        {
          key: 'is:rev',
          label: 'Revenues',
          itemType: null,
          isSubtotal: true,
          depth: 0,
          values: [100000, 103000],
        },
      ],
    },
  ],
}

describe('PlanGrid', () => {
  it('stacks sections under one master column set', () => {
    render(<PlanGrid model={MODEL} />)
    expect(screen.getByTestId('plan-section-Assumptions')).toBeInTheDocument()
    expect(
      screen.getByTestId('plan-section-Income Statement')
    ).toBeInTheDocument()
    // Both month headers present once — the sections share the columns.
    expect(screen.getByText('May 26')).toBeInTheDocument()
    expect(screen.getByText(/Jun 2026/)).toBeInTheDocument()
  })

  it('marks forecast columns and formats by item-type family', () => {
    render(<PlanGrid model={MODEL} />)
    const forecastHeader = screen.getByText(/Jun 2026/).closest('th')
    expect(forecastHeader).toHaveAttribute('title', 'Forecast')
    const actualHeader = screen.getByText('May 26').closest('th')
    expect(actualHeader).toHaveAttribute('title', 'Actual')
    // percent lever formats as a percent; monetary statement as money;
    // uncovered cells render an em dash.
    expect(screen.getByText('3%')).toBeInTheDocument()
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('carries the seam tint in BOTH themes (the dark tint must not vanish)', () => {
    render(<PlanGrid model={MODEL} />)
    const forecastHeader = screen.getByText(/Jun 2026/).closest('th')
    // The tint IS the seam story — pin both mode classes so a refactor
    // can't silently drop the dark side back to invisible (the shipped
    // /10 opacity disappeared against gray-900).
    expect(forecastHeader?.className).toContain('bg-primary-50/60')
    expect(forecastHeader?.className).toContain('dark:bg-primary-900/25')
    expect(forecastHeader?.className).toContain('border-l-2')
  })
})
