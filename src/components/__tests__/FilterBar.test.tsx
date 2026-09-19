import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import {
  FilterActions,
  FilterBar,
  FilterDate,
  FilterField,
  FilterSelect,
  SearchField,
} from '../FilterBar'

// Real flowbite, deliberately: the bug these components exist to fix was
// about where flowbite puts `className`, which a mock would paper over.

describe('SearchField', () => {
  it('puts the magnifier inside the field, padding the input itself', () => {
    render(
      <SearchField
        id="search"
        placeholder="Search accounts…"
        value=""
        onChange={() => {}}
      />
    )
    const input = screen.getByLabelText('Search')
    // The icon shares the input's positioned wrapper…
    expect(input.parentElement?.querySelector('svg')).not.toBeNull()
    // …and the INPUT makes room for it. Pages used to pass `pl-10` as
    // `className`, which flowbite applies to the outer wrapper — shoving the
    // whole field right and leaving the icon stranded outside it.
    expect(input.className).toContain('pl-10')
    expect(input.closest('div.flex')?.className ?? '').not.toContain('pl-10')
  })

  it('reports the typed text, not the event', () => {
    const onChange = vi.fn()
    render(
      <SearchField id="search" placeholder="…" value="" onChange={onChange} />
    )
    fireEvent.change(screen.getByLabelText('Search'), {
      target: { value: 'cash' },
    })
    expect(onChange).toHaveBeenCalledWith('cash')
  })

  it('takes a label of its own', () => {
    render(
      <SearchField
        id="find"
        label="Find"
        placeholder="…"
        value=""
        onChange={() => {}}
      />
    )
    expect(screen.getByLabelText('Find')).toBeInTheDocument()
  })
})

describe('FilterSelect', () => {
  it('labels the select and reports the chosen value', () => {
    const onChange = vi.fn()
    render(
      <FilterSelect id="status" label="Status" value="" onChange={onChange}>
        <option value="">All statuses</option>
        <option value="posted">Posted</option>
      </FilterSelect>
    )
    fireEvent.change(screen.getByLabelText('Status'), {
      target: { value: 'posted' },
    })
    expect(onChange).toHaveBeenCalledWith('posted')
  })
})

describe('FilterDate', () => {
  it('is a labelled date input reporting an ISO date', () => {
    const onChange = vi.fn()
    render(
      <FilterDate id="start" label="Start date" value="" onChange={onChange} />
    )
    const input = screen.getByLabelText('Start date')
    expect(input).toHaveAttribute('type', 'date')
    fireEvent.change(input, { target: { value: '2026-09-18' } })
    expect(onChange).toHaveBeenCalledWith('2026-09-18')
  })
})

describe('FilterField', () => {
  it('uses a real <label> only when there is a control to point it at', () => {
    const { container, rerender } = render(
      <FilterField label="View" htmlFor="view">
        <input id="view" />
      </FilterField>
    )
    expect(container.querySelector('label')).toHaveAttribute('for', 'view')

    // A segmented control names itself; a <label for> aimed at nothing is
    // an accessibility error, so the caption is a plain span.
    rerender(
      <FilterField label="View">
        <div role="group" aria-label="View" />
      </FilterField>
    )
    expect(container.querySelector('label')).toBeNull()
    expect(screen.getByText('View')).toBeInTheDocument()
  })
})

describe('field widths', () => {
  it('never emits the default width alongside a caller’s width', () => {
    // `sm:w-auto` and `sm:w-44` share a breakpoint, so stylesheet order picks
    // the winner — and `w-auto` wins, collapsing the field to its content.
    render(
      <FilterSelect
        id="status"
        label="Status"
        value=""
        onChange={() => {}}
        className="sm:w-40"
      >
        <option value="">All statuses</option>
      </FilterSelect>
    )
    const field = screen.getByText('Status').parentElement as HTMLElement
    expect(field.className).toContain('sm:w-40')
    expect(field.className).not.toContain('sm:w-auto')
  })

  it('falls back to content width when none is given', () => {
    render(
      <FilterDate id="start" label="Start date" value="" onChange={() => {}} />
    )
    expect(screen.getByText('Start date').parentElement?.className).toContain(
      'sm:w-auto'
    )
  })
})

describe('FilterBar', () => {
  it('groups its fields and keeps actions on the right', () => {
    render(
      <FilterBar>
        <SearchField id="q" placeholder="…" value="" onChange={() => {}} />
        <FilterActions>
          <button type="button">Refresh</button>
        </FilterActions>
      </FilterBar>
    )
    const group = screen.getByRole('group', { name: 'Filters' })
    expect(group).toContainElement(screen.getByLabelText('Search'))
    expect(
      screen.getByRole('button', { name: 'Refresh' }).parentElement?.className
    ).toContain('ml-auto')
  })
})
