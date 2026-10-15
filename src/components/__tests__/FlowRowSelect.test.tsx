import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('flowbite-react', () => ({
  Select: ({ children, id, value, onChange, disabled }: any) => (
    <select id={id} value={value} onChange={onChange} disabled={disabled}>
      {children}
    </select>
  ),
}))

import { FlowRowSelect } from '../FlowRowSelect'

const FLOWS = [
  {
    qname: 'rs-gaap:ProceedsFromIssuanceOfLongTermDebt',
    name: 'Proceeds from long-term debt',
    activity: 'financing',
  },
  {
    qname: 'rs-gaap:PaymentsToAcquirePropertyPlantAndEquipment',
    name: 'Purchases of property and equipment',
    activity: 'investing',
  },
] as any[]

describe('FlowRowSelect', () => {
  it("offers the account's default first, then the rows by section", () => {
    render(
      <FlowRowSelect
        id="flow"
        value=""
        onChange={vi.fn()}
        flows={FLOWS}
        flowsFailed={false}
      />
    )
    const select = document.getElementById('flow') as HTMLSelectElement
    expect(select.options[0]).toHaveTextContent("Account's default flow")
    expect(
      Array.from(select.querySelectorAll('optgroup')).map((g) => g.label)
    ).toEqual(['Investing', 'Financing'])
    expect(select.disabled).toBe(false)
  })

  it('reports the chosen row by qname', () => {
    const onChange = vi.fn()
    render(
      <FlowRowSelect
        id="flow"
        value=""
        onChange={onChange}
        flows={FLOWS}
        flowsFailed={false}
      />
    )
    fireEvent.change(document.getElementById('flow')!, {
      target: { value: 'rs-gaap:ProceedsFromIssuanceOfLongTermDebt' },
    })
    expect(onChange).toHaveBeenCalledWith(
      'rs-gaap:ProceedsFromIssuanceOfLongTermDebt'
    )
  })

  it('keeps a prior tag selectable when the statement no longer offers it', () => {
    render(
      <FlowRowSelect
        id="flow"
        value="rs-gaap:ProceedsFromContributedCapital"
        onChange={vi.fn()}
        flows={FLOWS}
        flowsFailed={false}
        priorQname="rs-gaap:ProceedsFromContributedCapital"
      />
    )
    expect(
      screen.getByText(
        'rs-gaap:ProceedsFromContributedCapital (not a row of this statement)'
      )
    ).toBeInTheDocument()
  })

  it('is disabled while the rows load', () => {
    render(
      <FlowRowSelect
        id="flow"
        value=""
        onChange={vi.fn()}
        flows={null}
        flowsFailed={false}
      />
    )
    const select = document.getElementById('flow') as HTMLSelectElement
    expect(select.disabled).toBe(true)
    expect(select.options[0]).toHaveTextContent('Loading cash flow rows…')
  })
})
