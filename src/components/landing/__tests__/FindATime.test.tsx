import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('../ContactModal', () => ({
  default: ({ isOpen, title }: { isOpen: boolean; title?: string }) =>
    isOpen ? <div role="dialog">{title}</div> : null,
}))

import FindATime from '../FindATime'

describe('FindATime', () => {
  it('offers email beside the booking button and opens the contact form', () => {
    render(<FindATime />)

    expect(
      screen.getByText(/Thursday or Friday afternoon not good\?/)
    ).toBeTruthy()
    expect(screen.queryByRole('dialog')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Email us' }))

    expect(screen.getByRole('dialog').textContent).toBe('Find a time')
  })
})
