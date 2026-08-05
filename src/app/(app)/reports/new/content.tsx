'use client'

import type {
  LedgerMappingCoverage,
  LedgerMappingInfo,
  PeriodSpecInput,
} from '@robosystems/client/clients'
import {
  clients,
  GraphFilters,
  LoadingState,
  PageHeader,
  PageLayout,
  useGraphContext,
} from '@robosystems/core'
import {
  Alert,
  Badge,
  Button,
  Card,
  Label,
  Progress,
  Spinner,
  TextInput,
  ToggleSwitch,
} from 'flowbite-react'
import { useRouter } from 'next/navigation'
import type { FC } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  HiChevronLeft,
  HiExclamationCircle,
  HiLightningBolt,
  HiSparkles,
} from 'react-icons/hi'
import { TbReportAnalytics } from 'react-icons/tb'
import { buildPresetPeriods, type PresetKey } from './presetPeriods'

// ── Period Presets ────────────────────────────────────────────────────────

interface PresetOption {
  key: PresetKey
  label: string
  description: string
}

const PRESETS: PresetOption[] = [
  {
    key: 'this_month',
    label: 'This Month',
    description: 'Current month',
  },
  {
    key: 'last_month',
    label: 'Last Month',
    description: 'Prior month with comparison',
  },
  {
    key: 'this_quarter',
    label: 'This Quarter',
    description: 'Current quarter',
  },
  {
    key: 'last_quarter',
    label: 'Last Quarter',
    description: 'Prior quarter with comparison',
  },
  {
    key: 'monthly_ytd',
    label: 'Monthly YTD',
    description: 'Each month this year',
  },
  {
    key: 'monthly_full_year',
    label: 'Monthly (Full Year)',
    description: 'Trailing 12 months',
  },
  {
    key: 'annual_comparison',
    label: 'Year over Year',
    description: 'This year vs prior year',
  },
  {
    key: 'custom',
    label: 'Custom',
    description: 'Set dates manually',
  },
]

const ReportBuilderContent: FC = function () {
  const router = useRouter()
  const { state: graphState } = useGraphContext()

  // Form state
  const [reportName, setReportName] = useState('')
  const [periodStart, setPeriodStart] = useState('')
  const [periodEnd, setPeriodEnd] = useState('')
  const [comparative, setComparative] = useState(true)
  const [selectedPreset, setSelectedPreset] =
    useState<PresetKey>('last_quarter')
  const [periods, setPeriods] = useState<PeriodSpecInput[] | undefined>(
    undefined
  )

  // Data state
  const [mappings, setMappings] = useState<LedgerMappingInfo[]>([])
  const [selectedMappingId, setSelectedMappingId] = useState<string | null>(
    null
  )
  const [coverage, setCoverage] = useState<LedgerMappingCoverage | null>(null)
  const [isLoadingMappings, setIsLoadingMappings] = useState(true)

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false)
  const [isAutoMapping, setIsAutoMapping] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const currentGraph = useMemo(() => {
    const roboledgerGraphs = graphState.graphs.filter(GraphFilters.roboledger)
    return (
      roboledgerGraphs.find((g) => g.graphId === graphState.currentGraphId) ??
      roboledgerGraphs[0]
    )
  }, [graphState.graphs, graphState.currentGraphId])

  // Apply preset on mount and when preset changes
  useEffect(() => {
    if (selectedPreset === 'custom') {
      // Drop the previous preset's multi-period spec. The custom form presents
      // a single start/end pair, so leaving it set would submit periods the
      // user can no longer see or edit.
      setPeriods(undefined)
      return
    }
    const result = buildPresetPeriods(selectedPreset, new Date())
    setPeriodStart(result.periodStart)
    setPeriodEnd(result.periodEnd)
    setComparative(result.comparative)
    setPeriods(result.periods)
  }, [selectedPreset])

  // Load mappings
  useEffect(() => {
    if (!currentGraph) {
      setMappings([])
      setSelectedMappingId(null)
      setIsLoadingMappings(false)
      return
    }

    let cancelled = false
    const loadMappings = async () => {
      try {
        setIsLoadingMappings(true)
        const result = await clients.ledger.listMappings(currentGraph.graphId)
        if (cancelled) return
        setMappings(result)
        // Always re-seed from this graph's mappings. Leaving a previous graph's
        // id in place kept isValid truthy on a graph with no mappings, so
        // Generate would submit a mapping_id belonging to a different graph.
        setSelectedMappingId(result[0]?.id ?? null)
      } catch (err) {
        if (cancelled) return
        console.error('Error loading mappings:', err)
        setError('Failed to load mapping structures.')
        setMappings([])
        setSelectedMappingId(null)
      } finally {
        if (!cancelled) setIsLoadingMappings(false)
      }
    }

    loadMappings()
    return () => {
      cancelled = true
    }
  }, [currentGraph])

  // Load coverage when mapping selected
  useEffect(() => {
    const loadCoverage = async () => {
      if (!currentGraph || !selectedMappingId) {
        setCoverage(null)
        return
      }

      try {
        const result = await clients.ledger.getMappingCoverage(
          currentGraph.graphId,
          selectedMappingId
        )
        setCoverage(result)
      } catch (err) {
        console.error('Error loading coverage:', err)
      }
    }

    loadCoverage()
  }, [currentGraph, selectedMappingId])

  // Auto-map handler
  const handleAutoMap = useCallback(async () => {
    if (!currentGraph || !selectedMappingId) return

    try {
      setIsAutoMapping(true)
      setError(null)
      await clients.ledger.autoMapElements(currentGraph.graphId, {
        mapping_id: selectedMappingId,
      })
      // Refresh coverage after auto-map completes
      // The agent runs async, so we poll for updated coverage
      setTimeout(async () => {
        try {
          const result = await clients.ledger.getMappingCoverage(
            currentGraph.graphId,
            selectedMappingId
          )
          setCoverage(result)
        } catch {
          // ignore
        }
        setIsAutoMapping(false)
      }, 5000)
    } catch (err) {
      console.error('Auto-map failed:', err)
      setError('Auto-mapping failed. Please try again.')
      setIsAutoMapping(false)
    }
  }, [currentGraph, selectedMappingId])

  // Generate report
  const handleGenerate = useCallback(async () => {
    if (!currentGraph || !selectedMappingId || !periodStart || !periodEnd)
      return

    try {
      setIsGenerating(true)
      setError(null)

      const report = await clients.reports.createReport(currentGraph.graphId, {
        name: reportName || `Report ${periodStart} to ${periodEnd}`,
        mappingId: selectedMappingId,
        periodStart,
        periodEnd,
        comparative,
        periods,
      })

      // `createReport` is synchronous — the SDK returns the created
      // `ReportResponse` directly (envelope unwrapped in SDK 1.0; the
      // SDK itself rejects if the backend returns no result).
      router.push(`/reports/${report.id}?graph=${currentGraph.graphId}`)
    } catch (err) {
      console.error('Report generation failed:', err)
      setError('Failed to generate report. Please try again.')
      setIsGenerating(false)
    }
  }, [
    currentGraph,
    selectedMappingId,
    periodStart,
    periodEnd,
    reportName,
    comparative,
    periods,
    router,
  ])

  const isValid =
    selectedMappingId && periodStart && periodEnd && periodEnd >= periodStart

  const isMultiPeriod = periods && periods.length > 0

  return (
    <PageLayout>
      <PageHeader
        icon={TbReportAnalytics}
        title="Create Report"
        subtitle="Generate financial statements from your mapped trial balance"
        actions={
          <Button color="light" onClick={() => router.push('/reports')}>
            <HiChevronLeft className="mr-2 h-5 w-5" />
            Back to Reports
          </Button>
        }
      />

      {error && (
        <Alert color="failure">
          <HiExclamationCircle className="h-4 w-4" />
          <span className="font-medium">Error:</span> {error}
        </Alert>
      )}

      {/* Mapping Selection */}
      <Card>
        <h3 className="font-heading text-lg font-bold dark:text-white">
          1. Select Mapping
        </h3>
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          Choose the CoA → GAAP mapping that determines how your accounts roll
          up to reporting concepts.
        </p>

        {isLoadingMappings ? (
          <LoadingState className="py-6" />
        ) : mappings.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              No mapping structures found. Connect a data source first.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              {mappings.map((m) => (
                <Button
                  key={m.id}
                  color={selectedMappingId === m.id ? 'primary' : 'light'}
                  size="sm"
                  onClick={() => setSelectedMappingId(m.id)}
                >
                  {m.name}
                </Button>
              ))}
            </div>

            {/* Coverage */}
            {coverage && (
              <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium dark:text-white">
                    Mapping Coverage
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge
                      color={
                        coverage.coveragePercent >= 80 ? 'success' : 'warning'
                      }
                      size="sm"
                    >
                      {coverage.coveragePercent.toFixed(0)}%
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {coverage.mappedCount} / {coverage.totalCoaElements}{' '}
                      mapped
                    </span>
                  </div>
                </div>
                <Progress
                  progress={coverage.coveragePercent}
                  color={coverage.coveragePercent >= 80 ? 'green' : 'yellow'}
                  size="sm"
                />

                {coverage.unmappedCount > 0 && (
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {coverage.unmappedCount} unmapped element
                      {coverage.unmappedCount !== 1 ? 's' : ''}
                    </span>
                    <Button
                      color="purple"
                      size="xs"
                      onClick={handleAutoMap}
                      disabled={isAutoMapping}
                    >
                      {isAutoMapping ? (
                        <>
                          <Spinner size="xs" className="mr-2" />
                          Mapping...
                        </>
                      ) : (
                        <>
                          <HiSparkles className="mr-1 h-3 w-3" />
                          Auto-Map with AI
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Report Configuration */}
      <Card>
        <h3 className="font-heading text-lg font-bold dark:text-white">
          2. Configure Report
        </h3>
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          Set the report name and period. Choose a preset or set custom dates.
        </p>

        <div className="space-y-4">
          <div>
            <Label htmlFor="report-name">Report Name</Label>
            <TextInput
              id="report-name"
              placeholder="e.g., Q1 2026 Financial Statements"
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
            />
          </div>

          {/* Period Presets */}
          <div>
            <Label className="mb-2 block">Reporting Period</Label>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset.key}
                  onClick={() => setSelectedPreset(preset.key)}
                  className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                    selectedPreset === preset.key
                      ? 'border-orange-500 bg-orange-50 text-orange-700 dark:border-orange-400 dark:bg-orange-900/20 dark:text-orange-300'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className="font-medium">{preset.label}</div>
                  <div className="text-xs opacity-70">{preset.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Period Summary / Custom Dates */}
          {selectedPreset === 'custom' ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="period-start">Period Start</Label>
                <TextInput
                  id="period-start"
                  type="date"
                  value={periodStart}
                  onChange={(e) => {
                    setPeriodStart(e.target.value)
                    setPeriods(undefined)
                  }}
                />
              </div>
              <div>
                <Label htmlFor="period-end">Period End</Label>
                <TextInput
                  id="period-end"
                  type="date"
                  value={periodEnd}
                  onChange={(e) => {
                    setPeriodEnd(e.target.value)
                    setPeriods(undefined)
                  }}
                />
              </div>
              <div className="sm:col-span-2">
                <ToggleSwitch
                  checked={comparative}
                  label="Include prior period comparison"
                  onChange={setComparative}
                />
              </div>
            </div>
          ) : periodStart && periodEnd ? (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
              {isMultiPeriod ? (
                <div className="space-y-1">
                  <div className="text-sm font-medium dark:text-white">
                    {periods.length} period{periods.length !== 1 ? 's' : ''}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {periods.map((p, i) => (
                      <Badge key={i} color="gray" size="sm">
                        {p.label}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-sm dark:text-gray-300">
                  <span className="font-medium dark:text-white">Period:</span>{' '}
                  {periodStart} to {periodEnd}
                  {comparative && (
                    <span className="ml-2 text-gray-500">
                      + prior period comparison
                    </span>
                  )}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </Card>

      {/* Generate */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-heading text-lg font-bold dark:text-white">
              3. Generate
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Creates facts for all mapped elements and renders financial
              statements.
            </p>
          </div>
          <Button
            color="primary"
            size="lg"
            onClick={handleGenerate}
            disabled={!isValid || isGenerating}
          >
            {isGenerating ? (
              <>
                <Spinner size="sm" className="mr-2 text-white" />
                Generating...
              </>
            ) : (
              <>
                <HiLightningBolt className="mr-2 h-5 w-5" />
                Generate Report
              </>
            )}
          </Button>
        </div>
      </Card>
    </PageLayout>
  )
}

export default ReportBuilderContent
