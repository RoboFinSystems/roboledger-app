import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockUpdateEventBlock = vi.fn()
const mockDeleteJournalEntry = vi.fn()

vi.mock('@robosystems/core', () => ({
  clients: {
    ledger: {
      updateEventBlock: (...args: any[]) => mockUpdateEventBlock(...args),
      deleteJournalEntry: (...args: any[]) => mockDeleteJournalEntry(...args),
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
  Modal: ({ children, show }: any) => (show ? <div>{children}</div> : null),
  ModalBody: ({ children }: any) => <div>{children}</div>,
  ModalFooter: ({ children }: any) => <div>{children}</div>,
  ModalHeader: ({ children }: any) => <h3>{children}</h3>,
}))

import { DeleteDraftModal } from '../DeleteDraftModal'

const DRAFT = {
  id: 'je_draft',
  number: null,
  postingDate: '2026-09-30',
  memo: 'Accrue September rent',
  triggeredByEventId: 'evt_1',
}

const renderModal = (onDeleted = vi.fn(), onClose = vi.fn()) => {
  render(
    <DeleteDraftModal
      graphId="kg_1"
      draft={DRAFT}
      onClose={onClose}
      onDeleted={onDeleted}
    />
  )
  return { onDeleted, onClose }
}

const confirm = () =>
  fireEvent.click(screen.getByRole('button', { name: 'Delete Draft' }))

const SOLE_DRAFT = new Error(
  'Delete journal entry failed: {"detail":"Journal entry je_draft is the only ledger entry of event evt_1 (status \'classified\'). Void or supersede the event instead of deleting its draft; a retracted event\'s drafts can then be deleted."}'
)

describe('DeleteDraftModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUpdateEventBlock.mockResolvedValue({})
    mockDeleteJournalEntry.mockResolvedValue({ deleted: true })
  })

  it('deletes one of an event’s drafts without touching the event', async () => {
    // Voiding would stop the event's other drafts from posting at close.
    const { onDeleted, onClose } = renderModal()
    confirm()
    await waitFor(() => expect(onDeleted).toHaveBeenCalled())
    expect(mockDeleteJournalEntry).toHaveBeenCalledWith('kg_1', 'je_draft')
    expect(mockUpdateEventBlock).not.toHaveBeenCalled()
    expect(onClose).toHaveBeenCalled()
  })

  it('voids the event and deletes when the draft is its only one', async () => {
    mockDeleteJournalEntry
      .mockRejectedValueOnce(SOLE_DRAFT)
      .mockResolvedValueOnce({ deleted: true })
    const { onDeleted } = renderModal()
    confirm()
    await waitFor(() => expect(onDeleted).toHaveBeenCalled())
    expect(mockUpdateEventBlock).toHaveBeenCalledWith('kg_1', {
      event_id: 'evt_1',
      transition_to: 'voided',
    })
    expect(mockDeleteJournalEntry).toHaveBeenCalledTimes(2)
  })

  it('voids nothing on any other refusal, and says why', async () => {
    mockDeleteJournalEntry.mockRejectedValue(
      new Error(
        'Delete journal entry failed: {"detail":"Journal entry je_draft is being written by another process. Retry in a moment."}'
      )
    )
    const { onDeleted, onClose } = renderModal()
    confirm()
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Another process (usually a running sync) is writing this right now.'
    )
    expect(mockUpdateEventBlock).not.toHaveBeenCalled()
    expect(onDeleted).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
  })
})
