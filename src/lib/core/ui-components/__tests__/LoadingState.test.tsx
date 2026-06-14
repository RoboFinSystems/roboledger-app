import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LoadingState } from '../LoadingState'

describe('LoadingState', () => {
  it('renders a spinner with the status role', () => {
    render(<LoadingState />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('renders the message when provided', () => {
    render(<LoadingState message="Loading data…" />)
    expect(screen.getByText('Loading data…')).toBeInTheDocument()
  })

  it('omits the message when not provided', () => {
    render(<LoadingState />)
    expect(screen.queryByText('Loading data…')).not.toBeInTheDocument()
  })

  it('announces the message as the accessible label', () => {
    render(<LoadingState message="Loading dashboard…" />)
    expect(screen.getByRole('status')).toHaveAttribute(
      'aria-label',
      'Loading dashboard…'
    )
  })

  it('merges a className override onto the container', () => {
    const { container } = render(<LoadingState className="h-64" />)
    expect(container.firstChild).toHaveClass('h-64')
  })
})
