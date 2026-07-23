import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@robosystems/core', () => ({
  LoadingState: () => <div role="status">Loading</div>,
}))

vi.mock('flowbite-react', () => ({
  TextInput: ({ value, onChange, placeholder }: any) => (
    <input value={value} onChange={onChange} placeholder={placeholder} />
  ),
}))

vi.mock('react-icons/hi', () => ({
  HiSearch: () => <span />,
}))

import BlockPicker from '../components/BlockPicker'

// `displayName` is the block-TYPE label ("Metric", "Schedule"); `name` is
// the instance identity. The picker must label rows by name or every
// schedule reads "Schedule" and every metric reads "Metric".
const BLOCKS = [
  {
    id: 'struct_metrics',
    blockType: 'metric',
    name: 'Key Financial Metrics',
    displayName: 'Metric',
  },
  {
    id: 'struct_dep',
    blockType: 'schedule',
    name: 'Packaging Line Depreciation',
    displayName: 'Schedule',
  },
] as any

describe('BlockPicker', () => {
  it('labels rows by instance name, not the block-type display name', () => {
    render(
      <BlockPicker
        blocks={BLOCKS}
        selectedId={null}
        onSelect={() => {}}
        isLoading={false}
      />
    )
    expect(screen.getByText('Key Financial Metrics')).toBeInTheDocument()
    expect(screen.getByText('Packaging Line Depreciation')).toBeInTheDocument()
    expect(screen.queryByText('Metric')).not.toBeInTheDocument()
    expect(screen.queryByText('Schedule')).not.toBeInTheDocument()
  })

  it('searches on the instance name', () => {
    render(
      <BlockPicker
        blocks={BLOCKS}
        selectedId={null}
        onSelect={() => {}}
        isLoading={false}
      />
    )
    fireEvent.change(screen.getByPlaceholderText('Search blocks'), {
      target: { value: 'packaging' },
    })
    expect(screen.getByText('Packaging Line Depreciation')).toBeInTheDocument()
    expect(screen.queryByText('Key Financial Metrics')).not.toBeInTheDocument()
  })
})

const _ordered = (id: string, blockType: string, name: string) =>
  ({ id, blockType, name, displayName: name }) as any

// Deliberately shuffled — the list API sorts alphabetically by
// block_type, which is exactly the order the picker must NOT mirror.
const ORDERING_BLOCKS = [
  _ordered('b_cfs', 'cash_flow_statement', 'rs-gaap — Cash Flow Statement'),
  _ordered('b_metric', 'metric', 'Key Financial Metrics'),
  _ordered('b_eq', 'equity_statement', 'rs-gaap — Statement of Changes'),
  _ordered('b_forecast', 'forecast', 'FY27 Operating Budget'),
  _ordered('b_sched', 'schedule', 'Business Insurance Amortization'),
  _ordered('b_bs', 'balance_sheet', 'rs-gaap — Balance Sheet'),
  _ordered('b_disc', 'regulatory_disclosure', 'Disaggregation of Revenue'),
  _ordered('b_is', 'income_statement', 'rs-gaap — Income Statement'),
] as any

describe('BlockPicker ordering', () => {
  it('renders groups in reading order: statements, disclosures, schedules, metrics, scenarios', () => {
    render(
      <BlockPicker
        blocks={ORDERING_BLOCKS}
        selectedId={null}
        onSelect={() => {}}
        isLoading={false}
      />
    )
    const labels = screen
      .getAllByText(
        /^(Statements|Disclosures|Schedules|Metrics|Scenarios|Other)$/
      )
      .map((el) => el.textContent)
    expect(labels).toEqual([
      'Statements',
      'Disclosures',
      'Schedules',
      'Metrics',
      'Scenarios',
    ])
  })

  it('orders the statement family canonically: BS, IS, CF, Equity', () => {
    render(
      <BlockPicker
        blocks={ORDERING_BLOCKS}
        selectedId={null}
        onSelect={() => {}}
        isLoading={false}
      />
    )
    const buttons = screen.getAllByRole('button').map((b) => b.textContent)
    const statements = buttons.filter((t) => t?.startsWith('rs-gaap'))
    expect(statements).toEqual([
      'rs-gaap — Balance Sheet',
      'rs-gaap — Income Statement',
      'rs-gaap — Cash Flow Statement',
      'rs-gaap — Statement of Changes',
    ])
  })

  it('groups forecast blocks under Scenarios (not Other), after Metrics', () => {
    render(
      <BlockPicker
        blocks={ORDERING_BLOCKS}
        selectedId={null}
        onSelect={() => {}}
        isLoading={false}
      />
    )
    expect(screen.getByText('Scenarios')).toBeInTheDocument()
    expect(screen.queryByText('Other')).not.toBeInTheDocument()
    // A named scenario is a first-class family member, sorted last in
    // the reading order — the workbook you consult after the analytics.
    const buttons = screen.getAllByRole('button').map((b) => b.textContent)
    expect(buttons[buttons.length - 1]).toBe('FY27 Operating Budget')
  })

  it('still lands genuinely unregistered block types in Other, last', () => {
    render(
      <BlockPicker
        blocks={
          [
            ...ORDERING_BLOCKS,
            _ordered('b_new', 'brand_new_type', 'Future Block'),
          ] as any
        }
        selectedId={null}
        onSelect={() => {}}
        isLoading={false}
      />
    )
    expect(screen.getByText('Other')).toBeInTheDocument()
    const buttons = screen.getAllByRole('button').map((b) => b.textContent)
    expect(buttons[buttons.length - 1]).toBe('Future Block')
  })
})
