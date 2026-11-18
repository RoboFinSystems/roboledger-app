import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@robosystems/core', () => ({
  ConfirmModal: ({
    show,
    children,
    title,
    confirmLabel,
    onConfirm,
    onClose,
  }: any) =>
    show ? (
      <div>
        <h3>{title}</h3>
        {children}
        <button onClick={onClose}>Cancel</button>
        <button onClick={onConfirm}>{confirmLabel}</button>
      </div>
    ) : null,
}))

// ConnectionCard pulls in images and the whole card; only its label map is
// needed here.
vi.mock('../components/ConnectionCard', () => ({
  PROVIDER_LABELS: {
    quickbooks: 'QuickBooks',
    mercury: 'Mercury',
    plaid: 'Plaid',
    external: 'External',
  },
}))

vi.mock('next/image', () => ({
  default: ({ alt }: any) => <span>{alt}</span>,
}))

import { DeleteConnectionModal } from '../components/DeleteConnectionModal'

const connection = (provider: string) =>
  ({
    connection_id: 'conn_1',
    provider,
    status: 'connected',
    created_at: '2026-01-01T00:00:00Z',
    metadata: {},
  }) as any

describe('DeleteConnectionModal', () => {
  it('offers disconnect or sever for QuickBooks, defaulting to disconnect', () => {
    const onConfirm = vi.fn()
    render(
      <DeleteConnectionModal
        show
        connection={connection('quickbooks')}
        onClose={vi.fn()}
        onConfirm={onConfirm}
      />
    )

    expect(
      screen.getByRole('heading', { name: 'Disconnect QuickBooks' })
    ).toBeInTheDocument()
    const [disconnect, sever] = screen.getAllByRole('radio')
    expect(disconnect).toBeChecked()
    expect(sever).not.toBeChecked()

    fireEvent.click(screen.getByRole('button', { name: 'Disconnect' }))
    expect(onConfirm).toHaveBeenCalledWith('disconnect')
  })

  it('confirms a sever once chosen', () => {
    const onConfirm = vi.fn()
    render(
      <DeleteConnectionModal
        show
        connection={connection('quickbooks')}
        onClose={vi.fn()}
        onConfirm={onConfirm}
      />
    )

    fireEvent.click(screen.getAllByRole('radio')[1])
    fireEvent.click(screen.getByRole('button', { name: 'Sever and go native' }))
    expect(onConfirm).toHaveBeenCalledWith('sever')
  })

  it('disconnects Mercury, says what is kept and deleted, and carries the disclosure', () => {
    const onConfirm = vi.fn()
    render(
      <DeleteConnectionModal
        show
        connection={connection('mercury')}
        onClose={vi.fn()}
        onConfirm={onConfirm}
      />
    )

    expect(
      screen.getByRole('heading', { name: 'Disconnect Mercury' })
    ).toBeInTheDocument()
    expect(screen.queryAllByRole('radio')).toHaveLength(0)
    expect(screen.getByText(/waiting in your inbox are deleted/)).toBeTruthy()
    expect(screen.getByText(/already posted stay in your books/)).toBeTruthy()
    expect(screen.getByTestId('mercury-disclosure')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Disconnect' }))
    expect(onConfirm).toHaveBeenCalledWith('disconnect')
  })

  it('disconnects Plaid without the Mercury disclosure', () => {
    render(
      <DeleteConnectionModal
        show
        connection={connection('plaid')}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    )
    expect(
      screen.getByRole('heading', { name: 'Disconnect Plaid' })
    ).toBeInTheDocument()
    expect(screen.queryByTestId('mercury-disclosure')).toBeNull()
  })

  it('has a single disposition for every other provider', () => {
    const onConfirm = vi.fn()
    render(
      <DeleteConnectionModal
        show
        connection={connection('external')}
        onClose={vi.fn()}
        onConfirm={onConfirm}
      />
    )

    expect(
      screen.getByRole('heading', { name: 'Delete Connection' })
    ).toBeInTheDocument()
    expect(screen.queryAllByRole('radio')).toHaveLength(0)
    fireEvent.click(screen.getByRole('button', { name: 'Delete Connection' }))
    expect(onConfirm).toHaveBeenCalledWith('disconnect')
  })

  it('renders nothing while hidden', () => {
    render(
      <DeleteConnectionModal
        show={false}
        connection={connection('quickbooks')}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    )
    expect(screen.queryByText('Disconnect QuickBooks')).not.toBeInTheDocument()
  })
})
