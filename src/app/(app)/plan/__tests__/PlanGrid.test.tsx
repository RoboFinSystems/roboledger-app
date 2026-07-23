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
})
