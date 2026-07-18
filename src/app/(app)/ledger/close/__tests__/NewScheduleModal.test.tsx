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

import { NewScheduleModal } from '../components/NewScheduleModal'

const ACCOUNTS = {
  accounts: [
    { id: 'acct_exp', code: '6400', name: 'Insurance Expense' },
    { id: 'acct_prepaid', code: '1400', name: 'Prepaid Insurance' },
    { id: 'acct_ppe', code: '1500', name: 'Equipment' },
  ],
}

const renderModal = (onCreated = vi.fn(), onClose = vi.fn()) => {
  render(
    <NewScheduleModal
      graphId="kg_test"
      open
      onClose={onClose}
      onCreated={onCreated}
    />
  )
  return { onCreated, onClose }
}

const createButton = () =>
  screen.getByRole('button', { name: /create schedule/i })

const fillRequiredFields = async () => {
  // The option text appears in both the debit and credit selects once
  // accounts load, so assert on the collection rather than a single match.
  await waitFor(() =>
    expect(
      screen.getAllByText('6400 — Insurance Expense').length
    ).toBeGreaterThan(0)
  )
  fireEvent.change(screen.getByLabelText(/^name$/i), {
    target: { value: 'Prepaid Insurance Amortization' },
  })
  fireEvent.change(screen.getByLabelText(/debit account/i), {
    target: { value: 'acct_exp' },
  })
  fireEvent.change(screen.getByLabelText(/credit account/i), {
    target: { value: 'acct_prepaid' },
  })
  fireEvent.change(screen.getByLabelText(/first period/i), {
    target: { value: '2026-01-01' },
  })
  fireEvent.change(screen.getByLabelText(/last period/i), {
    target: { value: '2026-12-31' },
  })
  fireEvent.change(screen.getByLabelText(/monthly amount/i), {
    target: { value: '2000' },
  })
}

describe('NewScheduleModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockListAccounts.mockResolvedValue(ACCOUNTS)
    mockCreateSchedule.mockResolvedValue({
      structureId: 'struct_new',
      name: 'Prepaid Insurance Amortization',
      totalPeriods: 12,
      totalFacts: 24,
    })
  })

  it('disables submit until required fields are filled', async () => {
    renderModal()
    expect(createButton()).toBeDisabled()
    await fillRequiredFields()
    expect(createButton()).not.toBeDisabled()
  })

  it('blocks submit when debit and credit accounts match', async () => {
    renderModal()
    await fillRequiredFields()
    fireEvent.change(screen.getByLabelText(/credit account/i), {
      target: { value: 'acct_exp' },
    })
    expect(createButton()).toBeDisabled()
    expect(
      screen.getByText(/debit and credit accounts must differ/i)
    ).toBeInTheDocument()
  })

  it('submits cents, derived elementIds, and calls onCreated with the structure id', async () => {
    const { onCreated, onClose } = renderModal()
    await fillRequiredFields()
    fireEvent.click(createButton())

    await waitFor(() => expect(mockCreateSchedule).toHaveBeenCalledTimes(1))
    const [graphId, payload] = mockCreateSchedule.mock.calls[0]
    expect(graphId).toBe('kg_test')
    expect(payload).toMatchObject({
      name: 'Prepaid Insurance Amortization',
      elementIds: ['acct_exp', 'acct_prepaid'],
      periodStart: '2026-01-01',
      periodEnd: '2026-12-31',
      monthlyAmount: 200000,
      entryTemplate: {
        debitElementId: 'acct_exp',
        creditElementId: 'acct_prepaid',
        entryType: 'closing',
      },
    })
    expect(payload.scheduleMetadata).toBeUndefined()

    await waitFor(() => expect(onCreated).toHaveBeenCalledWith('struct_new'))
    expect(onClose).toHaveBeenCalled()
  })

  it('pre-fills monthly amount and last period from straight-line math', async () => {
    renderModal()
    await fillRequiredFields()

    fireEvent.click(
      screen.getByRole('button', { name: /asset & depreciation details/i })
    )
    fireEvent.change(screen.getByLabelText(/total to write off/i), {
      target: { value: '24000' },
    })
    fireEvent.change(screen.getByLabelText(/useful life/i), {
      target: { value: '12' },
    })

    expect(screen.getByLabelText(/monthly amount/i)).toHaveValue(2000)
    expect(screen.getByLabelText(/last period/i)).toHaveValue('2026-12-31')
  })

  it('includes schedule metadata and the asset account in elementIds', async () => {
    renderModal()
    await fillRequiredFields()

    fireEvent.click(
      screen.getByRole('button', { name: /asset & depreciation details/i })
    )
    fireEvent.change(screen.getByLabelText(/total to write off/i), {
      target: { value: '24000' },
    })
    fireEvent.change(screen.getByLabelText(/useful life/i), {
      target: { value: '12' },
    })
    fireEvent.change(screen.getByLabelText(/asset account/i), {
      target: { value: 'acct_ppe' },
    })

    fireEvent.click(createButton())
    await waitFor(() => expect(mockCreateSchedule).toHaveBeenCalledTimes(1))
    const [, payload] = mockCreateSchedule.mock.calls[0]
    expect(payload.elementIds).toEqual(['acct_exp', 'acct_prepaid', 'acct_ppe'])
    expect(payload.scheduleMetadata).toMatchObject({
      method: 'straight_line',
      originalAmount: 2400000,
      usefulLifeMonths: 12,
      assetElementId: 'acct_ppe',
    })
  })

  it('blocks submit when the monthly amount over-writes the total', async () => {
    renderModal()
    await fillRequiredFields()

    fireEvent.click(
      screen.getByRole('button', { name: /asset & depreciation details/i })
    )
    fireEvent.change(screen.getByLabelText(/total to write off/i), {
      target: { value: '24000' },
    })
    fireEvent.change(screen.getByLabelText(/useful life/i), {
      target: { value: '12' },
    })
    // 12 months × $3,000 = $36,000 > the $24,000 total — the final period
    // would go negative, which the server preview math must surface.
    fireEvent.change(screen.getByLabelText(/monthly amount/i), {
      target: { value: '3000' },
    })

    expect(createButton()).toBeDisabled()
    expect(screen.getByText(/over-writes the total/i)).toBeInTheDocument()
  })

  it('surfaces a submit error without closing', async () => {
    mockCreateSchedule.mockRejectedValue(new Error('element not found'))
    const { onCreated, onClose } = renderModal()
    await fillRequiredFields()
    fireEvent.click(createButton())

    await waitFor(() =>
      expect(screen.getByText(/element not found/i)).toBeInTheDocument()
    )
    expect(onCreated).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
  })
})
