import { describe, expect, it } from 'vitest'
import { reportAnchorNote, reportExampleQuestions, reportFocus } from '../chat'

// A fictional company's report.
const anchor = {
  reportId: 'rpt_01HZX',
  name: 'Q2 2026 Financial Statements',
  entityName: 'Halvorsen Instruments Corp',
  periodStart: '2026-04-01',
  periodEnd: '2026-06-30',
}

describe('reportFocus', () => {
  it('carries the identifiers the operator can anchor on', () => {
    expect(reportFocus(anchor)).toEqual({
      report_id: 'rpt_01HZX',
      name: 'Q2 2026 Financial Statements',
      entity_name: 'Halvorsen Instruments Corp',
      period_start: '2026-04-01',
      period_end: '2026-06-30',
    })
  })

  it('nulls what the package does not carry', () => {
    expect(reportFocus({ reportId: 'r', name: 'n' })).toMatchObject({
      entity_name: null,
      period_start: null,
      period_end: null,
    })
  })
})

describe('reportAnchorNote', () => {
  it('names the entity, the report with its period, and the identifier', () => {
    const note = reportAnchorNote(anchor)
    expect(note).toContain('Entity: Halvorsen Instruments Corp')
    expect(note).toContain(
      'Report: Q2 2026 Financial Statements (2026-04-01 to 2026-06-30)'
    )
    expect(note).toContain('Report identifier: rpt_01HZX')
  })

  it('leaves the entity line out when there is no entity name', () => {
    const note = reportAnchorNote({ ...anchor, entityName: null })
    expect(note).not.toContain('Entity:')
  })
})

describe('reportExampleQuestions', () => {
  it('leads with a summary of the report by name', () => {
    expect(reportExampleQuestions(anchor)[0]).toBe(
      'Summarize Q2 2026 Financial Statements'
    )
  })
})
