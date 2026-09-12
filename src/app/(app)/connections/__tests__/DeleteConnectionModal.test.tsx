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
  PROVIDER_LABELS: { quickbooks: 'QuickBooks', external: 'External' },
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
