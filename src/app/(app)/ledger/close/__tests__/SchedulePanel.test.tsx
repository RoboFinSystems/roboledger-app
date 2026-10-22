import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockGetInformationBlock = vi.fn()
const mockDeleteSchedule = vi.fn()
const mockTerminateSchedule = vi.fn()

vi.mock('@robosystems/core', () => ({
  clients: {
    ledger: {
      getInformationBlock: (...args: any[]) => mockGetInformationBlock(...args),
      deleteSchedule: (...args: any[]) => mockDeleteSchedule(...args),
    },
  },
  LoadingState: () => <div role="status" />,
}))

vi.mock('@/lib/ledger/schedules', async () => {
  const actual = await vi.importActual<Record<string, unknown>>(
    '@/lib/ledger/schedules'
  )
  return {
    ...actual,
    terminateSchedule: (...args: any[]) => mockTerminateSchedule(...args),
  }
})

vi.mock('../components/blockview/BlockView', () => ({
  default: () => <div data-testid="block-view" />,
}))

vi.mock('../components/ScheduleModal', () => ({
  ScheduleModal: ({ open, editing }: any) =>
    open ? (
      <div data-testid="schedule-modal">
        {editing?.name} · {editing?.fallback?.periodStart} ·{' '}
        {editing?.mechanics?.entry_template?.debit_element_id}
      </div>
    ) : null,
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
  ModalHeader: ({ children }: any) => <div>{children}</div>,
  Select: ({ children, sizing: _sizing, ...props }: any) => (
    <select {...props}>{children}</select>
  ),
  Textarea: (props: any) => <textarea {...props} />,
}))

import { monthEnd } from '@/lib/ledger/schedules'
import SchedulePanel, { scheduleMonths } from '../components/SchedulePanel'

const fact = (periodEnd: string) => ({ periodEnd })
const ENVELOPE = {
  name: 'Prepaid Insurance',
  facts: [
    fact('2026-03-31'),
    fact('2026-01-31'),
    fact('2026-02-28'),
    fact('2026-02-28'),
  ],
}

describe('schedule helpers', () => {
  it('reads the months a schedule covers, oldest first', () => {
    expect(scheduleMonths(ENVELOPE as any)).toEqual([
      '2026-01',
      '2026-02',
      '2026-03',
    ])
  })

  it('ends a month on its last day', () => {
    expect(monthEnd('2026-02')).toBe('2026-02-28')
    expect(monthEnd('2024-02')).toBe('2024-02-29')
    expect(monthEnd('2026-12')).toBe('2026-12-31')
  })
})

describe('SchedulePanel — End schedule', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetInformationBlock.mockResolvedValue(ENVELOPE)
    mockTerminateSchedule.mockResolvedValue({ structure_id: 'struct_s' })
  })

  const renderPanel = () =>
    render(
      <SchedulePanel
        graphId="kg_a"
        structureId="struct_s"
        viewMode="rendered"
      />
    )

  it('ends after a month the schedule covers, before its last', async () => {
    renderPanel()
    fireEvent.click(await screen.findByRole('button', { name: /End schedule/ }))

    const month = screen.getByLabelText('Last month the schedule covers')
    expect(
      [...(month as HTMLSelectElement).options].map((o) => o.value)
    ).toEqual(['2026-01', '2026-02'])
    expect(month).toHaveValue('2026-02')

    const confirm = screen
      .getAllByRole('button', { name: 'End schedule' })
      .at(-1)!
    expect(confirm).toBeDisabled()
    fireEvent.change(screen.getByLabelText('Why it ends early'), {
      target: { value: 'Policy cancelled; premium refunded' },
    })
    fireEvent.change(month, { target: { value: '2026-01' } })
    fireEvent.click(confirm)

    await waitFor(() =>
      expect(mockTerminateSchedule).toHaveBeenCalledWith(
        'kg_a',
        'struct_s',
        '2026-01-31',
        'Policy cancelled; premium refunded'
      )
    )
    // The schedule is read again with its truncated months.
    await waitFor(() =>
      expect(mockGetInformationBlock).toHaveBeenCalledTimes(2)
    )
  })

  it('shows why the server refused', async () => {
    mockTerminateSchedule.mockRejectedValue(
      new Error(
        'Terminate schedule failed: {"detail":"Posted entries exist past the cutoff."}'
      )
    )
    renderPanel()
    fireEvent.click(await screen.findByRole('button', { name: /End schedule/ }))
    fireEvent.change(screen.getByLabelText('Why it ends early'), {
      target: { value: 'Sold' },
    })
    fireEvent.click(
      screen.getAllByRole('button', { name: 'End schedule' }).at(-1)!
    )
    expect(await screen.findByRole('alert')).toHaveTextContent(/Posted entries/)
  })

  it('offers no end on a one-month schedule', async () => {
    mockGetInformationBlock.mockResolvedValue({
      name: 'One month',
      facts: [fact('2026-01-31')],
    })
    renderPanel()
    await screen.findByTestId('block-view')
    expect(screen.queryByRole('button', { name: /End schedule/ })).toBeNull()
  })
})

describe('SchedulePanel — Edit schedule', () => {
  const MECHANICS = {
    kind: 'closing_entry_generator',
    entry_template: {
      debit_element_id: 'elem_exp',
      credit_element_id: 'elem_prepaid',
    },
    schedule_metadata: { method: 'straight_line' },
    posted_periods: [],
    edit_warning: null,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('opens the form on the definition the envelope carries', async () => {
    mockGetInformationBlock.mockResolvedValue({
      ...ENVELOPE,
      entityId: 'ent_parent',
      artifact: { mechanics: MECHANICS },
      facts: [
        { ...fact('2026-01-31'), periodType: 'duration', value: 100 },
        { ...fact('2026-02-28'), periodType: 'duration', value: 100 },
      ],
    })
    render(
      <SchedulePanel
        graphId="kg_a"
        structureId="struct_s"
        viewMode="rendered"
      />
    )
    fireEvent.click(
      await screen.findByRole('button', { name: /Edit schedule/ })
    )
    expect(screen.getByTestId('schedule-modal')).toHaveTextContent(
      'Prepaid Insurance · 2026-01-01 · elem_exp'
    )
  })

  it('offers no edit when the envelope carries no definition', async () => {
    mockGetInformationBlock.mockResolvedValue(ENVELOPE)
    render(
      <SchedulePanel
        graphId="kg_a"
        structureId="struct_s"
        viewMode="rendered"
      />
    )
    await screen.findByTestId('block-view')
    expect(screen.queryByRole('button', { name: /Edit schedule/ })).toBeNull()
  })
})
