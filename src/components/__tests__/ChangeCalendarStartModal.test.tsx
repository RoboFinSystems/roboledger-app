import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockGetFiscalCalendar = vi.fn()
const mockChangeCalendarStart = vi.fn()

vi.mock('@robosystems/core', () => ({
  clients: {
    ledger: {
      getFiscalCalendar: (...args: any[]) => mockGetFiscalCalendar(...args),
      changeCalendarStart: (...args: any[]) => mockChangeCalendarStart(...args),
    },
  },
}))

vi.mock('flowbite-react', () => ({
  Alert: ({ children }: any) => <div role="alert">{children}</div>,
  Button: ({ children, onClick, disabled, type }: any) => (
    <button onClick={onClick} disabled={disabled} type={type ?? 'button'}>
      {children}
    </button>
  ),
  HelperText: ({ children }: any) => <p>{children}</p>,
  Label: ({ children, htmlFor }: any) => (
    <label htmlFor={htmlFor}>{children}</label>
  ),
  Modal: ({ children, show }: any) => (show ? <div>{children}</div> : null),
  ModalBody: ({ children }: any) => <div>{children}</div>,
  ModalFooter: ({ children }: any) => <div>{children}</div>,
  ModalHeader: ({ children }: any) => <div>{children}</div>,
  Spinner: () => <span />,
  TextInput: (props: any) => <input {...props} />,
}))

import ChangeCalendarStartModal from '../ChangeCalendarStartModal'

function renderModal() {
  const onChanged = vi.fn()
  render(
    <ChangeCalendarStartModal
      graphId="kg_a"
      entityId="ent_rfs"
      entityName="RFS LLC"
      open
      onClose={vi.fn()}
      onChanged={onChanged}
    />
  )
  return { onChanged }
}

describe('ChangeCalendarStartModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetFiscalCalendar.mockResolvedValue({
      periods: [{ name: '2026-10' }, { name: '2026-09' }],
    })
  })

  it('reads where the calendar opens now', async () => {
    renderModal()
    expect(
      await screen.findByText(/It opens at September 2026/)
    ).toBeInTheDocument()
    expect(mockGetFiscalCalendar).toHaveBeenCalledWith('kg_a', {
      entityId: 'ent_rfs',
    })
  })

  it("moves the entity's start earlier and says how many months it opened", async () => {
    mockChangeCalendarStart.mockResolvedValue({
      fiscalCalendar: {},
      periodsCreated: 7,
      periodsRemoved: 0,
    })
    const { onChanged } = renderModal()
    await screen.findByText(/It opens at September 2026/)

    fireEvent.change(screen.getByLabelText('First open month'), {
      target: { value: '2026-02' },
    })
    fireEvent.click(screen.getByText('Move the start'))

    expect(
      await screen.findByText(/now opens at February 2026: 7 earlier months/)
    ).toBeInTheDocument()
    expect(mockChangeCalendarStart).toHaveBeenCalledWith('kg_a', '2026-02', {
      entityId: 'ent_rfs',
      note: null,
    })
    expect(onChanged).toHaveBeenCalled()
  })

  it('shows the refusal when the months to remove hold entries', async () => {
    mockChangeCalendarStart.mockRejectedValue(
      new Error(
        'Change calendar start failed: {"detail":"2 journal entries are dated in the months this would remove."}'
      )
    )
    renderModal()
    await screen.findByText(/It opens at September 2026/)
    fireEvent.change(screen.getByLabelText('First open month'), {
      target: { value: '2026-10' },
    })
    fireEvent.click(screen.getByText('Move the start'))

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        '2 journal entries are dated'
      )
    )
  })
})
