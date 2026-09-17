import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import DocsLink from '../DocsLink'

describe('DocsLink', () => {
  it('points at the given docs page in a new tab', () => {
    render(<DocsLink href="/docs/month-end-close" />)

    const link = screen.getByRole('link', { name: 'Read the guide →' })
    expect(link).toHaveAttribute('href', '/docs/month-end-close')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('reads the same wherever it lands', () => {
    const { rerender } = render(<DocsLink href="/docs/connect-your-books" />)
    expect(screen.getByRole('link')).toHaveTextContent('Read the guide →')

    rerender(<DocsLink href="/docs/reports-and-sharing" />)
    expect(screen.getByRole('link')).toHaveTextContent('Read the guide →')
  })
})
