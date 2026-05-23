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

  it('falls back to an in-memory tally when verificationSummary is absent', () => {
    // Older envelopes (pre-summary SDK) carry results but no summary; the
    // overall tally must roll up from the grouped results instead.
    const env = makeEnvelope({
      rules: [rule('r1', 'Consistency', 'BS balances')],
      verificationResults: [
        result('vr1', 'r1', 'pass'),
        result('vr2', 'r1', 'fail'),
      ],
      verificationSummary: null,
    } as never)
    render(<VerificationResults envelope={env} />)
    expect(screen.getByText('1 Pass')).toBeInTheDocument()
    expect(screen.getByText('1 Fail')).toBeInTheDocument()
  })

  it('renders error and skipped statuses with their tallies', () => {
    const env = makeEnvelope({
      rules: [
        rule('r1', 'Consistency', 'errored rule'),
        rule('r2', 'Consistency', 'skipped rule'),
      ],
      verificationResults: [
        result('vr1', 'r1', 'error'),
        result('vr2', 'r2', 'skipped'),
      ],
      verificationSummary: {
        total: 2,
        passed: 0,
        failed: 0,
        errored: 1,
        skipped: 1,
        byCategory: [
          {
            category: 'Consistency',
            total: 2,
            passed: 0,
            failed: 0,
            errored: 1,
            skipped: 1,
          },
        ],
      },
    } as never)
    render(<VerificationResults envelope={env} />)
    expect(screen.getByText('1 Error')).toBeInTheDocument()
    expect(screen.getByText('1 Skipped')).toBeInTheDocument()
    // An error makes the category problematic → expanded → its row visible.
    expect(screen.getByText('errored rule')).toBeInTheDocument()
  })
})
