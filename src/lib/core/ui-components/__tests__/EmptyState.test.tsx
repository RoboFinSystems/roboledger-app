import { render, screen } from '@testing-library/react'
import { HiInbox } from 'react-icons/hi'
import { describe, expect, it } from 'vitest'
import { EmptyState } from '../EmptyState'

describe('EmptyState', () => {
  it('renders the title as a heading', () => {
    render(<EmptyState icon={HiInbox} title="No items found" />)
    expect(
      screen.getByRole('heading', { name: 'No items found' })
    ).toBeInTheDocument()
  })

  it('renders the description when provided', () => {
    render(
      <EmptyState
        icon={HiInbox}
        title="X"
        description="Get started by adding one."
      />
    )
    expect(screen.getByText('Get started by adding one.')).toBeInTheDocument()
  })

  it('omits the description when not provided', () => {
    render(<EmptyState icon={HiInbox} title="X" />)
    expect(
      screen.queryByText('Get started by adding one.')
    ).not.toBeInTheDocument()
  })

  it('renders an action when provided', () => {
    render(
      <EmptyState
        icon={HiInbox}
        title="X"
        action={<button type="button">Create</button>}
      />
    )
    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument()
  })

  it('merges a className override onto the container', () => {
    const { container } = render(
      <EmptyState icon={HiInbox} title="X" className="py-4" />
    )
    expect(container.firstChild).toHaveClass('py-4')
  })
})
