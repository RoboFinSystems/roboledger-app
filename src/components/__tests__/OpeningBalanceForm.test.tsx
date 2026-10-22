import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockListAccounts = vi.fn()
const mockRecordOpeningBalance = vi.fn()

vi.mock('@robosystems/core', () => ({
  clients: {
    ledger: {
      listAccounts: (...args: any[]) => mockListAccounts(...args),
      recordOpeningBalance: (...args: any[]) =>
        mockRecordOpeningBalance(...args),
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
  Label: ({ children, htmlFor }: any) => (
    <label htmlFor={htmlFor}>{children}</label>
  ),
  ModalBody: ({ children }: any) => <div>{children}</div>,
  ModalFooter: ({ children }: any) => <div>{children}</div>,
  Select: ({ children, sizing: _sizing, ...props }: any) => (
    <select {...props}>{children}</select>
  ),
  Spinner: () => <span role="status" />,
  TextInput: ({ sizing: _sizing, color: _color, ...props }: any) => (
    <input {...props} />
  ),
}))

import OpeningBalanceForm, {
  dayBefore,
  parseDollars,
  toSides,
} from '../OpeningBalanceForm'

const CHART: Record<string, any[]> = {
  asset: [
    { id: 'acc_cash', code: '1000', name: 'Checking', balanceType: 'debit' },
    { id: 'acc_ppe', code: '1500', name: 'Equipment', balanceType: 'debit' },
    {
      id: 'acc_hdr',
      code: '1',
      name: 'Assets',
      balanceType: 'debit',
      isPlaceholder: true,
    },
  ],
  liability: [
    {
      id: 'acc_card',
      code: '2000',
      name: 'Credit Card',
      balanceType: 'credit',
    },
  ],
  equity: [
    {
      id: 'acc_capital',
      code: '3000',
      name: "Owner's Capital",
      balanceType: 'credit',
    },
    {
      id: 'acc_obe',
      code: '3900',
      name: 'Opening Balance Equity',
      balanceType: 'credit',
    },
  ],
}

function renderForm(props: Record<string, unknown> = {}) {
  const onRecorded = vi.fn()
  const onCancel = vi.fn()
  render(
    <OpeningBalanceForm
      graphId="kg_a"
      entityId="ent_sub"
      entityName="Harbor Café"
      asOf="2026-05-31"
      onCancel={onCancel}
      onRecorded={onRecorded}
      {...props}
    />
  )
  return { onRecorded, onCancel }
}

const amount = (name: string, value: string) =>
  fireEvent.change(screen.getByLabelText(new RegExp(name)), {
    target: { value },
  })

const submit = () =>
  screen.getByRole('button', { name: /opening balance$/ }) as HTMLButtonElement

describe('helpers', () => {
  it('dates the opening the day before the first month', () => {
    expect(dayBefore('2026-06-01')).toBe('2026-05-31')
    expect(dayBefore('2026-01-01')).toBe('2025-12-31')
  })

  it('reads typed dollars, blank as zero, junk as invalid', () => {
    expect(parseDollars('1,250.50')).toBe(1250.5)
    expect(parseDollars('$-40')).toBe(-40)
    expect(parseDollars('')).toBe(0)
    expect(Number.isNaN(parseDollars('12.345'))).toBe(true)
    expect(Number.isNaN(parseDollars('abc'))).toBe(true)
  })

  it('puts an amount on its normal side, a negative one on the other', () => {
    expect(toSides(100, 'debit')).toEqual({ debit: 10000, credit: 0 })
    expect(toSides(100, 'credit')).toEqual({ debit: 0, credit: 10000 })
    // An overdrawn bank account.
    expect(toSides(-25.5, 'debit')).toEqual({ debit: 0, credit: 2550 })
  })
})

describe('OpeningBalanceForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockListAccounts.mockImplementation((_g: string, opts: any) =>
      Promise.resolve({ accounts: CHART[opts.classification] })
    )
    mockRecordOpeningBalance.mockResolvedValue({ id: 'je_open' })
  })

  it('lists the entity’s balance-sheet accounts, headers left out', async () => {
    renderForm()
    await screen.findByLabelText(/Checking/)
    expect(mockListAccounts).toHaveBeenCalledWith('kg_a', {
      classification: 'asset',
      isActive: true,
      limit: 500,
      entityId: 'ent_sub',
    })
    expect(screen.queryByLabelText(/^1 · Assets/)).toBeNull()
    expect(screen.getByText(/as of/)).toHaveTextContent('May 31, 2026')
  })

  it('records the balances, the difference taken by Opening Balance Equity', async () => {
    const { onRecorded } = renderForm()
    await screen.findByLabelText(/Checking/)
    amount('Checking', '12,000')
    amount('Equipment', '8000')
    amount('Credit Card', '1,500.25')
    amount("Owner's Capital", '10000')

    // 20,000 of debits against 11,500.25 of credits: OBE defaults in.
    expect(
      screen.getByLabelText('Equity account that takes the difference')
    ).toHaveValue('acc_obe')
    expect(screen.getByText(/Opening Balance Equity takes/)).toHaveTextContent(
      '$8,499.75 as a credit'
    )
    fireEvent.click(submit())

    await waitFor(() => expect(onRecorded).toHaveBeenCalled())
    expect(mockRecordOpeningBalance).toHaveBeenCalledWith('kg_a', {
      entity_id: 'ent_sub',
      balances: [
        { element_id: 'acc_cash', debit_amount: 1200000, credit_amount: 0 },
        { element_id: 'acc_ppe', debit_amount: 800000, credit_amount: 0 },
        { element_id: 'acc_card', debit_amount: 0, credit_amount: 150025 },
        { element_id: 'acc_capital', debit_amount: 0, credit_amount: 1000000 },
      ],
      equity_element_id: 'acc_obe',
      memo: 'Opening balances',
    })
  })

  it('balanced balances name no equity account', async () => {
    renderForm({ entityId: null })
    await screen.findByLabelText(/Checking/)
    amount('Checking', '500')
    amount("Owner's Capital", '500')
    fireEvent.click(submit())

    await waitFor(() => expect(mockRecordOpeningBalance).toHaveBeenCalled())
    const body = mockRecordOpeningBalance.mock.calls[0][1]
    expect(body.equity_element_id).toBeNull()
    // The group parent is the default; no entity_id is sent.
    expect(body).not.toHaveProperty('entity_id')
  })

  it('refuses an unbalanced sheet with no equity account to take the difference', async () => {
    mockListAccounts.mockImplementation((_g: string, opts: any) =>
      Promise.resolve({
        accounts:
          opts.classification === 'equity'
            ? [CHART.equity[0]]
            : CHART[opts.classification],
      })
    )
    renderForm()
    await screen.findByLabelText(/Checking/)
    amount('Checking', '500')
    expect(screen.getByText(/name the equity account/)).toBeInTheDocument()
    expect(submit()).toBeDisabled()
  })

  it('keeps the absorbing account blank, and junk out', async () => {
    renderForm()
    await screen.findByLabelText(/Checking/)
    amount('Checking', '500')
    amount('Opening Balance Equity', '100')
    expect(
      screen.getByText(/Leave Opening Balance Equity blank/)
    ).toBeInTheDocument()
    expect(submit()).toBeDisabled()

    amount('Opening Balance Equity', '')
    amount('Equipment', '12.345')
    expect(submit()).toBeDisabled()
  })

  it('prefills a recorded opening to replace it', async () => {
    renderForm({
      existing: [
        { accountId: 'acc_cash', debitAmount: 700, creditAmount: 0 },
        { accountId: 'acc_card', debitAmount: 0, creditAmount: 200 },
        { accountId: 'acc_obe', debitAmount: 0, creditAmount: 500 },
      ],
    })
    expect(await screen.findByLabelText(/Checking/)).toHaveValue('700.00')
    expect(screen.getByLabelText(/Credit Card/)).toHaveValue('200.00')
    expect(screen.getByText(/replaces the opening balance/)).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Replace opening balance' })
    ).toBeInTheDocument()
  })

  it('shows why a post was refused', async () => {
    mockRecordOpeningBalance.mockRejectedValue(
      new Error(
        'Record opening balance failed: {"detail":"The opening balance can change only before the entity\'s first close."}'
      )
    )
    renderForm()
    await screen.findByLabelText(/Checking/)
    amount('Checking', '500')
    amount("Owner's Capital", '500')
    fireEvent.click(submit())
    expect(await screen.findByRole('alert')).toHaveTextContent(/first close/)
  })
})
