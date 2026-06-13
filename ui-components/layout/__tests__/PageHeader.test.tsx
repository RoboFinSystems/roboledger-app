import { render, screen } from '@testing-library/react'
import { HiHome } from 'react-icons/hi'
import { describe, expect, it } from 'vitest'
import { PageHeader } from '../PageHeader'

describe('PageHeader', () => {
  it('renders the title as a heading', () => {
    render(<PageHeader icon={HiHome} title="Dashboard" />)
    expect(
      screen.getByRole('heading', { name: 'Dashboard' })
    ).toBeInTheDocument()
  })

  it('renders an optional subtitle', () => {
    render(<PageHeader icon={HiHome} title="X" subtitle="Manage things" />)
    expect(screen.getByText('Manage things')).toBeInTheDocument()
  })

  it('omits the subtitle when not provided', () => {
    render(<PageHeader icon={HiHome} title="X" />)
    expect(screen.queryByText('Manage things')).not.toBeInTheDocument()
  })

  it('renders right-aligned actions', () => {
    render(
      <PageHeader
        icon={HiHome}
        title="X"
        actions={<button type="button">New</button>}
      />
    )
    expect(screen.getByRole('button', { name: 'New' })).toBeInTheDocument()
  })

  it('merges extra className onto the outer wrapper', () => {
    const { container } = render(
      <PageHeader icon={HiHome} title="X" className="mb-6" />
    )
    expect(container.firstChild).toHaveClass('mb-6')
  })
})
