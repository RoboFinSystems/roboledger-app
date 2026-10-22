import {
  evenCurve,
  lifeEndDate,
  loanLegs,
  loanSettlement,
  monthEnd,
  monthsIn,
  readScheduleMechanics,
  scheduleFactsFallback,
} from '@/lib/ledger/schedules'
import { describe, expect, it } from 'vitest'

describe('schedule month helpers', () => {
  it('lists the months of a range by month, whatever the days', () => {
    expect(monthsIn('2026-01-15', '2026-03-02')).toEqual([
      '2026-01',
      '2026-02',
      '2026-03',
    ])
    expect(monthsIn('2026-11-01', '2027-02-28')).toEqual([
      '2026-11',
      '2026-12',
      '2027-01',
      '2027-02',
    ])
    expect(monthsIn('2026-03-01', '2026-02-28')).toEqual([])
    expect(monthsIn('', '2026-02-28')).toEqual([])
  })

  it('ends a life on the last day of its last month', () => {
    expect(lifeEndDate('2026-01-15', 12)).toBe('2026-12-31')
    expect(lifeEndDate('2026-11-01', 4)).toBe('2027-02-28')
    expect(lifeEndDate('2026-01-01', 0)).toBe('')
  })

  it('ends a month on its last day', () => {
    expect(monthEnd('2024-02')).toBe('2024-02-29')
  })
})

describe('evenCurve', () => {
  it('spreads cents evenly, the last month absorbing the remainder', () => {
    expect(evenCurve(10000, 3)).toEqual([3333, 3333, 3334])
    expect(evenCurve(30000, 3)).toEqual([10000, 10000, 10000])
    expect(evenCurve(0, 3)).toEqual([])
    expect(evenCurve(100, 0)).toEqual([])
  })
})

describe('readScheduleMechanics', () => {
  it('narrows a schedule envelope and rejects any other block', () => {
    const mechanics = {
      kind: 'closing_entry_generator',
      entry_template: { debit_element_id: 'a', credit_element_id: 'b' },
      posted_periods: [],
    }
    expect(readScheduleMechanics({ artifact: { mechanics } })).toBe(mechanics)
    expect(
      readScheduleMechanics({
        artifact: { mechanics: { kind: 'statement_renderer' } },
      })
    ).toBeNull()
    expect(readScheduleMechanics({ artifact: null })).toBeNull()
    expect(readScheduleMechanics({})).toBeNull()
  })
})

describe('scheduleFactsFallback', () => {
  it('reads the bounds and the usual monthly amount from the facts', () => {
    const fallback = scheduleFactsFallback({
      facts: [
        { periodEnd: '2026-03-31', periodType: 'duration', value: 100 },
        { periodEnd: '2026-01-31', periodType: 'instant', value: 1100 },
        { periodEnd: '2026-01-31', periodType: 'duration', value: 100 },
        { periodEnd: '2026-02-28', periodType: 'duration', value: 100 },
        // The last month absorbs rounding; it is not the monthly amount.
        { periodEnd: '2026-04-30', periodType: 'duration', value: 99.5 },
      ],
    })
    expect(fallback).toEqual({
      periodStart: '2026-01-01',
      periodEnd: '2026-04-30',
      monthlyAmountCents: 10000,
    })
  })

  it('has no amount when no month moves, and nothing without facts', () => {
    expect(
      scheduleFactsFallback({
        facts: [{ periodEnd: '2026-01-31', periodType: 'instant', value: 5 }],
      })
    ).toEqual({
      periodStart: '2026-01-01',
      periodEnd: '2026-01-31',
      monthlyAmountCents: null,
    })
    expect(scheduleFactsFallback({ facts: [] })).toBeNull()
  })
})

describe('loan legs', () => {
  const accounts = {
    interestElementId: 'acct_interest',
    creditElementId: 'acct_credit',
    noteElementId: 'acct_note',
  }

  it('accrues only when the payment arrives on the bank feed', () => {
    const legs = loanLegs('bank', accounts)
    expect(legs).toEqual([
      { element_id: 'acct_interest', side: 'debit', amount_source: 'interest' },
      { element_id: 'acct_credit', side: 'credit', amount_source: 'interest' },
    ])
    expect(loanSettlement(legs)).toBe('bank')
  })

  it('books the whole payment when the schedule settles it', () => {
    const legs = loanLegs('schedule', accounts)
    expect(legs.map((leg) => leg.amount_source)).toEqual([
      'principal',
      'interest',
      'payment',
    ])
    expect(loanSettlement(legs)).toBe('schedule')
    expect(loanSettlement(undefined)).toBe('bank')
  })
})
