import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mockInitializeLedger = vi.fn()
const mockGetFiscalCalendar = vi.fn()

vi.mock('@robosystems/core', () => ({
  clients: {
    ledger: {
      initializeLedger: (...args: any[]) => mockInitializeLedger(...args),
      getFiscalCalendar: (...args: any[]) => mockGetFiscalCalendar(...args),
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
  Label: ({ children, htmlFor }: any) => (
    <label htmlFor={htmlFor}>{children}</label>
  ),
  Modal: ({ children, show }: any) => (show ? <div>{children}</div> : null),
  ModalBody: ({ children }: any) => <div>{children}</div>,
  ModalFooter: ({ children }: any) => <div>{children}</div>,
  ModalHeader: ({ children }: any) => <div>{children}</div>,
  Radio: (props: any) => <input type="radio" {...props} />,
  Select: ({ children, sizing: _sizing, ...props }: any) => (
    <select {...props}>{children}</select>
  ),
  TextInput: ({ sizing: _sizing, ...props }: any) => <input {...props} />,
}))

import FiscalCalendarSetupModal, {
  addMonths,
  currentPeriod,
  monthsBetween,
} from '../FiscalCalendarSetupModal'

const calendar = { closedThrough: null, fiscalYearStartMonth: 1 }

function renderModal(entityId: string | null = 'ent_sub') {
  const onInitialized = vi.fn()
  render(
    <FiscalCalendarSetupModal
      graphId="kg_a"
      entityId={entityId}
      entityName="RFS LLC"
      open
      onClose={vi.fn()}
      onInitialized={onInitialized}
    />
  )
  return { onInitialized }
}

describe('period helpers', () => {
  it('shift and count months across a year boundary', () => {
    expect(addMonths('2026-01', -1)).toBe('2025-12')
    expect(addMonths('2025-12', 1)).toBe('2026-01')
    expect(monthsBetween('2025-11', '2026-02')).toBe(4)
    expect(monthsBetween('2026-03', '2026-02')).toBe(0)
  })
})

describe('FiscalCalendarSetupModal', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(Date.UTC(2026, 9, 9, 12)))
    mockInitializeLedger.mockReset()
    mockGetFiscalCalendar.mockReset()
    mockGetFiscalCalendar.mockResolvedValue(null)
    mockInitializeLedger.mockResolvedValue({
      fiscalCalendar: calendar,
      periodsCreated: 2,
      warnings: [],
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts open books at last month by default', async () => {
    const { onInitialized } = renderModal()
    expect(screen.getByTestId('calendar-setup-preview')).toHaveTextContent(
      'First close: September 2026'
    )

    fireEvent.click(screen.getByRole('button', { name: 'Set up calendar' }))

    await waitFor(() => expect(onInitialized).toHaveBeenCalledWith(calendar))
    expect(mockInitializeLedger).toHaveBeenCalledWith('kg_a', {
      entityId: 'ent_sub',
      fiscalYearStartMonth: 1,
      earliestDataPeriod: '2026-09',
    })
  })

  it('locks history closed elsewhere and closes the month after', async () => {
    renderModal()
    fireEvent.click(
      screen.getByLabelText('History already closed in another system')
    )
    fireEvent.change(screen.getByLabelText('Last month closed elsewhere'), {
      target: { value: '2026-06' },
    })
    const preview = screen.getByTestId('calendar-setup-preview')
    expect(preview).toHaveTextContent('First close: July 2026')
    expect(preview).toHaveTextContent('3 months have to close')

    fireEvent.click(screen.getByRole('button', { name: 'Set up calendar' }))

    await waitFor(() =>
      expect(mockInitializeLedger).toHaveBeenCalledWith('kg_a', {
        entityId: 'ent_sub',
        fiscalYearStartMonth: 1,
        closedThrough: '2026-06',
      })
    )
  })

  it('says the current month closes only once it ends', () => {
    renderModal()
    fireEvent.change(screen.getByLabelText('First month to close'), {
      target: { value: '2026-10' },
    })
    expect(screen.getByTestId('calendar-setup-preview')).toHaveTextContent(
      'First close: October 2026, once the month ends'
    )
  })

  it('reads the current month in UTC, as the server does', () => {
    // 1 Nov 2026 00:30 in UTC+2 is still 31 Oct in UTC.
    expect(currentPeriod(new Date(Date.UTC(2026, 9, 31, 22, 30)))).toBe(
      '2026-10'
    )
  })

  it('refuses a first month after this one', () => {
    renderModal()
    fireEvent.change(screen.getByLabelText('First month to close'), {
      target: { value: '2026-11' },
    })
    expect(screen.getByTestId('calendar-setup-preview')).toHaveTextContent(
      'Pick October 2026 or earlier.'
    )
    expect(
      screen.getByRole('button', { name: 'Set up calendar' })
    ).toBeDisabled()
  })

  it("holds a subsidiary to the group's fiscal year", async () => {
    mockGetFiscalCalendar.mockResolvedValue({
      closedThrough: '2026-07',
      fiscalYearStartMonth: 7,
    })
    renderModal('ent_sub')

    const select = screen.getByLabelText('Fiscal year starts in')
    await waitFor(() => expect(select).toHaveValue('7'))
    expect(select).toBeDisabled()
    expect(mockGetFiscalCalendar).toHaveBeenCalledWith('kg_a')
  })

  it('lets the group parent choose its fiscal year', () => {
    renderModal(null)
    expect(screen.getByLabelText('Fiscal year starts in')).toBeEnabled()
    expect(mockGetFiscalCalendar).not.toHaveBeenCalled()
  })

  it("shows the server's refusal", async () => {
    mockInitializeLedger.mockRejectedValue(new Error('already initialized'))
    const { onInitialized } = renderModal()
    fireEvent.click(screen.getByRole('button', { name: 'Set up calendar' }))
    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(onInitialized).not.toHaveBeenCalled()
  })
})
