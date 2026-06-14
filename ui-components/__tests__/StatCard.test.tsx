import { render, screen } from '@testing-library/react'
import { HiDatabase } from 'react-icons/hi'
import { describe, expect, it } from 'vitest'
import { StatCard } from '../StatCard'

describe('StatCard', () => {
  it('renders the label and a string value', () => {
    render(<StatCard label="Total Graphs" value="1.2 GB" />)
    expect(screen.getByText('Total Graphs')).toBeInTheDocument()
    expect(screen.getByText('1.2 GB')).toBeInTheDocument()
  })

  it('renders a numeric value', () => {
    render(<StatCard label="Subgraphs" value={42} />)
    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('renders an icon when provided', () => {
    const { container } = render(
      <StatCard label="Total Graphs" value={3} icon={HiDatabase} />
    )
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('omits the icon when not provided', () => {
    const { container } = render(<StatCard label="Node Labels" value={7} />)
    expect(container.querySelector('svg')).not.toBeInTheDocument()
  })

  it('marks the icon as decorative (aria-hidden)', () => {
    const { container } = render(
      <StatCard label="Total Graphs" value={3} icon={HiDatabase} />
    )
    expect(container.querySelector('svg')).toHaveAttribute(
      'aria-hidden',
      'true'
    )
  })

  it('forwards className to the Card wrapper', () => {
    const { container } = render(
      <StatCard label="Total Graphs" value={3} className="col-span-2" />
    )
    expect(container.querySelector('.col-span-2')).toBeInTheDocument()
  })
})
