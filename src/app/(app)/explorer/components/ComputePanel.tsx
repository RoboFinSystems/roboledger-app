'use client'

import type { ComputeMetricsResponse } from '@robosystems/client'
import { clients } from '@robosystems/core'
import { Button, Spinner, TextInput } from 'flowbite-react'
import type { FC } from 'react'
import { useCallback, useState } from 'react'
import { HiCalculator, HiExclamationCircle } from 'react-icons/hi'
import { formatCurrencyDollars } from '../../ledger/close/utils'

interface ComputePanelProps {
  graphId: string
  structureId: string
  /** Refetch the envelope so the new standing period appears. */
  onComputed: () => Promise<void> | void
}

/**
 * Compute bar for metric blocks — pick a period end, run
 * `compute-metrics`, and the standing time series gains (or replaces)
 * that period's column. The response's computed/skipped split renders
 * inline: skips carry a reason (e.g. a missing operand fact) rather
 * than failing the run, and showing them is the point — it tells the
 * user *why* a metric has no value at this period.
 */
const ComputePanel: FC<ComputePanelProps> = ({
  graphId,
  structureId,
  onComputed,
}) => {
  const [periodEnd, setPeriodEnd] = useState('')
  const [isComputing, setIsComputing] = useState(false)
  const [result, setResult] = useState<ComputeMetricsResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleCompute = useCallback(async () => {
    if (!periodEnd) return
    try {
      setIsComputing(true)
      setError(null)
      setResult(null)
      const response = await clients.ledger.computeMetrics(graphId, {
        structure_id: structureId,
        period_end: periodEnd,
      })
      setResult(response)
      await onComputed()
    } catch (err) {
      console.error('Error computing metrics:', err)
      setError('Failed to compute metrics for this period.')
    } finally {
      setIsComputing(false)
    }
  }, [graphId, structureId, periodEnd, onComputed])

  return (
    <div className="mb-4 border-b border-gray-200 pb-3 dark:border-gray-700">
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-xs font-medium text-gray-400">
          Compute period:
        </span>
        <TextInput
          type="date"
          sizing="sm"
          value={periodEnd}
          onChange={(e) => setPeriodEnd(e.target.value)}
          disabled={isComputing}
        />
        <Button
          size="xs"
          color="primary"
          onClick={handleCompute}
          disabled={isComputing || !periodEnd}
        >
          {isComputing ? (
            <Spinner size="xs" className="mr-1.5" />
          ) : (
            <HiCalculator className="mr-1.5 h-3.5 w-3.5" />
          )}
          Compute
        </Button>
      </div>

      {error && (
        <div className="mt-2 flex items-center gap-2 text-sm text-red-500">
          <HiExclamationCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {result && (
        <div className="mt-3 text-sm">
          <p className="text-gray-600 dark:text-gray-300">
            Computed {result.computed?.length ?? 0} metric
            {(result.computed?.length ?? 0) !== 1 ? 's' : ''} for{' '}
            {result.period_end}
            {(result.skipped?.length ?? 0) > 0 &&
              ` · ${result.skipped?.length} skipped`}
          </p>
          {(result.computed?.length ?? 0) > 0 && (
            <ul className="mt-1.5 space-y-0.5">
              {result.computed?.map((metric) => (
                <li
                  key={metric.rule_id}
                  className="flex items-baseline justify-between gap-4 text-gray-700 dark:text-gray-300"
                >
                  <span>{metric.name}</span>
                  <span className="font-mono">
                    {metric.unit === 'USD'
                      ? formatCurrencyDollars(metric.value)
                      : metric.value.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {(result.skipped?.length ?? 0) > 0 && (
            <ul className="mt-1.5 space-y-0.5">
              {result.skipped?.map((skip) => (
                <li
                  key={skip.rule_id}
                  className="text-gray-500 dark:text-gray-400"
                >
                  <span className="font-medium">
                    {skip.element_qname ?? skip.rule_id}
                  </span>{' '}
                  — {skip.reason}
                  {(skip.missing?.length ?? 0) > 0 &&
                    ` (missing: ${skip.missing?.join(', ')})`}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

export default ComputePanel
