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
 * sees the finding, not just a count.
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
        <ul className="mt-2 text-sm text-red-400">
          {validation.failures.map((f, i) => (
            <li key={i}>{f}</li>
          ))}
        </ul>
      )}
      {warningCount > 0 && (
        <ul
          className={`mt-2 text-sm ${
            status === 'inconclusive'
              ? 'text-gray-500 dark:text-gray-400'
              : 'text-amber-600 dark:text-amber-400'
          }`}
        >
          {validation.warnings.map((w, i) => (
            <li key={i}>{w}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default ValidationBanner
