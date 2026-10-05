import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockPreviewEventBlock = vi.fn()
const mockReverseJournalEntry = vi.fn()

vi.mock('@robosystems/core', () => ({
  clients: {
    ledger: {
      previewEventBlock: (...args: any[]) => mockPreviewEventBlock(...args),
      reverseJournalEntry: (...args: any[]) => mockReverseJournalEntry(...args),
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
  TextInput: ({ id, value, onChange, type, placeholder }: any) => (
    <input
      id={id}
      value={value}
      onChange={onChange}
      type={type}
      placeholder={placeholder}
    />
  ),
}))

import { ReverseEntryModal } from '../ReverseEntryModal'

const ENTRY = {
  id: 'je_rent',
  number: null,
  postingDate: '2026-09-30',
  memo: 'September rent',
  lineItems: [
    {
      id: 'li_1',
      accountId: 'el_rent',
      accountName: 'Rent Expense',
      accountCode: '6200',
      debitAmount: 2500,
      creditAmount: 0,
      description: null,
    },
    {
      id: 'li_2',
      accountId: 'el_cash',
      accountName: 'Cash',
      accountCode: '1000',
      debitAmount: 0,
      creditAmount: 2500,
      description: null,
    },
  ],
}

const postButton = () => screen.getByRole('button', { name: 'Post Reversal' })

const renderModal = (onReversed = vi.fn(), onClose = vi.fn()) => {
  render(
    <ReverseEntryModal
      graphId="kg_1"
      entry={ENTRY}
      onClose={onClose}
      onReversed={onReversed}
    />
  )
  return { onReversed, onClose }
}

const setDate = (value: string) =>
  fireEvent.change(document.getElementById('reverse-date')!, {
    target: { value },
  })

describe('ReverseEntryModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPreviewEventBlock.mockResolvedValue({
      would_succeed: true,
      validation_errors: [],
    })
    mockReverseJournalEntry.mockResolvedValue({ id: 'evt_rev' })
  })

  it('shows every line with its sides swapped', () => {
    renderModal()
    const rentRow = screen.getByText('Rent Expense').closest('tr')!
    const cells = rentRow.querySelectorAll('td')
    // Rent was a debit; the reversal credits it.
    expect(cells[1]).toHaveTextContent('-')
    expect(cells[2]).toHaveTextContent('$2,500.00')
  })

  it('checks the same request it would send, for the date chosen', async () => {
    renderModal()
    setDate('2026-10-01')
    await waitFor(() =>
      expect(mockPreviewEventBlock).toHaveBeenLastCalledWith(
        'kg_1',
        expect.objectContaining({
          event_type: 'journal_entry_reversed',
          occurred_at: '2026-10-01T00:00:00Z',
          metadata: { entry_id: 'je_rent', posting_date: '2026-10-01' },
        })
      )
    )
  })

  it('posts nothing until the preview says it would succeed', async () => {
    mockPreviewEventBlock.mockResolvedValue({
      would_succeed: false,
      validation_errors: ['Period 2026-09 is closed.'],
    })
    renderModal()
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Period 2026-09 is closed.'
    )
    expect(postButton()).toBeDisabled()
  })

  it('says a closed reversal date in this dialog’s terms', async () => {
    mockPreviewEventBlock.mockResolvedValue({
      would_succeed: false,
      validation_errors: [
        "Cannot write to closed period '2026-07' (posting_date=2026-07-15). Reopen the period first if an adjustment is needed.",
      ],
    })
    renderModal()
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(
      'That date is in a closed month. Pick a reversal date in an open one.'
    )
    expect(alert).not.toHaveTextContent('posting_date')
    expect(postButton()).toBeDisabled()
  })

  it('reverses with the date, memo and reason given', async () => {
    const { onReversed, onClose } = renderModal()
    setDate('2026-10-01')
    fireEvent.change(document.getElementById('reverse-reason')!, {
      target: { value: 'Paid twice' },
    })
    await waitFor(() => expect(postButton()).not.toBeDisabled())

    fireEvent.click(postButton())

    await waitFor(() => expect(onReversed).toHaveBeenCalled())
    expect(mockReverseJournalEntry).toHaveBeenCalledWith('kg_1', 'je_rent', {
      postingDate: '2026-10-01',
      memo: null,
      reason: 'Paid twice',
    })
    expect(onClose).toHaveBeenCalled()
  })

  it('shows a refusal at post time without closing', async () => {
    mockReverseJournalEntry.mockRejectedValue(
      new Error(
        'Reverse journal entry failed: {"detail":"Journal entry je_rent already has a reversing entry (je_x); an entry is reversed at most once."}'
      )
    )
    const { onClose } = renderModal()
    await waitFor(() => expect(postButton()).not.toBeDisabled())
    fireEvent.click(postButton())
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'an entry is reversed at most once'
    )
    expect(onClose).not.toHaveBeenCalled()
  })

  it('posts nothing once the date is cleared', async () => {
    renderModal()
    await waitFor(() => expect(postButton()).not.toBeDisabled())
    setDate('')
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Choose a reversal date.'
    )
    expect(postButton()).toBeDisabled()
  })
})
