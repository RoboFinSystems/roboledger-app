import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockGetEventBlock = vi.fn()
const mockUpdateEventBlock = vi.fn()
const mockDeleteJournalEntry = vi.fn()

vi.mock('@robosystems/core', () => ({
  clients: {
    ledger: {
      getEventBlock: (...args: any[]) => mockGetEventBlock(...args),
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

describe('DeleteDraftModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetEventBlock.mockResolvedValue({ id: 'evt_1', status: 'classified' })
    mockUpdateEventBlock.mockResolvedValue({})
    mockDeleteJournalEntry.mockResolvedValue({ deleted: true })
  })

  it('voids the draft’s event before deleting it', async () => {
    // The API refuses to delete a live event's only draft.
    const { onDeleted, onClose } = renderModal()
    confirm()
    await waitFor(() => expect(onDeleted).toHaveBeenCalled())
    expect(mockUpdateEventBlock).toHaveBeenCalledWith('kg_1', {
      event_id: 'evt_1',
      transition_to: 'voided',
    })
    expect(mockDeleteJournalEntry).toHaveBeenCalledWith('kg_1', 'je_draft')
    expect(mockUpdateEventBlock.mock.invocationCallOrder[0]).toBeLessThan(
      mockDeleteJournalEntry.mock.invocationCallOrder[0]
    )
    expect(onClose).toHaveBeenCalled()
  })

  it('finishes a delete whose event was already voided', async () => {
    // A retry after the delete failed: voiding again would be refused.
    mockGetEventBlock.mockResolvedValue({ id: 'evt_1', status: 'voided' })
    const { onDeleted } = renderModal()
    confirm()
    await waitFor(() => expect(onDeleted).toHaveBeenCalled())
    expect(mockUpdateEventBlock).not.toHaveBeenCalled()
    expect(mockDeleteJournalEntry).toHaveBeenCalledWith('kg_1', 'je_draft')
  })

  it('keeps the dialog open with the reason when a step is refused', async () => {
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
    expect(onDeleted).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
  })
})
