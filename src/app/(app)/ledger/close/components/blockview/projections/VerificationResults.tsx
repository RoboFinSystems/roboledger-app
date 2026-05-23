'use client'

import { Badge } from 'flowbite-react'
import type { FC } from 'react'
import { useMemo, useState } from 'react'
import {
  HiCheckCircle,
  HiChevronDown,
  HiChevronRight,
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

// `rule_category` values are PascalCase ontology terms
// (e.g. `FundamentalAccountingConceptRelation`); space them for display.
function humanizeCategory(category: string): string {
  if (!category) return 'Uncategorized'
  return category
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
}

interface CategoryGroup {
  category: string
  results: EnvelopeVerificationResult[]
  counts: Record<Status, number>
  total: number
}

/**
 * Charlie's `VerificationResults` View projection (financial-viewer.md §4.3,
 * §7.12 restructure).
 *
 * Uniform across every block type — surfaces the outcome of every rule
 * evaluation tied to this block's `(structure, fact_set)` pair. Rules are
 * grouped into per-`rule_category` accordions (the §7.12 two-level layout):
 * categories with failures or errors expand by default; clean categories
 * collapse so the eye lands on what needs attention. Each rule's metadata
 * (category, pattern, severity, message) is joined in-memory from
 * `envelope.rules[]` by `ruleId`; the verification row carries only the
 * foreign key + outcome.
 *
 * The overall tally is driven by the server-computed `verificationSummary`
 * arm when present (it pre-joins category + aggregates), falling back to an
 * in-memory roll-up of `verificationResults` for older envelopes. The rule
 * engine auto-runs on saved-report and period-close mutations (roadmap §3.8),
 * so this reflects the block's current invariants without a manual
 * `POST /evaluate-rules`.
 */
const VerificationResultsProjection: FC<VerificationResultsProjectionProps> = ({
  envelope,
}) => {
  const rulesById = useMemo<Map<string, EnvelopeRule>>(
    () => new Map(envelope.rules.map((r) => [r.id, r])),
    [envelope.rules]
  )

  // Group results by rule_category (joined from rules by ruleId), then sort
  // by category name to match the backend's by_category ordering. We group
  // in-memory rather than reading `verificationSummary.byCategory`: the panel
  // needs the result rows grouped anyway, and deriving the per-category counts
  // from those same groups guarantees the accordion headers can't drift from
  // the rows shown. (byCategory + the top-level summary stay useful for
  // lighter consumers — e.g. list badges — that don't fetch the full rows.)
  const groups = useMemo<CategoryGroup[]>(() => {
    const byCategory = new Map<string, EnvelopeVerificationResult[]>()
    for (const result of envelope.verificationResults) {
      const category =
        rulesById.get(result.ruleId)?.ruleCategory ?? 'Uncategorized'
      const arr = byCategory.get(category) ?? []
      arr.push(result)
      byCategory.set(category, arr)
    }
    return Array.from(byCategory.entries())
      .map(([category, results]) => {
        const counts: Record<Status, number> = {
          pass: 0,
          fail: 0,
          error: 0,
          skipped: 0,
        }
        for (const r of results) counts[normalizeStatus(r.status)] += 1
        return { category, results, counts, total: results.length }
      })
      .sort((a, b) => a.category.localeCompare(b.category))
  }, [envelope.verificationResults, rulesById])

  // Overall tally — prefer the server-computed summary; fall back to an
  // in-memory roll-up for envelopes from SDKs before the summary arm.
  const totals = useMemo<Record<Status, number>>(() => {
    const summary = envelope.verificationSummary
    if (summary) {
      return {
        pass: summary.passed,
        fail: summary.failed,
        error: summary.errored,
        skipped: summary.skipped,
      }
    }
    const counts: Record<Status, number> = {
      pass: 0,
      fail: 0,
      error: 0,
      skipped: 0,
    }
    for (const group of groups) {
      for (const status of STATUS_ORDER) counts[status] += group.counts[status]
    }
    return counts
  }, [envelope.verificationSummary, groups])

  if (envelope.verificationResults.length === 0) {
    return (
      <div className="py-12 text-center text-gray-500 dark:text-gray-400">
        <HiMinusCircle className="mx-auto mb-3 h-8 w-8 text-gray-400" />
        No rule evaluations on this block yet.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Overall status tally */}
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

      {/* Per-category accordions */}
      {groups.map((group) => (
        <CategorySection
          key={group.category}
          group={group}
          rulesById={rulesById}
        />
      ))}
    </div>
  )
}

interface CategorySectionProps {
  group: CategoryGroup
  rulesById: Map<string, EnvelopeRule>
}

const CategorySection: FC<CategorySectionProps> = ({ group, rulesById }) => {
  const { counts, total } = group
  const hasProblems = counts.fail > 0 || counts.error > 0
  const [open, setOpen] = useState(hasProblems)

  // Header status icon: failures/errors → alert; skips-only → muted; else ✓.
  const HeaderIcon = hasProblems
    ? counts.fail > 0
      ? HiExclamationCircle
      : HiExclamation
    : counts.skipped > 0 && counts.pass === 0
      ? HiMinusCircle
      : HiCheckCircle
  const headerIconTone = hasProblems
    ? counts.fail > 0
      ? 'text-red-500 dark:text-red-400'
      : 'text-amber-500 dark:text-amber-400'
    : counts.skipped > 0 && counts.pass === 0
      ? 'text-gray-400'
      : 'text-emerald-500 dark:text-emerald-400'

  // "9 of 10 passed, 1 failed" — failures/errors/skips appended when present.
  const summaryParts: string[] = [`${counts.pass} of ${total} passed`]
  if (counts.fail > 0) summaryParts.push(`${counts.fail} failed`)
  if (counts.error > 0) {
    summaryParts.push(`${counts.error} error${counts.error === 1 ? '' : 's'}`)
  }
  if (counts.skipped > 0) summaryParts.push(`${counts.skipped} skipped`)
  const Chevron = open ? HiChevronDown : HiChevronRight
  // Stable id linking the toggle button to the panel it controls (a11y).
  const panelId = `verification-category-${group.category}`

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-center gap-2 bg-gray-50 px-3 py-2 text-left hover:bg-gray-100 dark:bg-gray-800/60 dark:hover:bg-gray-800"
      >
        <Chevron className="h-4 w-4 shrink-0 text-gray-400" />
        <HeaderIcon className={`h-4 w-4 shrink-0 ${headerIconTone}`} />
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {humanizeCategory(group.category)}
        </span>
        <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
          {summaryParts.join(', ')}
        </span>
      </button>
      {open && (
        <ul id={panelId} className="space-y-2 p-3">
          {STATUS_ORDER.flatMap((status) =>
            group.results
              .filter((r) => normalizeStatus(r.status) === status)
              .map((result) => (
                <ResultRow
                  key={result.id}
                  result={result}
                  rule={rulesById.get(result.ruleId)}
                  status={status}
                />
              ))
          )}
        </ul>
      )}
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
          {(rule?.rulePattern || rule?.ruleCheckKind) && (
            <code className="rounded bg-gray-200 px-1.5 py-0.5 font-mono text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300">
              {rule.rulePattern ?? rule.ruleCheckKind}
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
