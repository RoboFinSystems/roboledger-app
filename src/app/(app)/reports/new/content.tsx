'use client'

import { PageHeader } from '@/components/PageHeader'
import {
  customTheme,
  extensions,
  GraphFilters,
  PageLayout,
  useGraphContext,
} from '@/lib/core'
import type {
  MappingCoverage,
  MappingInfo,
} from '@robosystems/client/extensions'
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

const ReportBuilderContent: FC = function () {
  const router = useRouter()
  const { state: graphState } = useGraphContext()

  // Form state
  const [reportName, setReportName] = useState('')
  const [periodStart, setPeriodStart] = useState('')
  const [periodEnd, setPeriodEnd] = useState('')
  const [comparative, setComparative] = useState(true)

  // Data state
  const [mappings, setMappings] = useState<MappingInfo[]>([])
  const [selectedMappingId, setSelectedMappingId] = useState<string | null>(
    null
  )
  const [coverage, setCoverage] = useState<MappingCoverage | null>(null)
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

  // Load mappings
  useEffect(() => {
    const loadMappings = async () => {
      if (!currentGraph) {
        setMappings([])
        setIsLoadingMappings(false)
        return
      }

      try {
        setIsLoadingMappings(true)
        const result = await extensions.ledger.listMappings(
          currentGraph.graphId
        )
        setMappings(result)
        if (result.length > 0) {
          setSelectedMappingId(result[0].id)
        }
      } catch (err) {
        console.error('Error loading mappings:', err)
        setError('Failed to load mapping structures.')
      } finally {
        setIsLoadingMappings(false)
      }
    }

    loadMappings()
  }, [currentGraph])

  // Load coverage when mapping selected
  useEffect(() => {
    const loadCoverage = async () => {
      if (!currentGraph || !selectedMappingId) {
        setCoverage(null)
        return
      }

      try {
        const result = await extensions.ledger.getMappingCoverage(
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
      await extensions.ledger.autoMap(currentGraph.graphId, selectedMappingId)
      // Refresh coverage after auto-map completes
      // The agent runs async, so we poll for updated coverage
      setTimeout(async () => {
        try {
          const result = await extensions.ledger.getMappingCoverage(
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

      const report = await extensions.reports.create(currentGraph.graphId, {
        name: reportName || `Report ${periodStart} to ${periodEnd}`,
        mappingId: selectedMappingId,
        periodStart,
        periodEnd,
        comparative,
      })

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
    router,
  ])

  const isValid =
    selectedMappingId && periodStart && periodEnd && periodEnd >= periodStart

  return (
    <PageLayout>
      <PageHeader
        icon={TbReportAnalytics}
        title="Create Report"
        description="Generate financial statements from your mapped trial balance"
        gradient="from-orange-500 to-red-600"
        actions={
          <Button
            theme={customTheme.button}
            color="light"
            onClick={() => router.push('/reports')}
          >
            <HiChevronLeft className="mr-2 h-5 w-5" />
            Back to Reports
          </Button>
        }
      />

      {error && (
        <Alert theme={customTheme.alert} color="failure">
          <HiExclamationCircle className="h-4 w-4" />
          <span className="font-medium">Error:</span> {error}
        </Alert>
      )}

      {/* Mapping Selection */}
      <Card theme={customTheme.card}>
        <h3 className="font-heading text-lg font-bold dark:text-white">
          1. Select Mapping
        </h3>
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          Choose the CoA → GAAP mapping that determines how your accounts roll
          up to reporting concepts.
        </p>

        {isLoadingMappings ? (
          <div className="flex justify-center py-6">
            <Spinner size="lg" />
          </div>
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
                  theme={customTheme.button}
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
                      theme={customTheme.button}
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
      <Card theme={customTheme.card}>
        <h3 className="font-heading text-lg font-bold dark:text-white">
          2. Configure Report
        </h3>
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          Set the report name, period, and options. The system generates Income
          Statement, Balance Sheet, and Cash Flow from the same data.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="report-name">Report Name</Label>
            <TextInput
              theme={customTheme.textInput}
              id="report-name"
              placeholder="e.g., Q1 2026 Financial Statements"
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="period-start">Period Start</Label>
            <TextInput
              theme={customTheme.textInput}
              id="period-start"
              type="date"
              value={periodStart}
              onChange={(e) => setPeriodStart(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="period-end">Period End</Label>
            <TextInput
              theme={customTheme.textInput}
              id="period-end"
              type="date"
              value={periodEnd}
              onChange={(e) => setPeriodEnd(e.target.value)}
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
      </Card>

      {/* Generate */}
      <Card theme={customTheme.card}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-heading text-lg font-bold dark:text-white">
              3. Generate
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Creates facts for all mapped elements and renders all financial
              statements.
            </p>
          </div>
          <Button
            theme={customTheme.button}
            color="primary"
            size="lg"
            onClick={handleGenerate}
            disabled={!isValid || isGenerating}
          >
            {isGenerating ? (
              <>
                <Spinner size="sm" className="mr-2" />
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
