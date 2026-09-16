/**
 * What the operator is told about the report on screen. The note rides ahead
 * of every question (the operator does not read `context` into its prompt
 * yet); `focus` carries the same identifiers for a release that does. The
 * report identifier is what the tenant-side disclosure and information-block
 * tools key on, so the operator lands on the same report the reader has open.
 */
export interface ReportAnchor {
  reportId: string
  name: string
  entityName?: string | null
  periodStart?: string | null
  periodEnd?: string | null
}

export function reportFocus(anchor: ReportAnchor): Record<string, unknown> {
  return {
    report_id: anchor.reportId,
    name: anchor.name,
    entity_name: anchor.entityName ?? null,
    period_start: anchor.periodStart ?? null,
    period_end: anchor.periodEnd ?? null,
  }
}

function periodOf(anchor: ReportAnchor): string {
  if (anchor.periodStart && anchor.periodEnd)
    return `${anchor.periodStart} to ${anchor.periodEnd}`
  return anchor.periodEnd ?? anchor.periodStart ?? ''
}

/** The note that anchors the operator on the open report. */
export function reportAnchorNote(anchor: ReportAnchor): string {
  const period = periodOf(anchor)
  return [
    'REPORT IN CONTEXT — the user is reading this report:',
    ...(anchor.entityName ? [`  Entity: ${anchor.entityName}`] : []),
    `  Report: ${anchor.name}${period ? ` (${period})` : ''}`,
    `  Report identifier: ${anchor.reportId}`,
    'Anchor on this report and its period. When the question is about "this report", read it by its identifier; when it is about why a figure moved, the ledger behind it is on the same graph. If the user clearly asks about another period or the books at large, answer that instead.',
  ].join('\n')
}

/** Questions offered on the empty state, worded for the report on screen. */
export function reportExampleQuestions(anchor: ReportAnchor): string[] {
  return [
    `Summarize ${anchor.name}`,
    'What drove the change in cash this period?',
    'Which accounts moved most against the prior period?',
  ]
}
