import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

// Mock all three projections so the dispatcher test only verifies routing.
vi.mock('../projections/FactTable', () => ({
  default: ({ envelope }: any) => (
    <div data-testid="fact-table">{envelope.id}</div>
  ),
}))
vi.mock('../projections/StatementRendering', () => ({
  default: ({ envelope, entityName }: any) => (
    <div data-testid="statement-rendering">
      {envelope.id} {entityName ?? ''}
    </div>
  ),
}))
vi.mock('../projections/ScheduleRendering', () => ({
  default: ({ envelope, onCreateEntry }: any) => (
    <div data-testid="schedule-rendering">
      {envelope.id} {onCreateEntry ? 'with-callback' : 'no-callback'}
    </div>
  ),
}))

import BlockView from '../BlockView'
import { makeEnvelope } from './_envelope-fixtures'

describe('BlockView dispatcher', () => {
  it('renders FactTable when viewMode is "facts" regardless of block_type', () => {
    render(
      <BlockView
        envelope={makeEnvelope({ id: 'struct_bs', blockType: 'balance_sheet' })}
        viewMode="facts"
      />
    )
    expect(screen.getByTestId('fact-table')).toHaveTextContent('struct_bs')
    expect(screen.queryByTestId('statement-rendering')).toBeNull()
  })

  it('routes statement block_types to StatementRendering in rendered mode', () => {
    for (const blockType of [
      'balance_sheet',
      'income_statement',
      'cash_flow_statement',
      'equity_statement',
    ] as const) {
      const { unmount } = render(
        <BlockView
          envelope={makeEnvelope({ id: `s_${blockType}`, blockType })}
          viewMode="rendered"
          entityName="Acme LLC"
        />
      )
      expect(screen.getByTestId('statement-rendering')).toHaveTextContent(
        `s_${blockType} Acme LLC`
      )
      unmount()
    }
  })

  it('routes schedule block_type to ScheduleRendering in rendered mode', () => {
    const onCreateEntry = vi.fn(async () => {})
    render(
      <BlockView
        envelope={makeEnvelope({ id: 'struct_dep', blockType: 'schedule' })}
        viewMode="rendered"
        onCreateEntry={onCreateEntry}
      />
    )
    expect(screen.getByTestId('schedule-rendering')).toHaveTextContent(
      'struct_dep with-callback'
    )
  })

  it('renders the schedule projection without a callback when none supplied', () => {
    render(
      <BlockView
        envelope={makeEnvelope({ id: 'struct_dep', blockType: 'schedule' })}
        viewMode="rendered"
      />
    )
    expect(screen.getByTestId('schedule-rendering')).toHaveTextContent(
      'struct_dep no-callback'
    )
  })

  it('shows an empty state for unsupported (block_type, viewMode) pairs', () => {
    render(
      <BlockView
        envelope={makeEnvelope({
          id: 'struct_x',
          blockType: 'something_new',
        })}
        viewMode="rendered"
      />
    )
    expect(screen.queryByTestId('statement-rendering')).toBeNull()
    expect(screen.queryByTestId('schedule-rendering')).toBeNull()
    expect(screen.getByText(/No rendering available/)).toBeInTheDocument()
    expect(screen.getByText('something_new')).toBeInTheDocument()
  })
})
