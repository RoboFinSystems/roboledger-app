import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockUpdateTaxonomyBlock = vi.fn()
const mockGetFiscalCalendar = vi.fn()

vi.mock('@robosystems/core', () => ({
  clients: {
    ledger: {
      updateTaxonomyBlock: (...args: any[]) => mockUpdateTaxonomyBlock(...args),
      getFiscalCalendar: (...args: any[]) => mockGetFiscalCalendar(...args),
    },
  },
}))

vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}))

vi.mock('flowbite-react', () => ({
  Alert: ({ children }: any) => <div role="alert">{children}</div>,
  Button: ({ children, onClick, disabled, type }: any) => (
    <button type={type ?? 'button'} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
  Label: ({ children, htmlFor }: any) => (
    <label htmlFor={htmlFor}>{children}</label>
  ),
  Modal: ({ children }: any) => <div>{children}</div>,
  ModalBody: ({ children }: any) => <div>{children}</div>,
  ModalFooter: ({ children }: any) => <div>{children}</div>,
  ModalHeader: ({ children }: any) => <h2>{children}</h2>,
  Select: ({ children, sizing: _s, ...props }: any) => (
    <select {...props}>{children}</select>
  ),
  TextInput: ({ sizing: _s, ...props }: any) => <input {...props} />,
}))

import type { ChartAccount, EditableChart } from '../chartEditing'
import AccountEditorModal from '../components/AccountEditorModal'

const account = (
  id: string,
  overrides: Partial<ChartAccount> = {}
): ChartAccount => ({
  id,
  qname: `coa:${id}`,
  code: null,
  name: id,
  classification: 'expense',
  balanceType: 'debit',
  parentId: null,
  isActive: true,
  ...overrides,
})

const rent = account('rent', { code: '6100', name: 'Rent' })
const occupancy = account('occ', { code: '6000', name: 'Occupancy' })
const chart: EditableChart = {
  taxonomyId: 'tax_a',
  prefix: 'coa',
  accounts: [
    rent,
    occupancy,
    account('cash', { classification: 'asset', code: '1000', name: 'Cash' }),
  ],
}

const renderModal = (
  props: Partial<React.ComponentProps<typeof AccountEditorModal>> = {}
) => {
  const onSaved = vi.fn()
  const onClose = vi.fn()
  render(
    <AccountEditorModal
      graphId="kg_a"
      entityId="ent_sub"
      chart={chart}
      account={null}
      onClose={onClose}
      onSaved={onSaved}
      {...props}
    />
  )
  return { onSaved, onClose }
}

describe('AccountEditorModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUpdateTaxonomyBlock.mockResolvedValue({})
    mockGetFiscalCalendar.mockResolvedValue({ closedThrough: '2026-09' })
  })

  it('adds an account under a parent of its class', async () => {
    const { onSaved } = renderModal()
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Utilities' },
    })
    fireEvent.change(screen.getByLabelText('Code (optional)'), {
      target: { value: '6150' },
    })
    const parent = screen.getByLabelText('Sub-account of') as HTMLSelectElement
    expect(Array.from(parent.options).map((o) => o.textContent)).toEqual([
      'None (top level)',
      '6000 Occupancy',
      '6100 Rent',
    ])
    fireEvent.change(parent, { target: { value: 'occ' } })
    fireEvent.click(screen.getByText('Add account', { selector: 'button' }))
    await waitFor(() =>
      expect(mockUpdateTaxonomyBlock).toHaveBeenCalledWith('kg_a', {
        taxonomy_id: 'tax_a',
        elements_to_add: [
          {
            qname: 'coa:6150',
            name: 'Utilities',
            trait: 'expense',
            balance_type: 'debit',
            period_type: 'duration',
            code: '6150',
            parent_ref: 'coa:occ',
          },
        ],
      })
    )
    expect(onSaved).toHaveBeenCalledWith('Added Utilities.')
  })

  it('refuses a code another account uses', () => {
    renderModal()
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'X' } })
    fireEvent.change(screen.getByLabelText('Code (optional)'), {
      target: { value: '6100' },
    })
    expect(screen.getByText('Rent already uses 6100.')).toBeInTheDocument()
    expect(
      (
        screen.getByText('Add account', {
          selector: 'button',
        }) as HTMLButtonElement
      ).disabled
    ).toBe(true)
  })

  it('a rename saves at once, sending only the name', async () => {
    const { onSaved } = renderModal({ account: rent })
    const save = screen.getByText('Save') as HTMLButtonElement
    expect(save.disabled).toBe(true)
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Office rent' },
    })
    fireEvent.click(save)
    await waitFor(() =>
      expect(mockUpdateTaxonomyBlock).toHaveBeenCalledWith('kg_a', {
        taxonomy_id: 'tax_a',
        elements_to_update: [{ qname: 'coa:rent', name: 'Office rent' }],
      })
    )
    expect(onSaved).toHaveBeenCalledWith('Saved Office rent.')
  })

  it('a reclassification waits behind a confirm naming the closed months', async () => {
    renderModal({ account: rent })
    await waitFor(() =>
      expect(mockGetFiscalCalendar).toHaveBeenCalledWith('kg_a', {
        entityId: 'ent_sub',
      })
    )
    fireEvent.change(screen.getByLabelText('Classification'), {
      target: { value: 'asset' },
    })
    fireEvent.click(screen.getByText('Review change'))
    expect(mockUpdateTaxonomyBlock).not.toHaveBeenCalled()
    expect(
      await screen.findByText(/closed through September 2026/)
    ).toBeInTheDocument()
    expect(screen.getByText('Expense (debit)')).toBeInTheDocument()
    expect(screen.getByText('Asset (debit)')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Reclassify', { selector: 'button' }))
    await waitFor(() =>
      expect(mockUpdateTaxonomyBlock).toHaveBeenCalledWith('kg_a', {
        taxonomy_id: 'tax_a',
        elements_to_update: [
          { qname: 'coa:rent', trait: 'asset', period_type: 'instant' },
        ],
      })
    )
  })

  it('shows the closed-history refusal in words, with the way out', async () => {
    mockUpdateTaxonomyBlock.mockRejectedValue(
      new Error(
        'Update taxonomy block failed: ' +
          JSON.stringify({
            detail:
              '1 taxonomy block validation issue(s): [validation/protected_facts] refusing to disturb facts that the ledger treats as immutable: 2 canonical statement set(s) of closed period(s) 2026-08–2026-09 were computed through the mapping arcs or element attributes this change alters (reopen latest-first down to 2026-08 — closed history is immutable)',
          })
      )
    )
    const { onSaved } = renderModal({ account: rent })
    fireEvent.change(screen.getByLabelText('Normal balance'), {
      target: { value: 'credit' },
    })
    fireEvent.click(screen.getByText('Review change'))
    fireEvent.click(
      await screen.findByText('Reclassify', { selector: 'button' })
    )
    expect(
      await screen.findByText(/closed months \(Aug 2026 to Sep 2026\)/)
    ).toBeInTheDocument()
    expect(screen.getByText('Open close page').getAttribute('href')).toBe(
      '/ledger/close'
    )
    expect(onSaved).not.toHaveBeenCalled()
  })

  it('retires an account, and reactivates a retired one', async () => {
    const { onSaved } = renderModal({ account: rent })
    fireEvent.click(screen.getByText('Retire…'))
    expect(screen.getByText(/Its history stays/)).toBeInTheDocument()
    fireEvent.click(screen.getByText('Retire account'))
    await waitFor(() =>
      expect(mockUpdateTaxonomyBlock).toHaveBeenCalledWith('kg_a', {
        taxonomy_id: 'tax_a',
        elements_to_update: [{ qname: 'coa:rent', is_active: false }],
      })
    )
    expect(onSaved).toHaveBeenCalledWith('Retired Rent.')
  })

  it('opens on the reactivate confirm for a retired account', async () => {
    renderModal({
      account: { ...rent, isActive: false },
      initialStep: 'retire',
    })
    fireEvent.click(screen.getByText('Reactivate account'))
    await waitFor(() =>
      expect(mockUpdateTaxonomyBlock).toHaveBeenCalledWith('kg_a', {
        taxonomy_id: 'tax_a',
        elements_to_update: [{ qname: 'coa:rent', is_active: true }],
      })
    )
  })

  it('never says nothing is closed when the calendar is not known', async () => {
    mockGetFiscalCalendar.mockRejectedValue(new Error('network'))
    renderModal({ account: rent })
    await waitFor(() => expect(mockGetFiscalCalendar).toHaveBeenCalled())
    fireEvent.change(screen.getByLabelText('Normal balance'), {
      target: { value: 'credit' },
    })
    fireEvent.click(screen.getByText('Review change'))
    expect(
      await screen.findByText(/If Rent has posted lines in a closed month/)
    ).toBeInTheDocument()
    expect(screen.queryByText(/No month is closed yet/)).toBeNull()
  })

  it('says nothing is closed only when the calendar says so', async () => {
    mockGetFiscalCalendar.mockResolvedValue({ closedThrough: null })
    renderModal({ account: rent })
    await waitFor(() => expect(mockGetFiscalCalendar).toHaveBeenCalled())
    fireEvent.change(screen.getByLabelText('Normal balance'), {
      target: { value: 'credit' },
    })
    fireEvent.click(screen.getByText('Review change'))
    expect(
      await screen.findByText(/No month is closed yet/)
    ).toBeInTheDocument()
  })

  it('will not reactivate into a code another account took', () => {
    renderModal({
      account: { ...occupancy, id: 'old', code: '6100', isActive: false },
      initialStep: 'retire',
    })
    expect(screen.getByText(/Rent uses 6100 now/)).toBeInTheDocument()
    expect(
      (screen.getByText('Reactivate account') as HTMLButtonElement).disabled
    ).toBe(true)
  })

  it('keeps the parent when the classification comes back', async () => {
    const child = account('sub', {
      name: 'Sub',
      code: '6110',
      parentId: 'occ',
    })
    renderModal({ account: child })
    const cls = screen.getByLabelText('Classification')
    fireEvent.change(cls, { target: { value: 'asset' } })
    expect(
      (screen.getByLabelText('Sub-account of') as HTMLSelectElement).value
    ).toBe('')
    fireEvent.change(cls, { target: { value: 'expense' } })
    expect(
      (screen.getByLabelText('Sub-account of') as HTMLSelectElement).value
    ).toBe('occ')
    expect((screen.getByText('Save') as HTMLButtonElement).disabled).toBe(true)
  })

  it('says what retiring does to the sub-accounts', () => {
    const c = {
      ...chart,
      accounts: [
        ...chart.accounts,
        account('sub', { parentId: 'occ', name: 'Sub' }),
      ],
    }
    renderModal({ chart: c, account: occupancy, initialStep: 'retire' })
    expect(
      screen.getByText(/Its 1 sub-account stays active/)
    ).toBeInTheDocument()
  })
})
