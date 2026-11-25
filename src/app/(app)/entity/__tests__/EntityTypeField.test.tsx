import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import EntityTypeField from '../components/EntityTypeField'

vi.mock('@robosystems/core/ui', () => ({
  Label: ({ children, htmlFor }: any) => (
    <label htmlFor={htmlFor}>{children}</label>
  ),
  Select: ({ children, id, value, onChange }: any) => (
    <select id={id} value={value} onChange={onChange}>
      {children}
    </select>
  ),
}))

describe('EntityTypeField', () => {
  it('shows the readable name of the stored value', () => {
    render(
      <EntityTypeField
        value="llc"
        editing={false}
        selected=""
        onChange={() => {}}
      />
    )
    expect(
      screen.getByText('Limited liability company (LLC)')
    ).toBeInTheDocument()
  })

  it('shows a value off the list as stored', () => {
    render(
      <EntityTypeField
        value="trust"
        editing={false}
        selected=""
        onChange={() => {}}
      />
    )
    expect(screen.getByText('trust')).toBeInTheDocument()
  })

  it('stores the server value when a name is chosen', () => {
    const onChange = vi.fn()
    render(<EntityTypeField value="" editing selected="" onChange={onChange} />)
    fireEvent.change(screen.getByLabelText('Entity Type'), {
      target: { value: 'llc' },
    })
    expect(onChange).toHaveBeenCalledWith('llc')
  })

  it('keeps a value off the list selected until another is chosen', () => {
    render(
      <EntityTypeField
        value="trust"
        editing
        selected="trust"
        onChange={() => {}}
      />
    )
    expect(screen.getByLabelText('Entity Type')).toHaveValue('trust')
    expect(screen.getByText(/is not on the list/)).toBeInTheDocument()
  })
})
