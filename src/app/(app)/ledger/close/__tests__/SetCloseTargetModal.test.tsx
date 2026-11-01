import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mockSetCloseTarget = vi.fn()

vi.mock('@robosystems/core', () => ({
  clients: {
    ledger: {
      setCloseTarget: (...args: any[]) => mockSetCloseTarget(...args),
    },
  },
}))

vi.mock('@robosystems/core/ui', () => ({
  Alert: ({ children }: any) => <div role="alert">{children}</div>,
  Button: ({ children, onClick, disabled, type }: any) => (
    <button onClick={onClick} disabled={disabled} type={type ?? 'button'}>
      {children}
    </button>
  ),
  Label: ({ children, htmlFor }: any) => (
    <label htmlFor={htmlFor}>{children}</label>
  ),
  Modal: ({ children, show }: any) => (show ? <div>{children}</div> : null),
  ModalBody: ({ children }: any) => <div>{children}</div>,
  ModalFooter: ({ children }: any) => <div>{children}</div>,
  ModalHeader: ({ children }: any) => <div>{children}</div>,
  TextInput: ({ sizing: _sizing, ...props }: any) => <input {...props} />,
}))

import SetCloseTargetModal from '../components/SetCloseTargetModal'

function renderModal(calendar: Record<string, unknown>) {
  const onSet = vi.fn()
  render(
    <SetCloseTargetModal
      graphId="kg_a"
      entityId="ent_sub"
      calendar={calendar as any}
      open
      onClose={vi.fn()}
      onSet={onSet}
    />
  )
  return { onSet }
}

const submit = () => screen.getByRole('button', { name: 'Set close target' })

describe('SetCloseTargetModal', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(Date.UTC(2026, 9, 22, 12)))
    mockSetCloseTarget.mockReset()
    mockSetCloseTarget.mockResolvedValue({ closeTarget: '2026-09' })
  })
  afterEach(() => vi.useRealTimers())

  it('defaults to last month and sets it for the entity in scope', async () => {
    const { onSet } = renderModal({
      closedThrough: '2026-06',
      closeTarget: null,
    })
    expect(screen.getByLabelText('Close through')).toHaveValue('2026-09')
    fireEvent.change(screen.getByLabelText('Note (optional)'), {
      target: { value: 'Q3 board pack' },
    })
    fireEvent.click(submit())
    await waitFor(() => expect(onSet).toHaveBeenCalled())
    expect(mockSetCloseTarget).toHaveBeenCalledWith(
      'kg_a',
      '2026-09',
      'Q3 board pack',
      { entityId: 'ent_sub' }
    )
  })

  it('starts on the current target', () => {
    renderModal({ closedThrough: '2026-06', closeTarget: '2026-08' })
    expect(screen.getByLabelText('Close through')).toHaveValue('2026-08')
  })

  it('refuses a month not yet over, or one before the last closed', () => {
    renderModal({ closedThrough: '2026-06', closeTarget: null })
    const input = screen.getByLabelText('Close through')
    fireEvent.change(input, { target: { value: '2026-10' } })
    expect(submit()).toBeDisabled()
    expect(
      screen.getByText(/Pick a month from June 2026 to September 2026/)
    ).toBeInTheDocument()
    fireEvent.change(input, { target: { value: '2026-05' } })
    expect(submit()).toBeDisabled()
    fireEvent.change(input, { target: { value: '2026-06' } })
    expect(submit()).not.toBeDisabled()
  })

  it('shows why the server refused', async () => {
    mockSetCloseTarget.mockRejectedValue(
      new Error(
        'Set close target failed: {"detail":"Calendar not initialized."}'
      )
    )
    renderModal({ closedThrough: null, closeTarget: null })
    fireEvent.click(submit())
    expect(await screen.findByRole('alert')).toHaveTextContent(
      /not initialized/
    )
  })
})
