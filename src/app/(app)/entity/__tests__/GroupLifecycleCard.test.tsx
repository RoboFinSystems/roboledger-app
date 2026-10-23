import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockRecordAcquisition = vi.fn()
const mockRecordOwnershipChange = vi.fn()
const mockRecordDeconsolidation = vi.fn()

vi.mock('@robosystems/core', () => ({
  clients: {
    ledger: {
      recordAcquisition: (...args: any[]) => mockRecordAcquisition(...args),
      recordOwnershipChange: (...args: any[]) =>
        mockRecordOwnershipChange(...args),
      recordDeconsolidation: (...args: any[]) =>
        mockRecordDeconsolidation(...args),
    },
  },
}))

vi.mock('flowbite-react', () => ({
  Alert: ({ children }: any) => <div role="alert">{children}</div>,
  Button: ({ children, onClick, disabled, type }: any) => (
    <button onClick={onClick} disabled={disabled} type={type ?? 'button'}>
      {children}
    </button>
  ),
  Card: ({ children }: any) => <div>{children}</div>,
  Label: ({ children, htmlFor }: any) => (
    <label htmlFor={htmlFor}>{children}</label>
  ),
  TextInput: ({ sizing: _sizing, ...props }: any) => <input {...props} />,
}))

import GroupLifecycleCard from '../components/GroupLifecycleCard'

const member = (overrides: Record<string, unknown> = {}) =>
  ({
    id: 'ent_north',
    name: 'Northside Café LLC',
    isParent: false,
    entityRole: 'operating',
    consolidationMethod: 'full',
    ownershipPct: 75,
    joinedOn: '2025-10-01',
    leftOn: null,
    isFormer: false,
    ...overrides,
  }) as any

const type = (label: RegExp | string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } })

describe('GroupLifecycleCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders nothing for the group parent or the consolidation entity', () => {
    const { container } = render(
      <GroupLifecycleCard graphId="kg_a" entity={member({ isParent: true })} />
    )
    expect(container).toBeEmptyDOMElement()
    const second = render(
      <GroupLifecycleCard
        graphId="kg_a"
        entity={member({ entityRole: 'consolidation' })}
      />
    )
    expect(second.container).toBeEmptyDOMElement()
  })

  it('records an acquisition and shows the goodwill', async () => {
    mockRecordAcquisition.mockResolvedValue({
      joined_on: '2025-10-01',
      consideration: 3150000,
      parent_share: 2250000,
      excess: 900000,
      goodwill: 900000,
      noncontrolling_interest: 0,
    })
    const onRecorded = vi.fn()
    render(
      <GroupLifecycleCard
        graphId="kg_a"
        entity={member()}
        onRecorded={onRecorded}
      />
    )
    expect(screen.getByText(/Joined 2025-10; 75% held/)).toBeInTheDocument()
    fireEvent.click(screen.getByText('Record the acquisition'))
    type('Price paid ($)', '31,500')
    type('Basis', 'Purchase agreement, 1 October 2025')
    fireEvent.click(screen.getByText('Record'))

    await waitFor(() =>
      expect(mockRecordAcquisition).toHaveBeenCalledWith('kg_a', {
        entity_id: 'ent_north',
        consideration: 3150000,
        basis: 'Purchase agreement, 1 October 2025',
      })
    )
    expect(await screen.findByText(/goodwill \$9,000\.00/)).toBeInTheDocument()
    expect(onRecorded).toHaveBeenCalled()
  })

  it('records a sale within the method with the price received', async () => {
    mockRecordOwnershipChange.mockResolvedValue({
      period: '2026-04',
      from_pct: 85,
      to_pct: 75,
      book_value: -270000,
      earnings_transferred: -243900,
      premium_transferred: 0,
      carrying_released: 389412,
      gain_reversed: 310588,
      equity_adjustment: -186100,
    })
    render(
      <GroupLifecycleCard
        graphId="kg_a"
        entity={member({ ownershipPct: 85 })}
      />
    )
    fireEvent.click(screen.getByText('Record a change in share'))
    type('From month (YYYY-MM)', '2026-04')
    type(/The parent's share from then/, '75')
    expect(screen.getByLabelText('Price received ($)')).toBeInTheDocument()
    type('Price received ($)', '7000')
    type('Basis', 'Sale agreement with the founders')
    fireEvent.click(screen.getByText('Record'))

    await waitFor(() =>
      expect(mockRecordOwnershipChange).toHaveBeenCalledWith('kg_a', {
        entity_id: 'ent_north',
        period: '2026-04',
        ownership_pct: 75,
        consideration: 700000,
        basis: 'Sale agreement with the founders',
      })
    )
    expect(await screen.findByText(/Share 85% → 75%/)).toBeInTheDocument()
    expect(screen.getByText(/gain of \$3,105\.88 reversed/)).toBeInTheDocument()
  })

  it('offers the deconsolidation once the member has left, and names the gain', async () => {
    mockRecordDeconsolidation.mockResolvedValue({
      period: '2026-06',
      consideration: 6200000,
      derecognized: [
        { concept: 'rs-gaap:Goodwill', amount: -900000 },
        { concept: 'rs-gaap:MinorityInterest', amount: 1400000 },
      ],
      earnings_restored: 3252000,
      gain_loss: -2443412,
    })
    render(
      <GroupLifecycleCard
        graphId="kg_a"
        entity={member({ leftOn: '2026-05-31', isFormer: true })}
      />
    )
    expect(
      screen.getByText(/A former member: left after 2026-05/)
    ).toBeInTheDocument()
    expect(
      screen.queryByText('Record a change in share')
    ).not.toBeInTheDocument()
    fireEvent.click(screen.getByText('Record the deconsolidation'))
    type('Proceeds ($)', '62,000')
    type('Basis', 'Sale agreement')
    fireEvent.click(screen.getByText('Record'))

    await waitFor(() =>
      expect(mockRecordDeconsolidation).toHaveBeenCalledWith('kg_a', {
        entity_id: 'ent_north',
        consideration: 6200000,
        basis: 'Sale agreement',
      })
    )
    expect(
      await screen.findByText(
        /Taken off: Goodwill \$9,000\.00, MinorityInterest \$14,000\.00/
      )
    ).toBeInTheDocument()
    expect(
      screen.getByText(/loss on its leaving: \$24,434\.12/)
    ).toBeInTheDocument()
  })

  it('starts another entity with an empty form', () => {
    const { rerender } = render(
      <GroupLifecycleCard graphId="kg_a" entity={member()} />
    )
    fireEvent.click(screen.getByText('Record the acquisition'))
    type('Price paid ($)', '31500')
    expect(screen.getByLabelText('Price paid ($)')).toHaveValue('31500')

    rerender(
      <GroupLifecycleCard
        graphId="kg_a"
        entity={member({ id: 'ent_other', name: 'Harbor Café LLC' })}
      />
    )
    fireEvent.click(screen.getByText('Record the acquisition'))
    expect(screen.getByLabelText('Price paid ($)')).toHaveValue('')
  })

  it('shows the refusal when the API says no', async () => {
    mockRecordAcquisition.mockRejectedValue(
      new Error("Northside Café LLC's books have no opening balance.")
    )
    render(<GroupLifecycleCard graphId="kg_a" entity={member()} />)
    fireEvent.click(screen.getByText('Record the acquisition'))
    type('Price paid ($)', '31500')
    type('Basis', 'Purchase agreement')
    fireEvent.click(screen.getByText('Record'))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /no opening balance/
    )
  })
})
