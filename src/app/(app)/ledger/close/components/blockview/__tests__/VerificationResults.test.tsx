import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import VerificationResults from '../projections/VerificationResults'
import { makeEnvelope } from './_envelope-fixtures'

// The shared fixtures don't ship rule/result builders — construct minimal
// shapes (cast, like the other fixtures) carrying only the fields the
// projection reads.
const rule = (id: string, ruleCategory: string, ruleMessage: string) =>
  ({ id, ruleCategory, ruleExpression: '$A = $B', ruleMessage }) as never

const result = (id: string, ruleId: string, status: string) =>
  ({
    id,
    ruleId,
    status,
    structureId: null,
    factSetId: null,
    message: null,
    periodStart: null,
    periodEnd: null,
    evaluatedAt: null,
  }) as never

// FAC category: one pass + one fail (→ expanded by default).
// Consistency category: one pass (→ collapsed by default).
const envelopeWithVerification = () =>
  makeEnvelope({
    rules: [
      rule('r1', 'FundamentalAccountingConceptRelation', 'BS balances'),
      rule('r2', 'FundamentalAccountingConceptRelation', 'Rollup check'),
      rule('r3', 'Consistency', 'Consistency check'),
    ],
    verificationResults: [
      result('vr1', 'r1', 'pass'),
      result('vr2', 'r2', 'fail'),
      result('vr3', 'r3', 'pass'),
    ],
    verificationSummary: {
      total: 3,
      passed: 2,
      failed: 1,
      errored: 0,
      skipped: 0,
      byCategory: [
        {
          category: 'Consistency',
          total: 1,
          passed: 1,
          failed: 0,
          errored: 0,
          skipped: 0,
        },
        {
          category: 'FundamentalAccountingConceptRelation',
          total: 2,
          passed: 1,
          failed: 1,
          errored: 0,
          skipped: 0,
        },
      ],
    },
  } as never)

describe('VerificationResults projection (§7.12 category grouping)', () => {
  it('shows the empty state when there are no rule evaluations', () => {
    render(<VerificationResults envelope={makeEnvelope()} />)
    expect(screen.getByText(/no rule evaluations/i)).toBeInTheDocument()
  })

  it('renders the overall tally from verificationSummary + humanized category headers', () => {
    render(<VerificationResults envelope={envelopeWithVerification()} />)
    // Overall tally driven by the server-computed summary.
    expect(screen.getByText('2 Pass')).toBeInTheDocument()
    expect(screen.getByText('1 Fail')).toBeInTheDocument()
    // PascalCase rule_category humanized for display.
    expect(screen.getByText('Consistency')).toBeInTheDocument()
    expect(
      screen.getByText('Fundamental Accounting Concept Relation')
    ).toBeInTheDocument()
  })

  it('expands a failing category by default and keeps a clean one collapsed until clicked', () => {
    render(<VerificationResults envelope={envelopeWithVerification()} />)

    // FAC has a failure → expanded → its failing rule is visible.
    expect(screen.getByText('Rollup check')).toBeInTheDocument()
    // Consistency is all-pass → collapsed → its rule is hidden.
    expect(screen.queryByText('Consistency check')).toBeNull()

    // Clicking the clean category header expands it.
    fireEvent.click(screen.getByText('Consistency'))
    expect(screen.getByText('Consistency check')).toBeInTheDocument()
  })
})
