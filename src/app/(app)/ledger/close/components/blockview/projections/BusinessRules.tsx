'use client'

import type { FC } from 'react'
import { useMemo } from 'react'
import { HiBookOpen } from 'react-icons/hi'
import type { EnvelopeBlock, EnvelopeRule } from '../types'

type Severity = 'error' | 'warning' | 'info'

/**
 * How each severity is described in the UI.
 *
 * `ruleSeverity` declares *what a failure would be reported as* — it is a
 * property of the rule, not an observation about the data. Naming the
 * groups "Error" / "Warning" and painting them red and amber made a
 * catalog of healthy rules read as a list of live failures: a block whose
 * every rule passed still announced "10 Error" in alert colours.
 *
 * So severity is carried by wording and type weight only. Colour is
 * reserved for the `VerificationResults` projection, where it reports
 * something that actually happened.
 */
const SEVERITY_COPY: Record<
  Severity,
  { label: string; note: string; emphasis: string }
> = {
  error: {
    label: 'Blocking',
    note: 'a failure here is reported as an error',
    emphasis: 'font-semibold',
  },
  warning: {
    label: 'Advisory',
    note: 'a failure here is reported as a warning',
    emphasis: 'font-medium',
  },
  info: {
    label: 'Informational',
    note: 'recorded for information only',
    emphasis: 'italic',
  },
}

// Strictest first, so a glance lands on the invariants that would block.
const SEVERITY_ORDER: Severity[] = ['error', 'warning', 'info']

interface BusinessRulesProjectionProps {
  envelope: EnvelopeBlock
}

function normalizeSeverity(s: string): Severity {
  if (s === 'error' || s === 'warning' || s === 'info') return s
  return 'info'
}

/**
 * Charlie's `BusinessRules` View projection.
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
 * rules themselves regardless of whether they've been evaluated. That
 * distinction is why this projection is deliberately colourless: it
 * reports coverage, and nothing on it has happened yet. Severity is
 * conveyed by wording and type weight (see `SEVERITY_COPY`), leaving red
 * and amber to mean something on the results view.
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
      {/* Severity tally — a statement of coverage, not of outcome. */}
      <div className="border-b border-gray-200 pb-3 text-sm text-gray-600 dark:border-gray-700 dark:text-gray-400">
        <span className="text-gray-500 dark:text-gray-500">
          {envelope.rules.length === 1
            ? '1 rule applies to this block'
            : `${envelope.rules.length} rules apply to this block`}
          {': '}
        </span>
        {SEVERITY_ORDER.filter((s) => totals[s] > 0).map(
          (severity, i, shown) => (
            <span key={severity}>
              <span
                className={`text-gray-900 dark:text-gray-100 ${SEVERITY_COPY[severity].emphasis}`}
              >
                {totals[severity]} {SEVERITY_COPY[severity].label.toLowerCase()}
              </span>
              {i < shown.length - 1 && (
                <span className="text-gray-400">{' · '}</span>
              )}
            </span>
          )
        )}
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
  const copy = SEVERITY_COPY[severity]
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-baseline gap-x-2 border-b border-gray-100 pb-1.5 dark:border-gray-800">
        <span
          className={`text-xs tracking-wide text-gray-500 uppercase dark:text-gray-400 ${copy.emphasis}`}
        >
          {copy.label} ({rules.length})
        </span>
        <span className="text-xs text-gray-400 italic dark:text-gray-500">
          {copy.note}
        </span>
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
  const title = rule.ruleMessage || rule.ruleExpression

  return (
    <li className="rounded-lg border border-gray-200 bg-gray-50/50 p-3 dark:border-gray-700 dark:bg-gray-800/30">
      <div className="flex gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span
              className={`text-sm text-gray-900 dark:text-gray-100 ${SEVERITY_COPY[severity].emphasis}`}
            >
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
