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
