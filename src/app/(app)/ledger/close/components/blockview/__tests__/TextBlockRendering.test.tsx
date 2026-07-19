import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import TextBlockRenderingProjection from '../projections/TextBlockRendering'
import { makeRendering, makeTextBlockEnvelope } from './_envelope-fixtures'

describe('TextBlockRenderingProjection', () => {
  it('renders the bound narrative as markdown prose', () => {
    render(
      <TextBlockRenderingProjection
        envelope={makeTextBlockEnvelope()}
        entityName="Driftline Coffee LLC"
      />
    )
    // react-markdown is mocked to echo its source, so the raw markdown
    // string is the observable content.
    expect(screen.getByTestId('react-markdown')).toHaveTextContent(
      'Revenue is recognized when control transfers.'
    )
    expect(screen.getByText('Driftline Coffee LLC')).toBeInTheDocument()
    expect(
      screen.getByText('Significant Accounting Policies')
    ).toBeInTheDocument()
  })

  it('omits the per-section heading for a single-narrative note', () => {
    render(<TextBlockRenderingProjection envelope={makeTextBlockEnvelope()} />)
    expect(screen.queryByRole('heading', { level: 3 })).toBeNull()
  })

  it('adds per-section headings when the note holds multiple narratives', () => {
    const envelope = makeTextBlockEnvelope({
      view: {
        rendering: makeRendering({
          rows: [
            {
              elementId: 'elem_rev_policy',
              elementName: 'Revenue Recognition',
              textValue: 'Revenue is recognized when control transfers.',
            },
            {
              elementId: 'elem_inv_policy',
              elementName: 'Inventory',
              textValue: 'Inventory is stated at the lower of cost or NRV.',
            },
          ] as ReturnType<typeof makeRendering>['rows'],
        }),
      },
    })
    render(<TextBlockRenderingProjection envelope={envelope} />)
    const headings = screen.getAllByRole('heading', { level: 3 })
    expect(headings.map((h) => h.textContent)).toEqual([
      'Revenue Recognition',
      'Inventory',
    ])
  })

  it('shows an empty state when no narrative is bound', () => {
    const envelope = makeTextBlockEnvelope({
      view: { rendering: makeRendering({ rows: [] }) },
    })
    render(<TextBlockRenderingProjection envelope={envelope} />)
    expect(
      screen.getByText(/No narrative bound to this note yet/)
    ).toBeInTheDocument()
  })
})
