import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import ChartRenderingProjection from '../projections/ChartRendering'
import { makeEnvelope, makeMetricEnvelope } from './_envelope-fixtures'

describe('ChartRenderingProjection', () => {
  it('renders one SVG panel per format family with legend labels', () => {
    const { container } = render(
      <ChartRenderingProjection
        envelope={makeMetricEnvelope()}
        entityName="Driftline Coffee"
      />
    )
    // The two family panels (Monetary + Ratios) each render an SVG.
    const svgs = container.querySelectorAll('svg[role="img"]')
    expect(svgs.length).toBe(2)
    // Panel titles (the format families) + the entity header.
    expect(screen.getByText('Driftline Coffee')).toBeInTheDocument()
    expect(screen.getByText('Monetary')).toBeInTheDocument()
    expect(screen.getByText('Ratios')).toBeInTheDocument()
    // The joined series' latest value rides the line end, formatted by
    // family — monetary as money, the ratio as a bare 2-decimal.
    expect(screen.getByText('$238,543.34')).toBeInTheDocument()
    expect(screen.getByText('5.59')).toBeInTheDocument()
  })

  it('shows an empty state for a block with no chart arm', () => {
    render(<ChartRenderingProjection envelope={makeEnvelope()} />)
    expect(screen.getByText(/No chart available/)).toBeInTheDocument()
  })
})
