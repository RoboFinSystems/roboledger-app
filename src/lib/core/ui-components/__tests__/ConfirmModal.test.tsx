import { fireEvent, render, screen } from '@testing-library/react'
import { HiTrash } from 'react-icons/hi'
import { describe, expect, it, vi } from 'vitest'
import { ConfirmModal } from '../ConfirmModal'

describe('ConfirmModal', () => {
  it('renders the title and children when shown', () => {
    render(
      <ConfirmModal
        show
        title="Delete Document"
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      >
        <p>This action cannot be undone.</p>
      </ConfirmModal>
    )
    expect(screen.getByText('Delete Document')).toBeInTheDocument()
    expect(
      screen.getByText('This action cannot be undone.')
    ).toBeInTheDocument()
  })

  it('renders nothing when not shown', () => {
    render(
      <ConfirmModal
        show={false}
        title="Delete Document"
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    )
    expect(screen.queryByText('Delete Document')).not.toBeInTheDocument()
  })

  it('calls onConfirm when the confirm button is clicked', () => {
    const onConfirm = vi.fn()
    render(
      <ConfirmModal
        show
        title="Delete"
        confirmLabel="Delete"
        onClose={vi.fn()}
        onConfirm={onConfirm}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when the cancel button is clicked', () => {
    const onClose = vi.fn()
    render(
      <ConfirmModal show title="Delete" onClose={onClose} onConfirm={vi.fn()} />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('shows the loading label and disables both buttons while loading', () => {
    const onClose = vi.fn()
    const onConfirm = vi.fn()
    render(
      <ConfirmModal
        show
        loading
        title="Delete"
        loadingLabel="Deleting…"
        onClose={onClose}
        onConfirm={onConfirm}
      />
    )
    expect(screen.getByText('Deleting…')).toBeInTheDocument()
    const cancel = screen.getByRole('button', { name: 'Cancel' })
    const confirm = screen.getByRole('button', { name: /Deleting…/ })
    expect(cancel).toBeDisabled()
    expect(confirm).toBeDisabled()
    fireEvent.click(cancel)
    expect(onClose).not.toHaveBeenCalled()
  })

  it('does not call onConfirm while loading', () => {
    const onConfirm = vi.fn()
    render(
      <ConfirmModal
        show
        loading
        title="Delete"
        loadingLabel="Deleting…"
        onClose={vi.fn()}
        onConfirm={onConfirm}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /Deleting…/ }))
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('renders a confirm icon when provided', () => {
    render(
      <ConfirmModal
        show
        title="Delete"
        confirmLabel="Delete"
        confirmIcon={HiTrash}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    )
    const confirmButton = screen.getByRole('button', { name: 'Delete' })
    expect(confirmButton.querySelector('svg')).toBeInTheDocument()
  })
})
