import { fireEvent, render, screen, within } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import SegmentedControl, { type SegmentedOption } from '../SegmentedControl'

type View = 'coa' | 'usgaap'

const VIEWS: readonly SegmentedOption<View>[] = [
  { value: 'coa', label: 'Chart of Accounts' },
  { value: 'usgaap', label: 'US-GAAP' },
]

describe('SegmentedControl', () => {
  it('marks the current option pressed within a named group', () => {
    render(
      <SegmentedControl
        options={VIEWS}
        value="coa"
        onChange={() => {}}
        ariaLabel="View"
      />
    )
    const group = screen.getByRole('group', { name: 'View' })
    expect(
      within(group).getByRole('button', { name: 'Chart of Accounts' })
    ).toHaveAttribute('aria-pressed', 'true')
    expect(
      within(group).getByRole('button', { name: 'US-GAAP' })
    ).toHaveAttribute('aria-pressed', 'false')
  })

  it('reports the chosen value', () => {
    const onChange = vi.fn()
    render(
      <SegmentedControl
        options={VIEWS}
        value="coa"
        onChange={onChange}
        ariaLabel="View"
      />
    )
    fireEvent.click(screen.getByRole('button', { name: 'US-GAAP' }))
    expect(onChange).toHaveBeenCalledWith('usgaap')
  })

  it('takes a state setter directly', () => {
    // Compiles only because `onChange` is `NoInfer<T>`: inferring T from a
    // setter's `SetStateAction<T>` union widens it to `string`.
    const Harness = () => {
      const [view, setView] = useState<View>('coa')
      return (
        <SegmentedControl
          options={VIEWS}
          value={view}
          onChange={setView}
          ariaLabel="View"
        />
      )
    }
    render(<Harness />)
    fireEvent.click(screen.getByRole('button', { name: 'US-GAAP' }))
    expect(screen.getByRole('button', { name: 'US-GAAP' })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
  })

  it('renders rich labels and sizes for its setting', () => {
    const { rerender } = render(
      <SegmentedControl
        options={[
          {
            value: 'asset',
            label: (
              <>
                Asset <span>42</span>
              </>
            ),
          },
        ]}
        value="asset"
        onChange={() => {}}
        ariaLabel="Classification"
      />
    )
    const button = screen.getByRole('button', { name: 'Asset 42' })
    expect(button.className).toContain('py-2') // `field`: as tall as an sm input

    rerender(
      <SegmentedControl
        options={[{ value: 'asset', label: 'Asset' }]}
        value="asset"
        onChange={() => {}}
        ariaLabel="Classification"
        size="compact"
      />
    )
    expect(screen.getByRole('button', { name: 'Asset' }).className).toContain(
      'py-1'
    )
  })
})
