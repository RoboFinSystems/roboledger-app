'use client'

import { customTheme, useOperationMonitoring } from '@/lib/core'
import { opMaterialize, client as sdkClient } from '@robosystems/client'
import { Alert, Badge, Button, Card, Progress } from 'flowbite-react'
import { type FC, useCallback, useState } from 'react'
import { HiRefresh } from 'react-icons/hi'

interface MaterializeGraphCardProps {
  graphId: string
}

interface MaterializeResultSummary {
  tables?: number
  rows?: number
  duration_ms?: number
}

interface MaterializeTaskResult {
  status?: string
  tables_materialized?: string[]
  total_rows?: number
  duration_ms?: number
  errors?: unknown[]
}

/**
 * Card surfacing the graph materialize op (§3.4).
 *
 * Materialization refreshes the LadybugDB representation of the
 * extensions OLTP data so analytical-view operations (fact-grid,
 * financial-statement-analysis, Cypher queries) return current state.
 * It's a periodic admin action — typically after a close, after a
 * large batch import, or whenever derived views feel stale.
 */
export const MaterializeGraphCard: FC<MaterializeGraphCardProps> = ({
  graphId,
}) => {
  const { startMonitoring, progress, currentStep, error, status, isLoading } =
    useOperationMonitoring()
  const [resultSummary, setResultSummary] =
    useState<MaterializeResultSummary | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [rebuild, setRebuild] = useState(false)

  const handleMaterialize = useCallback(async () => {
    if (!graphId) return
    setSubmitError(null)
    setResultSummary(null)
    try {
      const response = await opMaterialize({
        client: sdkClient,
        path: { graph_id: graphId },
        body: { source: 'extensions', rebuild },
      })
      if (response.error) {
        const errorMsg =
          typeof response.error === 'object' && 'detail' in response.error
            ? String((response.error as { detail: unknown }).detail)
            : 'Failed to start materialization'
        setSubmitError(errorMsg)
        return
      }
      const operationId = response.data?.operationId
      if (!operationId) {
        setSubmitError('Server did not return an operation id.')
        return
      }
      const final = await startMonitoring(operationId)
      // `useOperationMonitoring.startMonitoring` returns `result.result ||
      // result`. The task's payload is documented in
      // `operations/graph/tasks/extensions_materialize.py`: status +
      // tables_materialized (list[str]) + total_rows (int) + duration_ms.
      const task = (final ?? {}) as MaterializeTaskResult & {
        result?: MaterializeTaskResult
      }
      const payload: MaterializeTaskResult = task.result ?? task
      if (
        payload.duration_ms !== undefined ||
        payload.total_rows !== undefined
      ) {
        setResultSummary({
          tables: payload.tables_materialized?.length,
          rows: payload.total_rows,
          duration_ms: payload.duration_ms,
        })
      }
      if (payload.status === 'error' && payload.errors?.length) {
        setSubmitError(String(payload.errors[0]))
      }
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Failed to materialize graph.'
      )
    }
  }, [graphId, rebuild, startMonitoring])

  return (
    <Card theme={customTheme.card}>
      <div className="mb-4 border-b border-gray-200 pb-4 dark:border-gray-600">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Graph Index
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Refresh the LadybugDB analytical index from current OLTP data. Run
          after a close or when reports / fact grids feel stale.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
              checked={rebuild}
              onChange={(e) => setRebuild(e.target.checked)}
              disabled={isLoading}
            />
            <span>
              Rebuild from scratch
              <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
                (drops existing graph data first)
              </span>
            </span>
          </label>
          <Button
            theme={customTheme.button}
            color="primary"
            onClick={handleMaterialize}
            disabled={!graphId || isLoading}
            size="sm"
          >
            <HiRefresh
              className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
            />
            {isLoading ? 'Refreshing...' : 'Refresh Graph Index'}
          </Button>
        </div>

        {isLoading && (
          <div className="space-y-2">
            <Progress progress={progress} size="sm" color="blue" />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {currentStep || 'Starting materialization...'}
            </p>
          </div>
        )}

        {submitError && (
          <Alert theme={customTheme.alert} color="failure">
            {submitError}
          </Alert>
        )}

        {error && (
          <Alert theme={customTheme.alert} color="failure">
            {error}
          </Alert>
        )}

        {status === 'completed' && resultSummary && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800/40 dark:bg-green-900/20">
            <div className="flex flex-wrap items-center gap-3">
              <Badge color="success" size="sm">
                Refreshed
              </Badge>
              {typeof resultSummary.tables === 'number' && (
                <span className="text-sm text-gray-700 dark:text-gray-200">
                  <span className="font-semibold">
                    {resultSummary.tables.toLocaleString()}
                  </span>{' '}
                  tables
                </span>
              )}
              {typeof resultSummary.rows === 'number' && (
                <span className="text-sm text-gray-700 dark:text-gray-200">
                  <span className="font-semibold">
                    {resultSummary.rows.toLocaleString()}
                  </span>{' '}
                  rows
                </span>
              )}
              {typeof resultSummary.duration_ms === 'number' && (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  in {(resultSummary.duration_ms / 1000).toFixed(1)}s
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
