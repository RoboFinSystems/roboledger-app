import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockListAccounts = vi.fn()
const mockCreateJournalEntry = vi.fn()
const mockUpdateJournalEntry = vi.fn()
const mockGetEventBlock = vi.fn()

vi.mock('@robosystems/core', () => ({
  clients: {
    ledger: {
      listAccounts: (...args: any[]) => mockListAccounts(...args),
      createJournalEntry: (...args: any[]) => mockCreateJournalEntry(...args),
      updateJournalEntry: (...args: any[]) => mockUpdateJournalEntry(...args),
      getEventBlock: (...args: any[]) => mockGetEventBlock(...args),
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

vi.mock('react-icons/hi', () => ({
  HiPlus: () => <span />,
  HiTrash: () => <span />,
}))

import { NewJournalEntryModal } from '../NewJournalEntryModal'

const ACCOUNTS = {
  accounts: [
    { id: 'acct_cash', code: '1000', name: 'Cash' },
    { id: 'acct_rev', code: '4000', name: 'Revenue' },
    { id: 'acct_ar', code: '1200', name: 'Accounts Receivable' },
  ],
}

const renderModal = (onCreated = vi.fn(), onClose = vi.fn()) => {
  render(
    <NewJournalEntryModal
      graphId="kg_test"
      open
      onClose={onClose}
      onCreated={onCreated}
    />
  )
  return { onCreated, onClose }
}

// The submit button is labelled by the selected status: "Save Draft" by
// default, "Post Entry" when posting.
const submitButton = () =>
  screen.getByRole('button', { name: /save draft|post entry|submitting/i })

/** Fill one line: account select, then debit or credit. */
function fillLine(
  idx: number,
  accountId: string,
  side: 'debit' | 'credit',
  amount: string
) {
  fireEvent.change(document.getElementById(`line-account-${idx}`)!, {
    target: { value: accountId },
  })
  fireEvent.change(document.getElementById(`line-${side}-${idx}`)!, {
    target: { value: amount },
  })
}

function fillMemo(text = 'Test entry') {
  fireEvent.change(document.getElementById('je-memo')!, {
    target: { value: text },
  })
}

/** A balanced two-line entry: DR cash / CR revenue for the same amount. */
async function fillBalancedEntry(amount = '100.00') {
  await waitFor(() => expect(mockListAccounts).toHaveBeenCalled())
  await screen.findAllByText('1000 — Cash')
  fillMemo()
  fillLine(0, 'acct_cash', 'debit', amount)
  fillLine(1, 'acct_rev', 'credit', amount)
}

describe('NewJournalEntryModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockListAccounts.mockResolvedValue(ACCOUNTS)
    mockCreateJournalEntry.mockResolvedValue({ id: 'txn_1' })
  })

  describe('amount handling', () => {
    it('submits amounts in cents, not dollars', async () => {
      renderModal()
      await fillBalancedEntry('1525.50')

      fireEvent.click(submitButton())

      await waitFor(() => expect(mockCreateJournalEntry).toHaveBeenCalled())
      const [, body] = mockCreateJournalEntry.mock.calls[0]
      // $1,525.50 is 152550 cents. Sending 1525.5 would post a 100x-small entry.
      expect(body.lineItems[0].debitAmount).toBe(152550)
      expect(body.lineItems[1].creditAmount).toBe(152550)
    })

    it('rounds sub-cent input rather than truncating it', async () => {
      renderModal()
      await fillBalancedEntry('0.005')

      // 0.005 * 100 = 0.5, which must round to 1 cent on both sides so the
      // entry still balances.
      fireEvent.click(submitButton())
      await waitFor(() => expect(mockCreateJournalEntry).toHaveBeenCalled())
      const [, body] = mockCreateJournalEntry.mock.calls[0]
      expect(body.lineItems[0].debitAmount).toBe(1)
    })

    it('avoids float drift on amounts that are not exactly representable', async () => {
      renderModal()
      await fillBalancedEntry('1.15')

      // 1.15 * 100 is 114.99999999999999 in IEEE 754; without rounding this
      // would post 114 cents.
      fireEvent.click(submitButton())
      await waitFor(() => expect(mockCreateJournalEntry).toHaveBeenCalled())
      const [, body] = mockCreateJournalEntry.mock.calls[0]
      expect(body.lineItems[0].debitAmount).toBe(115)
    })

    it('omits the unused side rather than sending a zero', async () => {
      renderModal()
      await fillBalancedEntry()

      fireEvent.click(submitButton())
      await waitFor(() => expect(mockCreateJournalEntry).toHaveBeenCalled())
      const [, body] = mockCreateJournalEntry.mock.calls[0]
      expect(body.lineItems[0].debitAmount).toBe(10000)
      expect(body.lineItems[0].creditAmount).toBeUndefined()
      expect(body.lineItems[1].creditAmount).toBe(10000)
      expect(body.lineItems[1].debitAmount).toBeUndefined()
    })
  })

  describe('balance gate', () => {
    it('blocks submission while debits and credits differ', async () => {
      renderModal()
      await waitFor(() => expect(mockListAccounts).toHaveBeenCalled())
      await screen.findAllByText('1000 — Cash')
      fillMemo()
      fillLine(0, 'acct_cash', 'debit', '100.00')
      fillLine(1, 'acct_rev', 'credit', '99.99')

      expect(submitButton()).toBeDisabled()
      fireEvent.click(submitButton())
      expect(mockCreateJournalEntry).not.toHaveBeenCalled()
    })

    it('allows submission once the entry balances', async () => {
      renderModal()
      await fillBalancedEntry()
      expect(submitButton()).not.toBeDisabled()
    })

    it('blocks a line carrying both a debit and a credit', async () => {
      renderModal()
      await waitFor(() => expect(mockListAccounts).toHaveBeenCalled())
      await screen.findAllByText('1000 — Cash')
      fillMemo()
      // Totals tie at 100/100, but line 0 has both sides populated — which is
      // not a valid journal line even though the entry balances.
      fillLine(0, 'acct_cash', 'debit', '100.00')
      fireEvent.change(document.getElementById('line-credit-0')!, {
        target: { value: '50.00' },
      })
      fillLine(1, 'acct_rev', 'credit', '50.00')

      expect(submitButton()).toBeDisabled()
    })

    it('blocks an entry with no amounts at all', async () => {
      renderModal()
      await waitFor(() => expect(mockListAccounts).toHaveBeenCalled())
      await screen.findAllByText('1000 — Cash')
      fillMemo()
      fireEvent.change(document.getElementById('line-account-0')!, {
        target: { value: 'acct_cash' },
      })
      fireEvent.change(document.getElementById('line-account-1')!, {
        target: { value: 'acct_rev' },
      })

      // diff === 0 is satisfied by 0 === 0, so the balance check alone would
      // let an empty entry through; the per-line check has to catch it.
      expect(submitButton()).toBeDisabled()
    })

    it('blocks submission when a line has no account selected', async () => {
      renderModal()
      await waitFor(() => expect(mockListAccounts).toHaveBeenCalled())
      await screen.findAllByText('1000 — Cash')
      fillMemo()
      fireEvent.change(document.getElementById('line-debit-0')!, {
        target: { value: '100.00' },
      })
      fireEvent.change(document.getElementById('line-credit-1')!, {
        target: { value: '100.00' },
      })

      expect(submitButton()).toBeDisabled()
    })

    it('blocks submission without a memo', async () => {
      renderModal()
      await waitFor(() => expect(mockListAccounts).toHaveBeenCalled())
      await screen.findAllByText('1000 — Cash')
      fillLine(0, 'acct_cash', 'debit', '100.00')
      fillLine(1, 'acct_rev', 'credit', '100.00')

      expect(submitButton()).toBeDisabled()
    })
  })

  describe('submission', () => {
    it('sends the entry against the given graph and closes on success', async () => {
      const onCreated = vi.fn()
      const onClose = vi.fn()
      renderModal(onCreated, onClose)
      await fillBalancedEntry()

      fireEvent.click(submitButton())

      await waitFor(() => expect(onCreated).toHaveBeenCalled())
      expect(mockCreateJournalEntry).toHaveBeenCalledWith(
        'kg_test',
        expect.objectContaining({ source: 'manual', memo: 'Test entry' })
      )
      expect(onClose).toHaveBeenCalled()
    })

    it('surfaces a server error without closing the form', async () => {
      mockCreateJournalEntry.mockRejectedValue(
        new Error('Period 2026-01 is closed')
      )
      const onCreated = vi.fn()
      const onClose = vi.fn()
      renderModal(onCreated, onClose)
      await fillBalancedEntry()

      fireEvent.click(submitButton())

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'Period 2026-01 is closed'
      )
      // The user's work must survive the failure so they can retry.
      expect(onClose).not.toHaveBeenCalled()
      expect(onCreated).not.toHaveBeenCalled()
    })
  })

  describe('editing a draft', () => {
    const DRAFT = {
      id: 'je_draft',
      postingDate: '2026-09-30',
      memo: 'Accrue September rent',
      type: 'adjusting',
      triggeredByEventId: 'evt_1',
      // Dollars, as the journal list carries them.
      lineItems: [
        {
          accountId: 'acct_ar',
          debitAmount: 1525.5,
          creditAmount: 0,
          description: 'Rent',
        },
        {
          accountId: 'acct_rev',
          debitAmount: 0,
          creditAmount: 1525.5,
          description: null,
        },
      ],
    }

    const renderEdit = (onCreated = vi.fn(), onClose = vi.fn()) => {
      render(
        <NewJournalEntryModal
          graphId="kg_test"
          open
          draft={DRAFT}
          onClose={onClose}
          onCreated={onCreated}
        />
      )
      return { onCreated, onClose }
    }

    beforeEach(() => {
      mockUpdateJournalEntry.mockResolvedValue({ id: 'je_draft' })
      mockGetEventBlock.mockResolvedValue({ id: 'evt_1', status: 'classified' })
    })

    it('leaves the lines alone when only the header changed', async () => {
      // The API replaces the whole line set, and the form cannot carry a
      // line's flow tag, so unchanged lines are not sent back.
      renderEdit()
      await waitFor(() => expect(mockListAccounts).toHaveBeenCalled())
      await screen.findAllByText('1200 — Accounts Receivable')
      fillMemo('Accrue September rent, corrected')
      fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }))
      await waitFor(() => expect(mockUpdateJournalEntry).toHaveBeenCalled())
      const [, body] = mockUpdateJournalEntry.mock.calls[0]
      expect(body.memo).toBe('Accrue September rent, corrected')
      expect(body).not.toHaveProperty('line_items')
    })

    it('refuses to edit a draft whose event was voided', async () => {
      mockGetEventBlock.mockResolvedValue({ id: 'evt_1', status: 'voided' })
      renderEdit()
      expect(await screen.findByRole('alert')).toHaveTextContent(
        'close will not post it'
      )
      expect(
        screen.getByRole('button', { name: 'Save Changes' })
      ).toBeDisabled()
    })

    it('holds Save until the draft\u2019s event is checked', async () => {
      let resolveEvent: (v: unknown) => void = () => {}
      mockGetEventBlock.mockReturnValue(
        new Promise((r) => {
          resolveEvent = r
        })
      )
      renderEdit()
      await screen.findAllByText('1200 — Accounts Receivable')
      expect(
        screen.getByRole('button', { name: 'Save Changes' })
      ).toBeDisabled()
      resolveEvent({ id: 'evt_1', status: 'classified' })
      await waitFor(() =>
        expect(
          screen.getByRole('button', { name: 'Save Changes' })
        ).not.toBeDisabled()
      )
    })

    it('refuses to save when the chart did not load', async () => {
      mockListAccounts.mockRejectedValue(new Error('boom'))
      renderEdit()
      expect(await screen.findByRole('alert')).toHaveTextContent(
        'the chart did not load'
      )
      expect(
        screen.getByRole('button', { name: 'Save Changes' })
      ).toBeDisabled()
    })

    it('refuses a line whose account the picker cannot show', async () => {
      mockListAccounts.mockResolvedValue({
        accounts: ACCOUNTS.accounts.filter((a) => a.id !== 'acct_ar'),
      })
      renderEdit()
      expect(await screen.findByRole('alert')).toHaveTextContent('cannot show')
      expect(
        screen.getByRole('button', { name: 'Save Changes' })
      ).toBeDisabled()
    })

    it('loads the draft into the form and keeps it a draft', async () => {
      renderEdit()
      expect(screen.getByText('Edit Draft')).toBeInTheDocument()
      expect(
        (document.getElementById('je-memo') as HTMLInputElement).value
      ).toBe('Accrue September rent')
      expect(
        (document.getElementById('line-debit-0') as HTMLInputElement).value
      ).toBe('1525.50')
      // Close posts a draft; the edit form never does.
      expect(document.getElementById('je-status')).toBeNull()
      expect(
        screen.getByRole('button', { name: 'Save Changes' })
      ).toBeInTheDocument()
    })

    it('saves the whole draft back in cents, without creating one', async () => {
      const { onCreated, onClose } = renderEdit()
      await waitFor(() => expect(mockListAccounts).toHaveBeenCalled())
      fillLine(0, 'acct_ar', 'debit', '1600')
      fillLine(1, 'acct_rev', 'credit', '1600')

      fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }))

      await waitFor(() => expect(mockUpdateJournalEntry).toHaveBeenCalled())
      expect(mockCreateJournalEntry).not.toHaveBeenCalled()
      const [graphId, body] = mockUpdateJournalEntry.mock.calls[0]
      expect(graphId).toBe('kg_test')
      expect(body).toEqual({
        entry_id: 'je_draft',
        posting_date: '2026-09-30',
        memo: 'Accrue September rent',
        type: 'adjusting',
        line_items: [
          {
            element_id: 'acct_ar',
            debit_amount: 160000,
            credit_amount: 0,
            description: 'Rent',
          },
          {
            element_id: 'acct_rev',
            debit_amount: 0,
            credit_amount: 160000,
            description: null,
          },
        ],
      })
      expect(onCreated).toHaveBeenCalled()
      expect(onClose).toHaveBeenCalled()
    })

    it('shows a refusal in plain words and keeps the form open', async () => {
      mockUpdateJournalEntry.mockRejectedValue(
        new Error(
          'Update journal entry failed: {"detail":"Journal entry je_draft is being written by another process. Retry in a moment."}'
        )
      )
      const { onClose } = renderEdit()
      await waitFor(() => expect(mockListAccounts).toHaveBeenCalled())
      fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }))
      expect(await screen.findByRole('alert')).toHaveTextContent(
        'Another process (usually a running sync) is writing this right now.'
      )
      expect(onClose).not.toHaveBeenCalled()
    })
  })
})
