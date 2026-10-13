import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockListAccounts = vi.fn()
const mockCreateSchedule = vi.fn()

vi.mock('@robosystems/core', () => ({
  clients: {
    ledger: {
      listAccounts: (...args: any[]) => mockListAccounts(...args),
      createSchedule: (...args: any[]) => mockCreateSchedule(...args),
    },
  },
}))

vi.mock('flowbite-react', () => ({
  Alert: ({ children }: any) => <div role="alert">{children}</div>,
  Button: ({ children, onClick, disabled }: any) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
  Label: ({ children, htmlFor }: any) => (
    <label htmlFor={htmlFor}>{children}</label>
  ),
  Modal: ({ children, show }: any) => (show ? <div>{children}</div> : null),
  ModalBody: ({ children }: any) => <div>{children}</div>,
  ModalFooter: ({ children }: any) => <div>{children}</div>,
  ModalHeader: ({ children }: any) => <h3>{children}</h3>,
  Select: ({ children, id, value, onChange, disabled }: any) => (
    <select id={id} value={value} onChange={onChange} disabled={disabled}>
      {children}
    </select>
  ),
  TextInput: ({ id, value, onChange, disabled, type, placeholder }: any) => (
    <input
      id={id}
      value={value}
      onChange={onChange}
      disabled={disabled}
      type={type}
      placeholder={placeholder}
    />
  ),
}))

import { NewScheduleModal } from '../NewScheduleModal'

const set = (id: string, value: string) =>
  fireEvent.change(document.getElementById(id)!, { target: { value } })

describe('NewScheduleModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockListAccounts.mockResolvedValue({
      accounts: [
        { id: 'acct_dep', code: '7000', name: 'Depreciation Expense' },
        { id: 'acct_acc', code: '1550', name: 'Accumulated Depreciation' },
      ],
    })
    mockCreateSchedule.mockResolvedValue({ structureId: 'str_1' })
  })

  it("creates a subsidiary's schedule in the subsidiary's books", async () => {
    render(
      <NewScheduleModal
        graphId="kg_test"
        entityId="ent_sub"
        open
        onClose={vi.fn()}
      />
    )
    await screen.findAllByText('7000 — Depreciation Expense')

    set('sched-name', 'Espresso machine depreciation')
    set('sched-debit', 'acct_dep')
    set('sched-credit', 'acct_acc')
    set('sched-start', '2026-07-01')
    set('sched-end', '2026-09-30')
    set('sched-monthly', '100')
    fireEvent.click(screen.getByRole('button', { name: 'Create Schedule' }))

    await waitFor(() => expect(mockCreateSchedule).toHaveBeenCalledTimes(1))
    expect(mockCreateSchedule.mock.calls[0][1].entityId).toBe('ent_sub')
  })
})
