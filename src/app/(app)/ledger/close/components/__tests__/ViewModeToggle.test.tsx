import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import ViewModeToggle from '../ViewModeToggle'

describe('ViewModeToggle', () => {
  it('lists all five view modes in the menu', async () => {
    const user = userEvent.setup()
    render(<ViewModeToggle viewMode="rendered" onChange={() => {}} />)

    // Open the dropdown (trigger is the first/only button).
    await user.click(screen.getAllByRole('button')[0])

    for (const label of [
      'Rendered',
      'Facts',
      'Elements',
      'Validation',
      'Rules',
    ]) {
      expect(
        screen.getAllByText(label).length,
        `expected menu item "${label}"`
      ).toBeGreaterThan(0)
    }
  })

  it('invokes onChange when a non-active mode is picked', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<ViewModeToggle viewMode="rendered" onChange={onChange} />)

    await user.click(screen.getAllByRole('button')[0])
    await user.click(screen.getByText('Facts'))

    expect(onChange).toHaveBeenCalledWith('facts')
  })
})
