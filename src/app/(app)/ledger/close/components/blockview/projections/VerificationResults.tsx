'use client'

import { Badge } from 'flowbite-react'
import type { FC } from 'react'
import { useMemo } from 'react'
import {
  HiCheckCircle,
  HiExclamation,
  HiExclamationCircle,
  HiMinusCircle,
} from 'react-icons/hi'
import type {
  EnvelopeBlock,
  EnvelopeRule,
  EnvelopeVerificationResult,
} from '../types'

type Status = 'pass' | 'fail' | 'error' | 'skipped'

const STATUS_BADGE: Record<
  Status,
  { color: 'success' | 'failure' | 'warning' | 'gray'; label: string }
> = {
  pass: { color: 'success', label: 'Pass' },
  fail: { color: 'failure', label: 'Fail' },
  error: { color: 'warning', label: 'Error' },
  skipped: { color: 'gray', label: 'Skipped' },
}

const STATUS_ICON: Record<Status, typeof HiCheckCircle> = {
  pass: HiCheckCircle,
  fail: HiExclamationCircle,
  error: HiExclamation,
  skipped: HiMinusCircle,
}

// Display order for status sections — failures first so the eye lands
// on what needs attention; passes at the bottom for audit completeness.
const STATUS_ORDER: Status[] = ['fail', 'error', 'skipped', 'pass']

interface VerificationResultsProjectionProps {
  envelope: EnvelopeBlock
}

function normalizeStatus(s: string): Status {
  if (s === 'pass' || s === 'fail' || s === 'error' || s === 'skipped') {
    return s
  }
  // Unknown status — likely backend schema drift. Surface in dev so it
  // shows up during development; silently fall through to 'skipped' in
  // production (the four enum values are CHECK-constrained backend-side,
  // so this branch only fires when someone widens the enum without
  // regenerating the SDK).
  if (process.env.NODE_ENV !== 'production') {
    console.warn(
      `[VerificationResults] unexpected status: ${s} — falling back to 'skipped'`
    )
  }
  return 'skipped'
}

function formatPeriod(row: EnvelopeVerificationResult): string {
  if (!row.periodStart && !row.periodEnd) return ''
  if (!row.periodStart) return row.periodEnd ?? ''
  if (!row.periodEnd) return row.periodStart
  if (row.periodStart === row.periodEnd) return row.periodEnd
  return `${row.periodStart} → ${row.periodEnd}`
}

/**
 * Charlie's `VerificationResults` View projection (financial-viewer.md §4.3).
 *
 * Uniform across every block type — surfaces the outcome of every rule
 * evaluation tied to this block's `(structure, fact_set)` pair, grouped
 * by status with failures first. The rule's metadata (pattern, severity,
 * message) is joined in-memory from `envelope.rules[]` by `ruleId`; the
 * verification row itself carries only the foreign key + outcome.
 *
 * The backend's rule engine auto-runs on every saved-report and
 * period-close mutation (roadmap §3.8), so this projection reflects the
 * current state of the block's invariants without needing a manual
 * `POST /evaluate-rules` call.
 */
const VerificationResultsProjection: FC<VerificationResultsProjectionProps> = ({
  envelope,
}) => {
  const rulesById = useMemo<Map<string, EnvelopeRule>>(
    () => new Map(envelope.rules.map((r) => [r.id, r])),
    [envelope.rules]
  )

  const grouped = useMemo<Map<Status, EnvelopeVerificationResult[]>>(() => {
    const groups = new Map<Status, EnvelopeVerificationResult[]>()
    for (const result of envelope.verificationResults) {
      const status = normalizeStatus(result.status)
      const arr = groups.get(status) ?? []
      arr.push(result)
      groups.set(status, arr)
    }
    return groups
  }, [envelope.verificationResults])

  const totals = useMemo(() => {
    const counts: Record<Status, number> = {
      pass: grouped.get('pass')?.length ?? 0,
      fail: grouped.get('fail')?.length ?? 0,
      error: grouped.get('error')?.length ?? 0,
      skipped: grouped.get('skipped')?.length ?? 0,
    }
    return counts
  }, [grouped])

  if (envelope.verificationResults.length === 0) {
    return (
      <div className="py-12 text-center text-gray-500 dark:text-gray-400">
        <HiMinusCircle className="mx-auto mb-3 h-8 w-8 text-gray-400" />
        No rule evaluations on this block yet.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Status tally header */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-3 dark:border-gray-700">
        {STATUS_ORDER.filter((s) => totals[s] > 0).map((status) => {
          const badge = STATUS_BADGE[status]
          return (
            <Badge key={status} color={badge.color} size="sm">
              {totals[status]} {badge.label}
            </Badge>
          )
        })}
      </div>

      {/* Per-status sections */}
      {STATUS_ORDER.map((status) => {
        const results = grouped.get(status)
        if (!results || results.length === 0) return null
        return (
          <StatusSection
            key={status}
            status={status}
            results={results}
            rulesById={rulesById}
          />
        )
      })}
    </div>
  )
}

interface StatusSectionProps {
  status: Status
  results: EnvelopeVerificationResult[]
  rulesById: Map<string, EnvelopeRule>
}

const StatusSection: FC<StatusSectionProps> = ({
  status,
  results,
  rulesById,
}) => {
  const StatusIconComp = STATUS_ICON[status]
  const badge = STATUS_BADGE[status]
  return (
    <div>
      <div className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-wide text-gray-400 uppercase">
        <StatusIconComp className="h-4 w-4" />
        {badge.label} ({results.length})
      </div>
      <ul className="space-y-2">
        {results.map((result) => (
          <ResultRow
            key={result.id}
            result={result}
            rule={rulesById.get(result.ruleId)}
            status={status}
          />
        ))}
      </ul>
    </div>
  )
}

interface ResultRowProps {
  result: EnvelopeVerificationResult
  rule: EnvelopeRule | undefined
  status: Status
}

const ResultRow: FC<ResultRowProps> = ({ result, rule, status }) => {
  const StatusIconComp = STATUS_ICON[status]
  const period = formatPeriod(result)
  const title =
    rule?.ruleMessage || rule?.ruleExpression || `Rule ${result.ruleId}`
  const tone =
    status === 'fail'
      ? 'border-red-200 bg-red-50/40 dark:border-red-900/50 dark:bg-red-900/10'
      : status === 'error'
        ? 'border-amber-200 bg-amber-50/40 dark:border-amber-900/50 dark:bg-amber-900/10'
        : status === 'skipped'
          ? 'border-gray-200 bg-gray-50/40 dark:border-gray-700 dark:bg-gray-800/40'
          : 'border-emerald-200 bg-emerald-50/40 dark:border-emerald-900/50 dark:bg-emerald-900/10'
  const iconTone =
    status === 'fail'
      ? 'text-red-500 dark:text-red-400'
      : status === 'error'
        ? 'text-amber-500 dark:text-amber-400'
        : status === 'skipped'
          ? 'text-gray-400'
          : 'text-emerald-500 dark:text-emerald-400'

  return (
    <li className={`flex gap-3 rounded-lg border p-3 ${tone}`}>
      <StatusIconComp className={`mt-0.5 h-5 w-5 shrink-0 ${iconTone}`} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {title}
          </span>
          {rule?.rulePattern && (
            <code className="rounded bg-gray-200 px-1.5 py-0.5 font-mono text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300">
              {rule.rulePattern}
            </code>
          )}
          {rule?.ruleSeverity && rule.ruleSeverity !== 'error' && (
            <span className="text-xs text-gray-400">{rule.ruleSeverity}</span>
          )}
          {period && (
            <span className="ml-auto text-xs text-gray-400">{period}</span>
          )}
        </div>
        {result.message && (
          <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
            {result.message}
          </p>
        )}
        {rule?.ruleExpression && rule.ruleExpression !== title && (
          <code className="mt-1 block truncate font-mono text-xs text-gray-500 dark:text-gray-500">
            {rule.ruleExpression}
          </code>
        )}
      </div>
    </li>
  )
}

export default VerificationResultsProjection
