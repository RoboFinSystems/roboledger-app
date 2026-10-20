import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockGetDischargeCandidates = vi.fn()

vi.mock('@robosystems/core', () => ({
  clients: {
    ledger: {
      getDischargeCandidates: (...args: any[]) =>
        mockGetDischargeCandidates(...args),
    },
  },
}))

vi.mock('flowbite-react', () => ({
  Checkbox: ({ id, checked, onChange, disabled }: any) => (
    <input
      id={id}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      disabled={disabled}
    />
  ),
  Label: ({ children, htmlFor }: any) => (
    <label htmlFor={htmlFor}>{children}</label>
  ),
}))

import SettlementPicker, { allocate } from '../SettlementPicker'

const item = (eventId: string, openCents: number, documentNumber: string) => ({
  eventId,
  entityId: 'ent_parent',
  agentId: 'agt_acme',
  occurredOn: '2026-09-01',
  documentNumber,
  description: null,
  originalCents: openCents,
  settledCents: 0,
  openCents,
  currency: 'USD',
  dueDate: '2026-09-30',
  dueDateBasis: 'stated',
  daysPastDue: 0,
  bucket: 'current',
})

const candidates = (classifiedToControl: boolean) => ({
  eventId: 'evt_line',
  kind: 'payables',
  amountCents: 500000,
  classifiedToControl,
  candidates: [item('evt_a', 420000, 'B-1'), item('evt_b', 100000, 'B-2')],
})

beforeEach(() => {
  vi.clearAllMocks()
})

describe('allocate', () => {
  it('applies the line in order, each up to what is open', () => {
    const picked = new Set(['evt_a', 'evt_b'])
    expect(
      allocate(candidates(true).candidates as any, picked, 500000)
    ).toEqual([
      { obligation_event_id: 'evt_a', amount: 420000 },
      { obligation_event_id: 'evt_b', amount: 80000 },
    ])
  })

  it('applies nothing unpicked', () => {
    expect(
      allocate(candidates(true).candidates as any, new Set(), 500000)
    ).toEqual([])
  })
})

describe('SettlementPicker', () => {
  it('opens on a line classified to payables and reports the pick', async () => {
    mockGetDischargeCandidates.mockResolvedValue(candidates(true))
    const onChange = vi.fn()
    render(
      <SettlementPicker graphId="kg1" eventId="evt_line" onChange={onChange} />
    )

    fireEvent.click(await screen.findByLabelText(/B-2/))

    await waitFor(() =>
      expect(onChange).toHaveBeenLastCalledWith([
        { obligation_event_id: 'evt_b', amount: 100000 },
      ])
    )
  })

  it('stays closed until asked on a line classified elsewhere', async () => {
    mockGetDischargeCandidates.mockResolvedValue(candidates(false))
    render(
      <SettlementPicker graphId="kg1" eventId="evt_line" onChange={vi.fn()} />
    )

    expect(await screen.findByText('Settles a bill?')).toBeTruthy()
    expect(screen.queryByLabelText(/B-1/)).toBeNull()
    fireEvent.click(screen.getByText('Settles a bill?'))
    expect(screen.getByLabelText(/B-1/)).toBeTruthy()
  })

  it('shows nothing when the line has no candidates', async () => {
    mockGetDischargeCandidates.mockResolvedValue({
      ...candidates(true),
      candidates: [],
    })
    const { container } = render(
      <SettlementPicker graphId="kg1" eventId="evt_line" onChange={vi.fn()} />
    )
    await waitFor(() => expect(mockGetDischargeCandidates).toHaveBeenCalled())
    expect(container.textContent).toBe('')
  })
})
