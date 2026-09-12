'use client'

import type {
  ChartTemplateKey,
  InitializeChartOfAccountsResult,
  LedgerChartTemplate,
} from '@robosystems/client/clients'
import { clients } from '@robosystems/core'
import { Alert, Button, Label, Select } from 'flowbite-react'
import { type FC, useCallback, useEffect, useState } from 'react'
import {
  HiCheckCircle,
  HiCollection,
  HiExclamationCircle,
} from 'react-icons/hi'

interface ChartTemplatePickerProps {
  graphId: string
  /** Called once the chart exists; the page reloads its accounts. */
  onInitialized: (result: InitializeChartOfAccountsResult) => void
}

/** Legal forms the templates map equity for. '' = use the entity's own. */
const ENTITY_TYPES: ReadonlyArray<{ value: string; label: string }> = [
  { value: '', label: "Use this entity's legal form" },
  { value: 'corporation', label: 'Corporation' },
  { value: 'llc', label: 'Limited liability company' },
  { value: 'partnership', label: 'Partnership' },
]

// The chart-of-accounts empty state for a graph keeping native books. One
// explicit, one-time action: pick a shipped template and the chart is created
// with its reporting mappings already in place. A QuickBooks-synced graph never
// sees this — its chart arrives with the first sync.
export const ChartTemplatePicker: FC<ChartTemplatePickerProps> = ({
  graphId,
  onInitialized,
}) => {
  const [templates, setTemplates] = useState<LedgerChartTemplate[] | undefined>(
    undefined
  )
  const [loadError, setLoadError] = useState<string | null>(null)
  const [selectedKey, setSelectedKey] = useState<ChartTemplateKey | null>(null)
  const [entityType, setEntityType] = useState('')
  const [initializing, setInitializing] = useState(false)
  const [initError, setInitError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setTemplates(undefined)
    setLoadError(null)
    clients.ledger
      .listChartTemplates(graphId)
      .then((rows) => {
        if (cancelled) return
        setTemplates(rows)
        setSelectedKey(
          (current) => current ?? (rows[0]?.key as ChartTemplateKey) ?? null
        )
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setLoadError(
          err instanceof Error ? err.message : 'Failed to load chart templates.'
        )
        setTemplates([])
      })
    return () => {
      cancelled = true
    }
  }, [graphId])

  const handleInitialize = useCallback(async () => {
    if (!selectedKey) return
    setInitializing(true)
    setInitError(null)
    try {
      const result = await clients.ledger.initializeChartOfAccounts(
        graphId,
        selectedKey,
        { entityType: entityType || null }
      )
      onInitialized(result)
    } catch (err) {
      setInitError(
        err instanceof Error
          ? err.message
          : 'Failed to initialize the chart of accounts.'
      )
    } finally {
      setInitializing(false)
    }
  }, [graphId, selectedKey, entityType, onInitialized])

  if (templates === undefined) {
    return null // still loading; don't flash the picker
  }

  return (
    <div className="p-8">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-start gap-3">
          <HiCollection className="mt-0.5 h-6 w-6 shrink-0 text-gray-400" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Start from a template
            </h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              This graph has no chart of accounts. Pick a template and the chart
              is created with its reporting mappings already in place; customize
              the accounts afterwards. Connecting QuickBooks instead? Its chart
              arrives with the first sync — skip this.
            </p>
          </div>
        </div>

        {loadError && (
          <Alert color="warning" icon={HiExclamationCircle} className="mt-4">
            Could not load chart templates: {loadError}
          </Alert>
        )}

        {templates.length > 0 && (
          <>
            <div
              role="radiogroup"
              aria-label="Chart template"
              className="mt-5 grid gap-3 sm:grid-cols-3"
            >
              {templates.map((template) => {
                const selected = template.key === selectedKey
                return (
                  <button
                    key={template.key}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() =>
                      setSelectedKey(template.key as ChartTemplateKey)
                    }
                    disabled={initializing}
                    className={`rounded-lg border p-4 text-left transition ${
                      selected
                        ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500 dark:border-blue-400 dark:bg-blue-900/20'
                        : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {template.displayName}
                      </span>
                      {selected && (
                        <HiCheckCircle className="h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
                      )}
                    </div>
                    <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                      {template.description}
                    </p>
                    <p className="mt-2 text-xs text-gray-500">
                      {template.accountCount} accounts
                    </p>
                  </button>
                )
              })}
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="sm:w-72">
                <Label htmlFor="chart-template-entity-type">
                  Equity mapping
                </Label>
                <Select
                  id="chart-template-entity-type"
                  value={entityType}
                  onChange={(e) => setEntityType(e.target.value)}
                  disabled={initializing}
                >
                  {ENTITY_TYPES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </div>
              <Button
                color="blue"
                onClick={handleInitialize}
                disabled={initializing || !selectedKey}
              >
                {initializing
                  ? 'Creating chart...'
                  : 'Create chart of accounts'}
              </Button>
            </div>
          </>
        )}

        {initError && (
          <Alert color="failure" className="mt-4">
            {initError}
          </Alert>
        )}
      </div>
    </div>
  )
}
