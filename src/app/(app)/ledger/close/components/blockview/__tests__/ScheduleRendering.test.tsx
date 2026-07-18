import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@robosystems/core', () => ({ customTheme: { table: {} } }))

vi.mock('flowbite-react', () => ({
  Table: ({ children }: any) => <table>{children}</table>,
  TableBody: ({ children }: any) => <tbody>{children}</tbody>,
  TableCell: ({ children }: any) => <td>{children}</td>,
  TableHead: ({ children }: any) => <thead>{children}</thead>,
  TableHeadCell: ({ children }: any) => <th>{children}</th>,
  TableRow: ({ children }: any) => <tr>{children}</tr>,
}))

import ScheduleRenderingProjection from '../projections/ScheduleRendering'
import { makeEnvelope, makeFact } from './_envelope-fixtures'

// A prepaid amortization roll-forward: a running-balance (`instant`)
// series on "Prepaid Expenses" that draws down, driven by an
// "Amortization" (`duration`) movement each period. The May balance is
// the carry-in opening balance (the prior closed period's ending
// balance) surfaced by the backend `build_envelope` carry-in logic.
const elements = [
  {
    id: 'elem_prepaid',
    qname: 'us-gaap:PrepaidExpenseCurrent',
    name: 'Prepaid Expenses',
    code: null,
    elementType: 'concept',
    isAbstract: false,
    isMonetary: true,
    balanceType: 'debit',
    periodType: 'instant',
  },
  {
    id: 'elem_amort',
    qname: 'us-gaap:AmortizationOfPrepaidExpense',
    name: 'Amortization',
    code: null,
    elementType: 'concept',
    isAbstract: false,
    isMonetary: true,
    balanceType: 'debit',
    periodType: 'duration',
  },
] as any

const carryInFact = makeFact({
  id: 'f_may_bal',
  elementId: 'elem_prepaid',
  value: 36.79,
  periodStart: null,
  periodEnd: '2026-05-31',
  periodType: 'instant',
  factScope: 'historical',
})

const junMovement = makeFact({
  id: 'f_jun_mov',
  elementId: 'elem_amort',
  value: 2.83,
  periodStart: '2026-06-01',
  periodEnd: '2026-06-30',
  periodType: 'duration',
})
const junBalance = makeFact({
  id: 'f_jun_bal',
  elementId: 'elem_prepaid',
  value: 33.96,
  periodStart: '2026-06-01',
  periodEnd: '2026-06-30',
  periodType: 'instant',
})
const julMovement = makeFact({
  id: 'f_jul_mov',
  elementId: 'elem_amort',
  value: 2.83,
  periodStart: '2026-07-01',
  periodEnd: '2026-07-31',
  periodType: 'duration',
})
const julBalance = makeFact({
  id: 'f_jul_bal',
  elementId: 'elem_prepaid',
  value: 31.13,
  periodStart: '2026-07-01',
  periodEnd: '2026-07-31',
  periodType: 'instant',
})

const rollForwardEnvelope = makeEnvelope({
  blockType: 'schedule',
  name: 'AWS RI Prepaid Amortization',
  elements,
  facts: [carryInFact, junMovement, junBalance, julMovement, julBalance],
})

describe('ScheduleRenderingProjection', () => {
  it('shows the empty state when envelope.facts is empty', () => {
    render(
      <ScheduleRenderingProjection
        envelope={makeEnvelope({ blockType: 'schedule', facts: [] })}
      />
    )
    expect(screen.getByText(/No facts found/)).toBeInTheDocument()
  })

  it('reconstructs a Beginning → Movement → Ending roll-forward', () => {
    render(<ScheduleRenderingProjection envelope={rollForwardEnvelope} />)

    expect(screen.getByText('AWS RI Prepaid Amortization')).toBeInTheDocument()
    // Two movement periods (the carry-in is the opening balance, not a row).
    expect(screen.getByText(/2 periods/)).toBeInTheDocument()

    // Opening (carry-in) and closing balances surface in the summary strip.
    expect(screen.getByText('Opening Balance')).toBeInTheDocument()
    expect(screen.getByText('Closing Balance')).toBeInTheDocument()
    // Net change = 31.13 - 36.79 = (5.66)
    expect(screen.getByText('($5.66)')).toBeInTheDocument()

    // Jun beginning ($36.79 = carry-in) appears both as opening stat and the
    // first row's beginning; Jul ending ($31.13) as closing + last ending.
    expect(screen.getAllByText('$36.79').length).toBe(2)
    expect(screen.getAllByText('$33.96').length).toBe(2) // Jun ending + Jul beginning
    expect(screen.getAllByText('$31.13').length).toBe(2)

    // Signed movement ties each row (ending - beginning = -2.83), once per period.
    expect(screen.getAllByText('($2.83)').length).toBe(2)
  })

  it('labels the movement column with the driver element name', () => {
    render(<ScheduleRenderingProjection envelope={rollForwardEnvelope} />)
    expect(screen.getByText('Amortization')).toBeInTheDocument()
  })

  it('degrades the beginning balance to "—" when no opening balance is present', () => {
    const noCarryIn = makeEnvelope({
      blockType: 'schedule',
      name: 'No Opening Balance',
      elements,
      facts: [junMovement, junBalance, julMovement, julBalance],
    })
    render(<ScheduleRenderingProjection envelope={noCarryIn} />)
    // First period has no prior balance to open from.
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(1)
    // The second period still opens from the first period's ending.
    expect(screen.getAllByText('$33.96').length).toBeGreaterThanOrEqual(1)
  })

  it('is read-only — renders no per-period Entry action', () => {
    render(<ScheduleRenderingProjection envelope={rollForwardEnvelope} />)
    expect(screen.queryByText(/Entry$/)).toBeNull()
  })
})
