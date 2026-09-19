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

import BlockPicker, { blockLabels } from '../components/BlockPicker'

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

// Library-seeded structures are named for their taxonomy first.
const STATEMENTS = [
  {
    id: 'bs',
    blockType: 'balance_sheet',
    name: 'rs-gaap — Balance Sheet — Classified',
    displayName: 'Balance Sheet',
    taxonomyId: 'tax_rs_gaap',
    taxonomyName: 'rs-gaap',
  },
  {
    id: 'is',
    blockType: 'income_statement',
    name: 'rs-gaap — Income Statement — Multi-Step',
    displayName: 'Income Statement',
    taxonomyId: 'tax_rs_gaap',
    taxonomyName: 'rs-gaap',
  },
] as any

describe('blockLabels', () => {
  it('drops the taxonomy a structure is named for', () => {
    const labels = blockLabels(STATEMENTS)
    expect(labels.get('bs')).toBe('Balance Sheet — Classified')
    expect(labels.get('is')).toBe('Income Statement — Multi-Step')
  })

  it('recognises a taxonomy id by shape when the block does not name one', () => {
    const labels = blockLabels([
      { id: 'a', name: 'us-gaap — Cash Flow — Indirect', taxonomyName: null },
    ] as any)
    expect(labels.get('a')).toBe('Cash Flow — Indirect')
  })

  it('leaves a name whose lead segment is not a taxonomy', () => {
    const labels = blockLabels([
      { id: 'a', name: 'Buffer — 2026-07 Prepaid Amortization' },
      { id: 'b', name: 'Key Financial Metrics' },
    ] as any)
    expect(labels.get('a')).toBe('Buffer — 2026-07 Prepaid Amortization')
    expect(labels.get('b')).toBe('Key Financial Metrics')
  })

  it('keeps the prefix where dropping it would make two rows read the same', () => {
    const labels = blockLabels([
      ...STATEMENTS,
      {
        id: 'bs_us',
        blockType: 'balance_sheet',
        name: 'us-gaap — Balance Sheet — Classified',
        taxonomyName: 'us-gaap',
      },
    ] as any)
    expect(labels.get('bs')).toBe('rs-gaap — Balance Sheet — Classified')
    expect(labels.get('bs_us')).toBe('us-gaap — Balance Sheet — Classified')
    // Unaffected rows still shorten.
    expect(labels.get('is')).toBe('Income Statement — Multi-Step')
  })
})

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
    // Rows read without the taxonomy; the tooltip keeps the full name, which
    // is what picks the statement family out of the list here.
    const statements = screen
      .getAllByRole('button')
      .filter((b) => b.getAttribute('title')?.startsWith('rs-gaap'))
      .map((b) => b.textContent)
    expect(statements).toEqual([
      'Balance Sheet',
      'Income Statement',
      'Cash Flow Statement',
      'Statement of Changes',
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

  it('shows the short label, keeps the full name on the tooltip and in search', () => {
    render(
      <BlockPicker
        blocks={STATEMENTS}
        selectedId={null}
        onSelect={() => {}}
        isLoading={false}
      />
    )
    const row = screen.getByText('Balance Sheet — Classified').closest('button')
    expect(row).toHaveAttribute('title', 'rs-gaap — Balance Sheet — Classified')
    expect(screen.queryByText(/rs-gaap/)).not.toBeInTheDocument()

    // Typing the taxonomy still finds them, and the labels stay short.
    fireEvent.change(screen.getByPlaceholderText('Search blocks'), {
      target: { value: 'rs-gaap' },
    })
    expect(screen.getByText('Balance Sheet — Classified')).toBeInTheDocument()
    expect(
      screen.getByText('Income Statement — Multi-Step')
    ).toBeInTheDocument()
  })
})
