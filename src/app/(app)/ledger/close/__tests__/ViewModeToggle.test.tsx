import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/core', () => ({
  customTheme: { button: {} },
}))

vi.mock('flowbite-react', () => ({
  Button: ({ children, onClick, color }: any) => (
    <button onClick={onClick} data-color={color}>
      {children}
    </button>
  ),
}))

vi.mock('react-icons/hi', () => ({
  HiEye: () => <span />,
  HiTable: () => <span />,
}))

import ViewModeToggle from '../components/ViewModeToggle'

describe('ViewModeToggle', () => {
  it('renders both buttons', () => {
    render(<ViewModeToggle viewMode="rendered" onChange={vi.fn()} />)
    expect(screen.getByText('Rendered')).toBeInTheDocument()
    expect(screen.getByText('Facts')).toBeInTheDocument()
  })

  it('highlights rendered when active', () => {
    render(<ViewModeToggle viewMode="rendered" onChange={vi.fn()} />)
    const renderedBtn = screen.getByText('Rendered').closest('button')
    const factsBtn = screen.getByText('Facts').closest('button')
    expect(renderedBtn?.dataset.color).toBe('primary')
    expect(factsBtn?.dataset.color).toBe('light')
  })

  it('highlights facts when active', () => {
    render(<ViewModeToggle viewMode="facts" onChange={vi.fn()} />)
    const renderedBtn = screen.getByText('Rendered').closest('button')
    const factsBtn = screen.getByText('Facts').closest('button')
    expect(renderedBtn?.dataset.color).toBe('light')
    expect(factsBtn?.dataset.color).toBe('primary')
  })

  it('calls onChange with "rendered" when clicking Rendered', () => {
    const onChange = vi.fn()
    render(<ViewModeToggle viewMode="facts" onChange={onChange} />)
    fireEvent.click(screen.getByText('Rendered'))
    expect(onChange).toHaveBeenCalledWith('rendered')
  })

  it('calls onChange with "facts" when clicking Facts', () => {
    const onChange = vi.fn()
    render(<ViewModeToggle viewMode="rendered" onChange={onChange} />)
    fireEvent.click(screen.getByText('Facts'))
    expect(onChange).toHaveBeenCalledWith('facts')
  })
})
