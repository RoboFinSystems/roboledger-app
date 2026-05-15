import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

// Flowbite's real Dropdown uses Floating UI for pointer interactions
// that don't compose well under jsdom; mock it down to a plain button
// trigger + flat list of items so we can assert label / click behavior
// without a full pointer-event simulation. DropdownItem renders its
// icon prop the same way the real component does.
vi.mock('flowbite-react', () => ({
  Dropdown: ({ label, children, ...rest }: any) => (
    <div data-testid="dropdown" aria-label={rest['aria-label']}>
      <button data-testid="dropdown-trigger">{label}</button>
      <ul role="menu">{children}</ul>
    </div>
  ),
  DropdownItem: ({ children, onClick, icon: Icon, className }: any) => (
    <li role="menuitem">
      <button onClick={onClick} className={className}>
        {Icon ? <Icon /> : null}
        {children}
      </button>
    </li>
  ),
}))

vi.mock('react-icons/hi', () => ({
  HiChevronDown: () => <span data-testid="chevron-down" />,
  HiClipboardList: () => <span data-testid="clipboard" />,
  HiEye: () => <span data-testid="eye" />,
  HiTable: () => <span data-testid="table" />,
}))

import ViewModeToggle from '../components/ViewModeToggle'

describe('ViewModeToggle', () => {
  it('renders all three mode options', () => {
    render(<ViewModeToggle viewMode="rendered" onChange={vi.fn()} />)
    // Trigger shows the current mode plus each option is in the menu.
    expect(screen.getAllByText('Rendered').length).toBeGreaterThan(0)
    expect(screen.getByText('Facts')).toBeInTheDocument()
    expect(screen.getByText('Elements')).toBeInTheDocument()
  })

  it('trigger label reflects current mode (rendered)', () => {
    render(<ViewModeToggle viewMode="rendered" onChange={vi.fn()} />)
    expect(screen.getByTestId('dropdown-trigger').textContent).toContain(
      'Rendered'
    )
  })

  it('trigger label reflects current mode (facts)', () => {
    render(<ViewModeToggle viewMode="facts" onChange={vi.fn()} />)
    expect(screen.getByTestId('dropdown-trigger').textContent).toContain(
      'Facts'
    )
  })

  it('trigger label reflects current mode (elements)', () => {
    render(<ViewModeToggle viewMode="elements" onChange={vi.fn()} />)
    expect(screen.getByTestId('dropdown-trigger').textContent).toContain(
      'Elements'
    )
  })

  it('calls onChange with "facts" when clicking the Facts item', () => {
    const onChange = vi.fn()
    render(<ViewModeToggle viewMode="rendered" onChange={onChange} />)
    // Click the menu-item button (not the trigger label).
    const factsItem = screen
      .getAllByRole('menuitem')
      .find((li) => li.textContent === 'Facts')
    expect(factsItem).toBeDefined()
    fireEvent.click(factsItem!.querySelector('button')!)
    expect(onChange).toHaveBeenCalledWith('facts')
  })

  it('calls onChange with "elements" when clicking the Elements item', () => {
    const onChange = vi.fn()
    render(<ViewModeToggle viewMode="rendered" onChange={onChange} />)
    const elementsItem = screen
      .getAllByRole('menuitem')
      .find((li) => li.textContent === 'Elements')
    expect(elementsItem).toBeDefined()
    fireEvent.click(elementsItem!.querySelector('button')!)
    expect(onChange).toHaveBeenCalledWith('elements')
  })

  it('calls onChange with "rendered" when clicking the Rendered item', () => {
    const onChange = vi.fn()
    render(<ViewModeToggle viewMode="facts" onChange={onChange} />)
    const renderedItem = screen
      .getAllByRole('menuitem')
      .find((li) => li.textContent === 'Rendered')
    expect(renderedItem).toBeDefined()
    fireEvent.click(renderedItem!.querySelector('button')!)
    expect(onChange).toHaveBeenCalledWith('rendered')
  })
})
