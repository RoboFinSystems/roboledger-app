import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockListAccounts = vi.fn()
const mockUpdateSchedule = vi.fn()
const mockCreateSchedule = vi.fn()
const mockPreviewSchedule = vi.fn()
const mockRebuildSchedule = vi.fn()

vi.mock('@robosystems/core', () => ({
  clients: {
    ledger: {
      listAccounts: (...args: any[]) => mockListAccounts(...args),
      updateSchedule: (...args: any[]) => mockUpdateSchedule(...args),
    },
  },
}))

vi.mock('@/lib/ledger/schedules', async () => {
  const actual = await vi.importActual<Record<string, unknown>>(
    '@/lib/ledger/schedules'
  )
  return {
    ...actual,
    createSchedule: (...args: any[]) => mockCreateSchedule(...args),
    previewSchedule: (...args: any[]) => mockPreviewSchedule(...args),
    rebuildSchedule: (...args: any[]) => mockRebuildSchedule(...args),
  }
})

vi.mock('@robosystems/core/ui', () => ({
  Alert: ({ children }: any) => <div role="alert">{children}</div>,
  Button: ({ children, onClick, disabled }: any) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
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
  Modal: ({ children, show }: any) => (show ? <div>{children}</div> : null),
  ModalBody: ({ children }: any) => <div>{children}</div>,
  ModalFooter: ({ children }: any) => <div>{children}</div>,
  ModalHeader: ({ children }: any) => <h3>{children}</h3>,
  Select: ({ children, id, value, onChange, disabled }: any) => (
    <select id={id} value={value} onChange={onChange} disabled={disabled}>
      {children}
    </select>
  ),
  TextInput: ({
    id,
    value,
    onChange,
    disabled,
    type,
    placeholder,
    sizing: _sizing,
    ...rest
  }: any) => (
    <input
      id={id}
      value={value}
      onChange={onChange}
      disabled={disabled}
      type={type}
      placeholder={placeholder}
      {...rest}
    />
  ),
}))

import {
  ScheduleModal,
  type EditingSchedule,
} from '../components/ScheduleModal'

const ACCOUNTS = {
  accounts: [
    { id: 'acct_exp', code: '6400', name: 'Insurance Expense' },
    { id: 'acct_prepaid', code: '1400', name: 'Prepaid Insurance' },
    { id: 'acct_ppe', code: '1500', name: 'Equipment' },
    { id: 'acct_interest', code: '7100', name: 'Interest Expense' },
    { id: 'acct_ap', code: '2000', name: 'Accounts Payable' },
    { id: 'acct_note', code: '2500', name: 'Notes Payable' },
    { id: 'acct_cash', code: '1000', name: 'Checking' },
  ],
}

const renderModal = (
  onSaved = vi.fn(),
  onClose = vi.fn(),
  entityId: string | null = null,
  editing: EditingSchedule | null = null
) => {
  render(
    <ScheduleModal
      graphId="kg_test"
      entityId={entityId}
      open
      onClose={onClose}
      onSaved={onSaved}
      editing={editing}
    />
  )
  return { onSaved, onClose }
}

const createButton = () =>
  screen.getByRole('button', { name: /create schedule/i })
const saveButton = () => screen.getByRole('button', { name: /save changes/i })
const previewButton = () => screen.getByRole('button', { name: /^preview/i })

const change = (label: RegExp | string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } })

const waitForAccounts = async () => {
  // The option text appears in both the debit and credit selects once
  // accounts load, so assert on the collection rather than a single match.
  await waitFor(() =>
    expect(
      screen.getAllByText('6400 — Insurance Expense').length
    ).toBeGreaterThan(0)
  )
}

const fillRequiredFields = async () => {
  await waitForAccounts()
  change(/^name$/i, 'Prepaid Insurance Amortization')
  change(/debit account/i, 'acct_exp')
  change(/credit account/i, 'acct_prepaid')
  change(/first period/i, '2026-01-01')
  change(/last period/i, '2026-12-31')
  change(/monthly amount/i, '2000')
}

const openAssetDetails = () =>
  fireEvent.click(
    screen.getByRole('button', { name: /asset & depreciation details/i })
  )

describe('ScheduleModal — straight-line', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockListAccounts.mockResolvedValue(ACCOUNTS)
    mockCreateSchedule.mockResolvedValue({
      structureId: 'struct_new',
      name: 'Prepaid Insurance Amortization',
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
    change(/credit account/i, 'acct_exp')
    expect(createButton()).toBeDisabled()
    expect(
      screen.getByText(/debit and credit accounts must differ/i)
    ).toBeInTheDocument()
  })

  it('submits the definition in cents and calls onSaved with the structure id', async () => {
    const { onSaved, onClose } = renderModal()
    await fillRequiredFields()
    fireEvent.click(createButton())

    await waitFor(() => expect(mockCreateSchedule).toHaveBeenCalledTimes(1))
    const [graphId, payload] = mockCreateSchedule.mock.calls[0]
    expect(graphId).toBe('kg_test')
    expect(payload).toMatchObject({
      name: 'Prepaid Insurance Amortization',
      element_ids: ['acct_exp', 'acct_prepaid'],
      period_start: '2026-01-01',
      period_end: '2026-12-31',
      monthly_amount: 200000,
      entry_template: {
        debit_element_id: 'acct_exp',
        credit_element_id: 'acct_prepaid',
        entry_type: 'closing',
      },
      schedule_metadata: {
        method: 'straight_line',
        periodic_amounts: null,
        loan_terms: null,
      },
    })
    expect(payload.entry_template.legs).toBeUndefined()
    expect(payload.entity_id).toBeUndefined()

    await waitFor(() => expect(onSaved).toHaveBeenCalledWith('struct_new'))
    expect(onClose).toHaveBeenCalled()
  })

  it("files a subsidiary's schedule in the subsidiary's books", async () => {
    renderModal(vi.fn(), vi.fn(), 'ent_sub')
    await fillRequiredFields()
    fireEvent.click(createButton())

    await waitFor(() => expect(mockCreateSchedule).toHaveBeenCalledTimes(1))
    expect(mockCreateSchedule.mock.calls[0][1].entity_id).toBe('ent_sub')
    expect(mockListAccounts).toHaveBeenCalledWith(
      'kg_test',
      expect.objectContaining({ entityId: 'ent_sub' })
    )
  })

  it('pre-fills monthly amount and last period from straight-line math', async () => {
    renderModal()
    await fillRequiredFields()
    openAssetDetails()
    change(/original cost/i, '24000')
    change(/useful life/i, '12')

    expect(screen.getByLabelText(/monthly amount/i)).toHaveValue(2000)
    expect(screen.getByLabelText(/last period/i)).toHaveValue('2026-12-31')
  })

  it('includes schedule metadata and the asset account in element_ids', async () => {
    renderModal()
    await fillRequiredFields()
    openAssetDetails()
    change(/original cost/i, '24000')
    change(/useful life/i, '12')
    change(/asset account/i, 'acct_ppe')

    fireEvent.click(createButton())
    await waitFor(() => expect(mockCreateSchedule).toHaveBeenCalledTimes(1))
    const [, payload] = mockCreateSchedule.mock.calls[0]
    expect(payload.element_ids).toEqual([
      'acct_exp',
      'acct_prepaid',
      'acct_ppe',
    ])
    expect(payload.schedule_metadata).toMatchObject({
      method: 'straight_line',
      original_amount: 2400000,
      useful_life_months: 12,
      asset_element_id: 'acct_ppe',
    })
  })

  it('sends the day the cost was booked when it is before the first period', async () => {
    renderModal()
    await fillRequiredFields()
    openAssetDetails()
    change(/cost booked on/i, '2025-12-15')

    fireEvent.click(createButton())
    await waitFor(() => expect(mockCreateSchedule).toHaveBeenCalledTimes(1))
    const [, payload] = mockCreateSchedule.mock.calls[0]
    expect(payload.schedule_metadata).toMatchObject({ booked_on: '2025-12-15' })
  })

  it('blocks submit when the monthly amount over-writes the total', async () => {
    renderModal()
    await fillRequiredFields()
    openAssetDetails()
    change(/original cost/i, '24000')
    change(/useful life/i, '12')
    // 12 months × $3,000 = $36,000 > the $24,000 total — the final period
    // would go negative, which the server's generator refuses.
    change(/monthly amount/i, '3000')

    expect(createButton()).toBeDisabled()
    expect(screen.getByText(/over-writes the total/i)).toBeInTheDocument()
  })

  it('deducts the salvage value from the pre-fill and the summary total', async () => {
    renderModal()
    await fillRequiredFields()
    openAssetDetails()
    change(/original cost/i, '12000')
    change(/salvage value/i, '2400')
    change(/useful life/i, '12')

    // The server books 12,000 − 2,400 = 9,600 over 12 months.
    expect(screen.getByLabelText(/monthly amount/i)).toHaveValue(800)
    expect(screen.getByText('$9,600.00')).toBeInTheDocument()
    expect(createButton()).not.toBeDisabled()
  })

  it('blocks submit when the salvage value is not below the cost', async () => {
    renderModal()
    await fillRequiredFields()
    openAssetDetails()
    change(/original cost/i, '12000')
    change(/salvage value/i, '12000')

    expect(createButton()).toBeDisabled()
    expect(
      screen.getByText(/salvage value must be at least zero/i)
    ).toBeInTheDocument()
  })

  it('blocks submit for a salvage value with no original cost', async () => {
    renderModal()
    await fillRequiredFields()
    openAssetDetails()
    change(/salvage value/i, '100')
    expect(createButton()).toBeDisabled()
  })

  it('surfaces a submit error without closing', async () => {
    mockCreateSchedule.mockRejectedValue(new Error('element not found'))
    const { onSaved, onClose } = renderModal()
    await fillRequiredFields()
    fireEvent.click(createButton())

    await waitFor(() =>
      expect(screen.getByText(/element not found/i)).toBeInTheDocument()
    )
    expect(onSaved).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
  })

  it('shows the server reason, not the raw error envelope', async () => {
    mockCreateSchedule.mockRejectedValue(
      new Error(
        'Create schedule failed: {"detail":"Posting date falls in a closed period."}'
      )
    )
    renderModal()
    await fillRequiredFields()
    fireEvent.click(createButton())

    await waitFor(() =>
      expect(
        screen.getByText(/Posting date falls in a closed period/i)
      ).toBeInTheDocument()
    )
    expect(screen.queryByText(/\{"detail"/)).not.toBeInTheDocument()
  })
})

describe('ScheduleModal — custom curve', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockListAccounts.mockResolvedValue(ACCOUNTS)
    mockCreateSchedule.mockResolvedValue({
      structureId: 'struct_curve',
      name: 'x',
    })
  })

  const curveInput = (month: string) =>
    document.getElementById(`curve-${month}`) as HTMLInputElement

  const fillCurveFields = async () => {
    await waitForAccounts()
    change(/^name$/i, 'Software licence')
    change(/^method$/i, 'custom')
    change(/debit account/i, 'acct_exp')
    change(/credit account/i, 'acct_prepaid')
    change(/first period/i, '2026-01-01')
    change(/last period/i, '2026-03-31')
    change(/total to recognize/i, '300')
  }

  it('spreads the total evenly over the months, the last absorbing rounding', async () => {
    renderModal()
    await fillCurveFields()
    change(/total to recognize/i, '100')
    fireEvent.click(screen.getByRole('button', { name: /spread evenly/i }))
    expect(curveInput('2026-01')).toHaveValue(33.33)
    expect(curveInput('2026-02')).toHaveValue(33.33)
    expect(curveInput('2026-03')).toHaveValue(33.34)
    expect(createButton()).not.toBeDisabled()
  })

  it('refuses a curve that does not sum to the total, and sends one that does', async () => {
    const { onSaved } = renderModal()
    await fillCurveFields()
    expect(curveInput('2026-01')).toHaveValue(100)

    fireEvent.change(curveInput('2026-02'), { target: { value: '50' } })
    expect(createButton()).toBeDisabled()
    expect(screen.getByText(/off by/i)).toBeInTheDocument()

    fireEvent.change(curveInput('2026-03'), { target: { value: '150' } })
    expect(createButton()).not.toBeDisabled()
    fireEvent.click(createButton())

    await waitFor(() => expect(mockCreateSchedule).toHaveBeenCalledTimes(1))
    const [, payload] = mockCreateSchedule.mock.calls[0]
    expect(payload.monthly_amount).toBeUndefined()
    expect(payload.schedule_metadata).toMatchObject({
      method: 'custom',
      original_amount: 30000,
      periodic_amounts: [10000, 5000, 15000],
      loan_terms: null,
    })
    await waitFor(() => expect(onSaved).toHaveBeenCalledWith('struct_curve'))
  })

  it('refuses a negative month', async () => {
    renderModal()
    await fillCurveFields()
    fireEvent.change(curveInput('2026-02'), { target: { value: '-10' } })
    expect(createButton()).toBeDisabled()
    expect(screen.getByText(/zero or more/i)).toBeInTheDocument()
  })
})

describe('ScheduleModal — loan', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockListAccounts.mockResolvedValue(ACCOUNTS)
    mockCreateSchedule.mockResolvedValue({
      structureId: 'struct_loan',
      name: 'x',
    })
  })

  const fillLoanFields = async () => {
    await waitForAccounts()
    change(/^name$/i, 'Line of credit')
    change(/^method$/i, 'effective_interest')
    change(/first period/i, '2026-08-01')
    change(/last period/i, '2027-07-31')
    change(/interest expense account/i, 'acct_interest')
    change(/accrued interest or payable account/i, 'acct_ap')
    change(/principal drawn/i, '80000')
    change(/annual rate/i, '9.9')
    change(/draw date/i, '2026-08-05')
    change(/day count/i, 'actual/360')
    change(/note account/i, 'acct_note')
    fireEvent.click(screen.getByLabelText(/interest only/i))
  }

  it('sends the terms and the accrue-and-pay-through-the-bank legs', async () => {
    const { onSaved } = renderModal()
    await fillLoanFields()
    expect(createButton()).not.toBeDisabled()
    fireEvent.click(createButton())

    await waitFor(() => expect(mockCreateSchedule).toHaveBeenCalledTimes(1))
    const [, payload] = mockCreateSchedule.mock.calls[0]
    expect(payload.monthly_amount).toBeUndefined()
    expect(payload.element_ids).toEqual([
      'acct_interest',
      'acct_ap',
      'acct_note',
    ])
    expect(payload.entry_template).toMatchObject({
      debit_element_id: 'acct_interest',
      credit_element_id: 'acct_ap',
      legs: [
        {
          element_id: 'acct_interest',
          side: 'debit',
          amount_source: 'interest',
        },
        { element_id: 'acct_ap', side: 'credit', amount_source: 'interest' },
      ],
    })
    expect(payload.schedule_metadata).toMatchObject({
      method: 'effective_interest',
      periodic_amounts: null,
      loan_terms: {
        principal: 8000000,
        annual_rate: 0.099,
        start_date: '2026-08-05',
        day_count: 'actual/360',
        payment_frequency: 'monthly',
        interest_only: true,
        maturity_date: null,
        note_element_id: 'acct_note',
        current_portion_element_id: null,
      },
    })
    await waitFor(() => expect(onSaved).toHaveBeenCalledWith('struct_loan'))
  })

  it('books the whole payment when the schedule settles it', async () => {
    renderModal()
    await fillLoanFields()
    change(/^payment$/i, 'schedule')
    change(/cash or due-to account/i, 'acct_cash')
    fireEvent.click(createButton())

    await waitFor(() => expect(mockCreateSchedule).toHaveBeenCalledTimes(1))
    const [, payload] = mockCreateSchedule.mock.calls[0]
    expect(payload.entry_template.credit_element_id).toBe('acct_cash')
    expect(payload.entry_template.legs).toEqual([
      { element_id: 'acct_note', side: 'debit', amount_source: 'principal' },
      { element_id: 'acct_interest', side: 'debit', amount_source: 'interest' },
      { element_id: 'acct_cash', side: 'credit', amount_source: 'payment' },
    ])
  })

  it('refuses a draw date outside the first period', async () => {
    renderModal()
    await fillLoanFields()
    change(/draw date/i, '2026-07-28')
    expect(createButton()).toBeDisabled()
    expect(
      screen.getByText(/draw date must fall in the first period/i)
    ).toBeInTheDocument()
  })

  it('previews the roll-forward from the server before creating', async () => {
    mockPreviewSchedule.mockResolvedValue({
      envelope: { id: 'struct_preview' },
      roll_forward: [
        {
          period_start: '2026-08-01',
          period_end: '2026-08-31',
          opening: 80000,
          amount: 594,
          closing: 80000,
          scope: 'historical',
          interest: 594,
          payment: 0,
          principal: 0,
          current_portion: null,
        },
        {
          period_start: '2026-10-01',
          period_end: '2026-10-31',
          opening: 80000,
          amount: 682,
          closing: 80000,
          scope: 'in_scope',
          interest: 682,
          payment: 682,
          principal: 0,
          current_portion: null,
        },
      ],
      warnings: ['Old line posts the same accounts in 2026-10'],
      replaces: null,
    })
    renderModal()
    await fillLoanFields()
    fireEvent.click(previewButton())

    await waitFor(() => expect(mockPreviewSchedule).toHaveBeenCalledTimes(1))
    const [graphId, payload, replaces] = mockPreviewSchedule.mock.calls[0]
    expect(graphId).toBe('kg_test')
    expect(payload.schedule_metadata.loan_terms.day_count).toBe('actual/360')
    expect(replaces).toBeNull()

    expect(await screen.findByText('$594.00')).toBeInTheDocument()
    expect(screen.getAllByText('$682.00').length).toBe(2)
    expect(screen.getByText(/\(history\)/)).toBeInTheDocument()
    expect(
      screen.getByText(/Old line posts the same accounts/)
    ).toBeInTheDocument()
    expect(mockCreateSchedule).not.toHaveBeenCalled()

    // An edit invalidates the preview: it was of the definition before it.
    change(/annual rate/i, '10')
    expect(screen.queryByText('$594.00')).not.toBeInTheDocument()
  })
})

const straightLineEditing = (
  overrides: Partial<EditingSchedule['mechanics']> = {}
): EditingSchedule => ({
  structureId: 'struct_e',
  name: 'Prepaid Insurance Amortization',
  mechanics: {
    kind: 'closing_entry_generator',
    entry_template: {
      debit_element_id: 'acct_exp',
      credit_element_id: 'acct_prepaid',
      entry_type: 'adjusting',
      memo_template: 'Policy {structure_name}',
      auto_reverse: false,
      dimension_ids: [],
      legs: [],
    },
    schedule_metadata: {
      method: 'straight_line',
      loan_terms: null,
      original_amount: 2400000,
      residual_value: 0,
      useful_life_months: 12,
      asset_element_id: null,
      booked_on: null,
      periodic_amounts: null,
    },
    periods_with_entries: 0,
    period_start: '2026-01-01',
    period_end: '2026-12-31',
    monthly_amount: 200000,
    end_date: null,
    posted_periods: [],
    edit_warning: null,
    ...overrides,
  },
})

describe('ScheduleModal — edit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockListAccounts.mockResolvedValue(ACCOUNTS)
    mockRebuildSchedule.mockResolvedValue({
      structure_id: 'struct_e',
      total_periods: 18,
    })
    mockUpdateSchedule.mockResolvedValue({ id: 'struct_e' })
  })

  it('loads the definition into the form and saves it as a rebuild', async () => {
    const { onSaved, onClose } = renderModal(
      vi.fn(),
      vi.fn(),
      null,
      straightLineEditing()
    )
    await waitForAccounts()
    expect(screen.getByLabelText(/^name$/i)).toHaveValue(
      'Prepaid Insurance Amortization'
    )
    expect(screen.getByLabelText(/debit account/i)).toHaveValue('acct_exp')
    expect(screen.getByLabelText(/monthly amount/i)).toHaveValue(2000)
    expect(screen.getByLabelText(/last period/i)).toHaveValue('2026-12-31')
    expect(screen.getByLabelText(/entry type/i)).toHaveValue('adjusting')
    expect(screen.getByLabelText(/original cost/i)).toHaveValue(24000)

    change(/last period/i, '2027-06-30')
    change(/monthly amount/i, '1333.33')
    fireEvent.click(saveButton())

    await waitFor(() => expect(mockRebuildSchedule).toHaveBeenCalledTimes(1))
    const [graphId, structureId, edit] = mockRebuildSchedule.mock.calls[0]
    expect(graphId).toBe('kg_test')
    expect(structureId).toBe('struct_e')
    expect(edit).toMatchObject({
      period_start: '2026-01-01',
      period_end: '2027-06-30',
      monthly_amount: 133333,
      entry_template: {
        debit_element_id: 'acct_exp',
        credit_element_id: 'acct_prepaid',
        entry_type: 'adjusting',
        memo_template: 'Policy {structure_name}',
      },
      schedule_metadata: {
        method: 'straight_line',
        original_amount: 2400000,
        useful_life_months: 12,
      },
    })
    expect(edit.name).toBeUndefined()
    expect(mockUpdateSchedule).not.toHaveBeenCalled()
    await waitFor(() => expect(onSaved).toHaveBeenCalledWith('struct_e'))
    expect(onClose).toHaveBeenCalled()
  })

  it('renames through update-schedule after the rebuild', async () => {
    renderModal(vi.fn(), vi.fn(), null, straightLineEditing())
    await waitForAccounts()
    change(/^name$/i, 'Prepaid D&O insurance')
    fireEvent.click(saveButton())

    await waitFor(() => expect(mockRebuildSchedule).toHaveBeenCalledTimes(1))
    await waitFor(() =>
      expect(mockUpdateSchedule).toHaveBeenCalledWith('kg_test', 'struct_e', {
        name: 'Prepaid D&O insurance',
      })
    )
  })

  it('previews an edit against the schedule it replaces', async () => {
    mockPreviewSchedule.mockResolvedValue({
      envelope: { id: 'struct_e' },
      roll_forward: [],
      warnings: [],
      replaces: {
        structure_id: 'struct_e',
        name: 'Prepaid Insurance Amortization',
        posted_entry_count: 0,
        posted_periods: [],
        draft_entry_count: 2,
        path: 'rebuild',
      },
    })
    renderModal(vi.fn(), vi.fn(), null, straightLineEditing())
    await waitForAccounts()
    fireEvent.click(previewButton())

    await waitFor(() => expect(mockPreviewSchedule).toHaveBeenCalledTimes(1))
    expect(mockPreviewSchedule.mock.calls[0][2]).toBe('struct_e')
    expect(
      await screen.findByText(/saving rebuilds the schedule in place/i)
    ).toBeInTheDocument()
  })

  it('locks the save once a month has posted, and says why', async () => {
    renderModal(
      vi.fn(),
      vi.fn(),
      null,
      straightLineEditing({
        posted_periods: ['2026-01', '2026-02'],
        edit_warning:
          '2 months of this schedule have posted (2026-01, 2026-02). It can no longer be deleted or rebuilt.',
      })
    )
    await waitForAccounts()
    expect(
      screen.getByText(/2 months of this schedule have posted/)
    ).toBeInTheDocument()
    expect(saveButton()).toBeDisabled()
    // The preview still runs, so the person can see the path the change takes.
    expect(previewButton()).not.toBeDisabled()
  })

  it('reads the bounds and the amount from the facts for a schedule stored before the definition rode the envelope', async () => {
    renderModal(vi.fn(), vi.fn(), null, {
      ...straightLineEditing({
        period_start: null,
        period_end: null,
        monthly_amount: null,
      }),
      fallback: {
        periodStart: '2025-07-01',
        periodEnd: '2026-06-30',
        monthlyAmountCents: 12500,
      },
    })
    await waitForAccounts()
    expect(screen.getByLabelText(/first period/i)).toHaveValue('2025-07-01')
    expect(screen.getByLabelText(/last period/i)).toHaveValue('2026-06-30')
    expect(screen.getByLabelText(/monthly amount/i)).toHaveValue(125)
  })

  it('loads a loan back with its terms and settlement', async () => {
    renderModal(vi.fn(), vi.fn(), null, {
      structureId: 'struct_l',
      name: 'Line of credit',
      mechanics: {
        kind: 'closing_entry_generator',
        entry_template: {
          debit_element_id: 'acct_interest',
          credit_element_id: 'acct_cash',
          entry_type: 'closing',
          memo_template: '',
          auto_reverse: false,
          dimension_ids: [],
          legs: [
            {
              element_id: 'acct_note',
              side: 'debit',
              amount_source: 'principal',
            },
            {
              element_id: 'acct_interest',
              side: 'debit',
              amount_source: 'interest',
            },
            {
              element_id: 'acct_cash',
              side: 'credit',
              amount_source: 'payment',
            },
          ],
        },
        schedule_metadata: {
          method: 'effective_interest',
          loan_terms: {
            principal: 8000000,
            annual_rate: 0.099,
            start_date: '2026-08-05',
            day_count: 'actual/360',
            payment_frequency: 'monthly',
            first_payment_date: null,
            payment_amount: null,
            interest_only: true,
            maturity_date: null,
            capitalize_interest: false,
            note_element_id: 'acct_note',
            current_portion_element_id: null,
          },
          original_amount: 0,
          residual_value: 0,
          useful_life_months: 0,
          asset_element_id: null,
          booked_on: null,
          periodic_amounts: null,
        },
        periods_with_entries: 0,
        period_start: '2026-08-01',
        period_end: '2027-07-31',
        monthly_amount: 0,
        end_date: null,
        posted_periods: [],
        edit_warning: null,
      },
    })
    await waitForAccounts()
    expect(screen.getByLabelText(/^method$/i)).toHaveValue('effective_interest')
    expect(screen.getByLabelText(/principal drawn/i)).toHaveValue(80000)
    expect(screen.getByLabelText(/annual rate/i)).toHaveValue(9.9)
    expect(screen.getByLabelText(/day count/i)).toHaveValue('actual/360')
    expect(screen.getByLabelText(/interest only/i)).toBeChecked()
    expect(screen.getByLabelText(/note account/i)).toHaveValue('acct_note')
    expect(screen.getByLabelText(/^payment$/i)).toHaveValue('schedule')
    expect(screen.getByLabelText(/cash or due-to account/i)).toHaveValue(
      'acct_cash'
    )
    expect(saveButton()).not.toBeDisabled()
  })
})
