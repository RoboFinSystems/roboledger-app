'use client'

import { Badge } from 'flowbite-react'
import type { FC } from 'react'
import { useMemo } from 'react'
import {
  HiBookOpen,
  HiExclamation,
  HiInformationCircle,
  HiXCircle,
} from 'react-icons/hi'
import type { EnvelopeBlock, EnvelopeRule } from '../types'

type Severity = 'error' | 'warning' | 'info'

const SEVERITY_BADGE: Record<
  Severity,
  { color: 'failure' | 'warning' | 'info'; label: string }
> = {
  error: { color: 'failure', label: 'Error' },
  warning: { color: 'warning', label: 'Warning' },
  info: { color: 'info', label: 'Info' },
}

const SEVERITY_ICON: Record<Severity, typeof HiXCircle> = {
  error: HiXCircle,
  warning: HiExclamation,
  info: HiInformationCircle,
}

// Display order matches alert priority — error rules first so a quick
// glance lands on the strict invariants; info rules at the bottom for
// completeness.
const SEVERITY_ORDER: Severity[] = ['error', 'warning', 'info']

interface BusinessRulesProjectionProps {
  envelope: EnvelopeBlock
}

function normalizeSeverity(s: string): Severity {
  if (s === 'error' || s === 'warning' || s === 'info') return s
  return 'info'
}

/**
 * Charlie's `BusinessRules` View projection (financial-viewer.md §4.3).
 *
 * Uniform across every block type — lists every rule declared against
 * this block's `(structure, fact_set)` pair, grouped by `ruleSeverity`
 * (error / warning / info) with the strictest invariants surfaced
 * first. Each rule row shows:
 *
 * - `ruleMessage` (or falls back to `ruleExpression`) as the title
 * - `rulePattern` OR `ruleCheckKind` as a code chip — arithmetic patterns
 *   (one of 11 cm:BusinessRulePattern mechanisms — SumEquals, RollUp,
 *   RollForward, EqualTo, etc.) populate `rulePattern`; structural
 *   check kinds (NoCycles, LeafHasClassification, etc.) populate
 *   `ruleCheckKind` instead. Exactly one is non-null per rule (XOR).
 * - `ruleCategory` as a secondary chip (one of the 9 cm:VerificationRule
 *   subclasses — FAC, peer consistency, prior-period consistency, etc.)
 * - `ruleOrigin` (forked / native) so operators can tell library-seeded
 *   rules from tenant-authored ones at a glance
 * - `ruleTarget` (kind + ref_id) — the atom the rule is scoped to;
 *   surfaces what would otherwise require chasing the rule through the
 *   structure tree to find
 * - `ruleVariables[]` — the `$name → qname` bindings the rule expression
 *   resolves; useful for diagnosing "why didn't this fire on my facts?"
 *
 * The companion projection (`VerificationResults`) shows the outcome of
 * evaluating these rules against the block's facts; this one shows the
 * rules themselves regardless of whether they've been evaluated.
 */
const BusinessRulesProjection: FC<BusinessRulesProjectionProps> = ({
  envelope,
}) => {
  const grouped = useMemo<Map<Severity, EnvelopeRule[]>>(() => {
    const groups = new Map<Severity, EnvelopeRule[]>()
    for (const rule of envelope.rules) {
      const sev = normalizeSeverity(rule.ruleSeverity)
      const arr = groups.get(sev) ?? []
      arr.push(rule)
      groups.set(sev, arr)
    }
    return groups
  }, [envelope.rules])

  const totals = useMemo(() => {
    const counts: Record<Severity, number> = {
      error: grouped.get('error')?.length ?? 0,
      warning: grouped.get('warning')?.length ?? 0,
      info: grouped.get('info')?.length ?? 0,
    }
    return counts
  }, [grouped])

  if (envelope.rules.length === 0) {
    return (
      <div className="py-12 text-center text-gray-500 dark:text-gray-400">
        <HiBookOpen className="mx-auto mb-3 h-8 w-8 text-gray-400" />
        No rules declared on this block.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Severity tally header */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-3 dark:border-gray-700">
        {SEVERITY_ORDER.filter((s) => totals[s] > 0).map((severity) => {
          const badge = SEVERITY_BADGE[severity]
          return (
            <Badge key={severity} color={badge.color} size="sm">
              {totals[severity]} {badge.label}
            </Badge>
          )
        })}
      </div>

      {/* Per-severity sections */}
      {SEVERITY_ORDER.map((severity) => {
        const rules = grouped.get(severity)
        if (!rules || rules.length === 0) return null
        return (
          <SeveritySection key={severity} severity={severity} rules={rules} />
        )
      })}
    </div>
  )
}

interface SeveritySectionProps {
  severity: Severity
  rules: EnvelopeRule[]
}

const SeveritySection: FC<SeveritySectionProps> = ({ severity, rules }) => {
  const SeverityIcon = SEVERITY_ICON[severity]
  const badge = SEVERITY_BADGE[severity]
  return (
    <div>
      <div className="mb-3 flex items-center gap-2 text-xs font-semibold tracking-wide text-gray-400 uppercase">
        <SeverityIcon className="h-4 w-4" />
        {badge.label} ({rules.length})
      </div>
      <ul className="space-y-2">
        {rules.map((rule) => (
          <RuleRow key={rule.id} rule={rule} severity={severity} />
        ))}
      </ul>
    </div>
  )
}

interface RuleRowProps {
  rule: EnvelopeRule
  severity: Severity
}

const RuleRow: FC<RuleRowProps> = ({ rule, severity }) => {
  const SeverityIcon = SEVERITY_ICON[severity]
  const title = rule.ruleMessage || rule.ruleExpression
  const tone =
    severity === 'error'
      ? 'border-red-200 bg-red-50/40 dark:border-red-900/50 dark:bg-red-900/10'
      : severity === 'warning'
        ? 'border-amber-200 bg-amber-50/40 dark:border-amber-900/50 dark:bg-amber-900/10'
        : 'border-primary-200 bg-primary-50/40 dark:border-primary-900/50 dark:bg-primary-900/10'
  const iconTone =
    severity === 'error'
      ? 'text-red-500 dark:text-red-400'
      : severity === 'warning'
        ? 'text-amber-500 dark:text-amber-400'
        : 'text-primary-500 dark:text-primary-400'

  return (
    <li className={`rounded-lg border p-3 ${tone}`}>
      <div className="flex gap-3">
        <SeverityIcon className={`mt-0.5 h-5 w-5 shrink-0 ${iconTone}`} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {title}
            </span>
            {(rule.rulePattern || rule.ruleCheckKind) && (
              <code className="rounded bg-gray-200 px-1.5 py-0.5 font-mono text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                {rule.rulePattern ?? rule.ruleCheckKind}
              </code>
            )}
            <span className="text-xs text-gray-400">{rule.ruleOrigin}</span>
            {rule.ruleTarget && (
              <span className="text-xs text-gray-400">
                target: {rule.ruleTarget.targetKind}
              </span>
            )}
            {rule.ruleCategory && (
              <span className="ml-auto truncate text-xs text-gray-400">
                {rule.ruleCategory}
              </span>
            )}
          </div>
          {rule.ruleMessage && rule.ruleExpression !== title && (
            <code className="mt-1 block truncate font-mono text-xs text-gray-500 dark:text-gray-500">
              {rule.ruleExpression}
            </code>
          )}
          {rule.ruleVariables.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {rule.ruleVariables.map((v) => (
                <span
                  key={v.variableName}
                  className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[10px] text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                  title={v.variableQname}
                >
                  ${v.variableName}
                  <span className="text-gray-400"> → </span>
                  {v.variableQname}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </li>
  )
}

export default BusinessRulesProjection
