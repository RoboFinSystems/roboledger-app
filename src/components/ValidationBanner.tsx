'use client'

import { Badge } from 'flowbite-react'
import type { FC } from 'react'
import {
  HiCheckCircle,
  HiExclamationCircle,
  HiMinusCircle,
} from 'react-icons/hi'

export type ValidationStatus = 'passed' | 'failed' | 'inconclusive'

/**
 * The guard-rail outcome as every statement surface returns it — the
 * envelope's `rendering.validation` (GraphQL) and the live / saved-report
 * `validation` (REST) share these fields.
 */
export interface ValidationOutcome {
  passed: boolean
  status?: string | null
  failures: string[]
  warnings: string[]
}

/**
 * Resolve the tri-state. `status` is authoritative; the `passed` fallback
 * covers a backend that predates the field.
 */
export function validationStatus(
  validation: Pick<ValidationOutcome, 'passed' | 'status'>
): ValidationStatus {
  const { status } = validation
  if (status === 'passed' || status === 'failed' || status === 'inconclusive') {
    return status
  }
  return validation.passed ? 'passed' : 'failed'
}

/** One kind of finding, across every period that raised it. */
export interface FindingGroup {
  /** The message with any number that varies across the group elided. */
  title: string
  /** True when every message is the same text and only the period differs. */
  uniform: boolean
  /** The findings as the server sent them, in order. */
  messages: string[]
  /** Period labels from the `[…]` prefixes, in order; empty when unprefixed. */
  periods: string[]
}

const PERIOD_PREFIX = /^\[([^\]]+)\]\s*/
const NUMBER = /-?\d[\d,]*(?:\.\d+)?/g

/**
 * Collapse per-period repeats into one group per kind of finding.
 *
 * The guard rails run once per rendered column and prefix each finding with
 * its period (`[2024-07-31] …`, `[Current] …`). A two-column statement yields
 * a handful of lines; a 25-month series yields the same three messages 25
 * times over. Findings group on the message with the prefix stripped and
 * numbers treated as wildcards, so "… (-3152.32 vs operating cash -2641.63)"
 * and "… (8148.57 vs operating cash 6009.03)" are one kind, not two.
 *
 * Only the numbers that actually differ within a group are elided from its
 * title — a constant one ("AWS RI 2024-07 Prepaid") is part of the name.
 */
export function groupFindings(findings: readonly string[]): FindingGroup[] {
  const groups = new Map<
    string,
    { bodies: string[]; messages: string[]; periods: string[] }
  >()
  for (const message of findings) {
    const prefix = PERIOD_PREFIX.exec(message)
    const body = prefix ? message.slice(prefix[0].length) : message
    const key = body.replace(NUMBER, '\u0000')
    const group = groups.get(key) ?? { bodies: [], messages: [], periods: [] }
    group.bodies.push(body)
    group.messages.push(message)
    if (prefix) group.periods.push(prefix[1])
    groups.set(key, group)
  }

  return [...groups.values()].map(({ bodies, messages, periods }) => {
    const numbers = bodies.map((body) => body.match(NUMBER) ?? [])
    let position = 0
    const title = bodies[0].replace(NUMBER, (match) => {
      const k = position++
      return numbers.every((n) => n[k] === match) ? match : '…'
    })
    return {
      title,
      uniform: bodies.every((body) => body === bodies[0]),
      messages,
      periods,
    }
  })
}

const FindingList: FC<{ findings: string[]; className: string }> = ({
  findings,
  className,
}) => (
  <ul className={`mt-2 space-y-1 text-sm ${className}`}>
    {groupFindings(findings).map((group, i) =>
      group.messages.length === 1 ? (
        <li key={i}>{group.messages[0]}</li>
      ) : (
        <li key={i}>
          <details>
            <summary className="cursor-pointer">
              {group.title}
              <span className="ml-2 text-xs whitespace-nowrap opacity-70">
                {group.messages.length} periods
              </span>
            </summary>
            {group.uniform && group.periods.length === group.messages.length ? (
              // Same text every period — the periods are the only detail.
              <p className="mt-1 ml-4 text-xs opacity-80">
                {group.periods.join(', ')}
              </p>
            ) : (
              <ul className="mt-1 ml-4 space-y-0.5 text-xs opacity-80">
                {group.messages.map((message, j) => (
                  <li key={j}>{message}</li>
                ))}
              </ul>
            )}
          </details>
        </li>
      )
    )}
  </ul>
)

interface ValidationBannerProps {
  validation: ValidationOutcome
  className?: string
}

/**
 * Guard-rail badge + findings for a rendered statement.
 *
 * Three states, not two: `inconclusive` means no validation rules exist for
 * the block type (the statement of equity today) and nothing was checked —
 * it renders neutral, never as a green "passed". Failures list in red;
 * warnings (a cash-flow reconciling plug larger than operating cash, a
 * subtotal that does not foot in one column) list in amber so the reader
 * sees the finding, not just a count. A finding raised in several periods
 * collapses to one line (`groupFindings`); the badge still counts every one.
 */
const ValidationBanner: FC<ValidationBannerProps> = ({
  validation,
  className = 'mt-4 border-t border-gray-200 pt-4 dark:border-gray-700',
}) => {
  const status = validationStatus(validation)
  const warningCount = validation.warnings.length

  return (
    <div className={className} data-testid="validation-banner">
      <div className="flex items-center gap-2 text-sm">
        {status === 'passed' && (
          <Badge color="success" size="sm">
            <HiCheckCircle className="mr-1 inline h-3 w-3" />
            Validation Passed
          </Badge>
        )}
        {status === 'failed' && (
          <Badge color="failure" size="sm">
            <HiExclamationCircle className="mr-1 inline h-3 w-3" />
            Validation Failed
          </Badge>
        )}
        {status === 'inconclusive' && (
          <Badge color="gray" size="sm">
            <HiMinusCircle className="mr-1 inline h-3 w-3" />
            Not validated
          </Badge>
        )}
        {status !== 'inconclusive' && warningCount > 0 && (
          <Badge color="warning" size="sm">
            {warningCount} warning{warningCount !== 1 ? 's' : ''}
          </Badge>
        )}
      </div>
      {validation.failures.length > 0 && (
        <FindingList findings={validation.failures} className="text-red-400" />
      )}
      {warningCount > 0 && (
        <FindingList
          findings={validation.warnings}
          className={
            status === 'inconclusive'
              ? 'text-gray-500 dark:text-gray-400'
              : 'text-amber-600 dark:text-amber-400'
          }
        />
      )}
    </div>
  )
}

export default ValidationBanner
