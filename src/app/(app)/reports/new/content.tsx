'use client'

import { PageHeader } from '@/components/PageHeader'
import {
  customTheme,
  GraphFilters,
  PageLayout,
  SDK,
  useGraphContext,
} from '@/lib/core'
import type { MappingStructure } from '@/lib/ledger'
import { MAPPING_STRUCTURES_QUERY } from '@/lib/ledger'
import {
  Alert,
  Badge,
  Button,
  Card,
  Label,
  Progress,
  Select,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
  TextInput,
  ToggleSwitch,
} from 'flowbite-react'
import { useRouter } from 'next/navigation'
import type { FC } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  HiCheckCircle,
  HiChevronLeft,
  HiExclamationCircle,
  HiLightningBolt,
  HiOutlinePlusCircle,
  HiRefresh,
  HiSave,
  HiSparkles,
  HiTrash,
} from 'react-icons/hi'
import { TbReportAnalytics } from 'react-icons/tb'

// Report Section configuration
interface ReportSection {
  id: string
  title: string
  sourceType: 'transactions' | 'facts'
  periodStart: string
  periodEnd: string
  mappingStructureId: string | null
  rowDimension: string
  columnDimension: string
  previewData: PreviewData | null
  isPreviewLoading: boolean
}

interface PreviewData {
  headers: string[]
  rows: Array<{
    label: string
    values: (number | null)[]
    isHeader?: boolean
  }>
}

interface MappingStructureWithGraph extends MappingStructure {
  _graphId: string
  _graphName: string
}

// Fact Grid dimension configuration
const FACT_GRID_DIMENSIONS = [
  {
    id: 'time',
    name: 'Time Period',
    bgClass: 'bg-blue-900/50',
    textClass: 'text-blue-300',
  },
  {
    id: 'account',
    name: 'Account',
    bgClass: 'bg-purple-900/50',
    textClass: 'text-purple-300',
  },
  {
    id: 'entity',
    name: 'Entity',
    bgClass: 'bg-green-900/50',
    textClass: 'text-green-300',
  },
  {
    id: 'segment',
    name: 'Segment',
    bgClass: 'bg-orange-900/50',
    textClass: 'text-orange-300',
  },
]

// Report templates with pre-configured sections
const REPORT_TEMPLATES = [
  {
    id: 'balance_sheet',
    name: 'Balance Sheet',
    description: 'Assets, Liabilities, and Equity',
    sections: ['Assets', 'Liabilities', 'Stockholders Equity'],
  },
  {
    id: 'income_statement',
    name: 'Income Statement',
    description: 'Revenue, Expenses, and Net Income',
    sections: ['Revenue', 'Operating Expenses', 'Other Income/Expense'],
  },
  {
    id: 'cash_flow',
    name: 'Cash Flow Statement',
    description: 'Operating, Investing, Financing Activities',
    sections: ['Operating', 'Investing', 'Financing'],
  },
  {
    id: 'custom',
    name: 'Custom Report',
    description: 'Build from scratch',
    sections: [],
  },
]

// AI validation results
interface ValidationResult {
  status: 'valid' | 'warning' | 'error'
  checks: Array<{
    name: string
    status: 'pass' | 'warn' | 'fail'
    message: string
  }>
}

const generateId = () => Math.random().toString(36).substring(2, 9)

const ReportBuilderContent: FC = function () {
  const router = useRouter()
  const { state: graphState } = useGraphContext()

  // Report metadata
  const [reportName, setReportName] = useState('')
  const [reportType, setReportType] = useState('MONTHLY')
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)

  // Sections
  const [sections, setSections] = useState<ReportSection[]>([])
  const [activeSection, setActiveSection] = useState<string | null>(null)

  // Dimension toggles (AI-native features)
  const [includeSegments, setIncludeSegments] = useState(true)
  const [includeGeography, setIncludeGeography] = useState(false)
  const [includeComparatives, setIncludeComparatives] = useState(true)
  const [enableAIEnhancements, setEnableAIEnhancements] = useState(true)

  // AI Generation state
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [generationStep, setGenerationStep] = useState('')
  const [validation, setValidation] = useState<ValidationResult | null>(null)

  // Available data
  const [mappingStructures, setMappingStructures] = useState<
    MappingStructureWithGraph[]
  >([])
  const [isLoadingMappings, setIsLoadingMappings] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Get current graph
  const currentGraph = useMemo(() => {
    const roboledgerGraphs = graphState.graphs.filter(GraphFilters.roboledger)
    return roboledgerGraphs[0]
  }, [graphState.graphs])

  // Load mapping structures
  useEffect(() => {
    const loadMappings = async () => {
      if (!currentGraph) {
        setMappingStructures([])
        setIsLoadingMappings(false)
        return
      }

      try {
        setIsLoadingMappings(true)

        const response = await SDK.executeCypherQuery({
          path: { graph_id: currentGraph.graphId },
          query: { mode: 'sync' },
          body: {
            query: MAPPING_STRUCTURES_QUERY,
            parameters: {},
          },
        })

        if (response.data) {
          const data = response.data as {
            data?: Array<{
              identifier: string
              name: string
              description: string
              taxonomyUri: string
              targetTaxonomyUri: string
              associationCount: number
            }>
          }
          const rows = data.data || []

          const structures: MappingStructureWithGraph[] = rows.map((row) => ({
            identifier: row.identifier || '',
            name: row.name || 'Unnamed Structure',
            description: row.description,
            taxonomyUri: row.taxonomyUri || '',
            targetTaxonomyUri: row.targetTaxonomyUri || '',
            associationCount: row.associationCount || 0,
            _graphId: currentGraph.graphId,
            _graphName: currentGraph.graphName,
          }))

          setMappingStructures(structures)
        }
      } catch (err) {
        console.error('Error loading mapping structures:', err)
      } finally {
        setIsLoadingMappings(false)
      }
    }

    loadMappings()
  }, [currentGraph])

  // Add a new section
  const addSection = useCallback(() => {
    const today = new Date()
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)

    const newSection: ReportSection = {
      id: generateId(),
      title: `Section ${sections.length + 1}`,
      sourceType: 'transactions',
      periodStart: firstDay.toISOString().split('T')[0],
      periodEnd: lastDay.toISOString().split('T')[0],
      mappingStructureId: null,
      rowDimension: 'element',
      columnDimension: 'period',
      previewData: null,
      isPreviewLoading: false,
    }

    setSections((prev) => [...prev, newSection])
    setActiveSection(newSection.id)
  }, [sections.length])

  // Remove a section
  const removeSection = useCallback(
    (sectionId: string) => {
      setSections((prev) => prev.filter((s) => s.id !== sectionId))
      if (activeSection === sectionId) {
        setActiveSection(sections[0]?.id || null)
      }
    },
    [activeSection, sections]
  )

  // Update section
  const updateSection = useCallback(
    (sectionId: string, updates: Partial<ReportSection>) => {
      setSections((prev) =>
        prev.map((s) => (s.id === sectionId ? { ...s, ...updates } : s))
      )
    },
    []
  )

  // Handle template selection
  const selectTemplate = useCallback((templateId: string) => {
    setSelectedTemplate(templateId)
    const template = REPORT_TEMPLATES.find((t) => t.id === templateId)
    if (template && template.sections.length > 0) {
      setReportName(template.name)
      // Auto-create sections based on template
      const newSections: ReportSection[] = template.sections.map(
        (title, idx) => ({
          id: generateId(),
          title,
          sourceType: 'transactions' as const,
          periodStart: '2025-10-01',
          periodEnd: '2025-12-31',
          mappingStructureId: null,
          rowDimension: 'element',
          columnDimension: 'period',
          previewData: null,
          isPreviewLoading: false,
        })
      )
      setSections(newSections)
      if (newSections.length > 0) {
        setActiveSection(newSections[0].id)
      }
    }
  }, [])

  // AI-powered report generation (simulated)
  const generateWithAI = useCallback(async () => {
    if (!selectedTemplate) return

    setIsGenerating(true)
    setGenerationProgress(0)
    setValidation(null)

    const steps = [
      { progress: 15, step: 'Parsing report intent...' },
      { progress: 30, step: 'Discovering taxonomy elements...' },
      { progress: 50, step: 'Building fact grid from transactions...' },
      { progress: 70, step: 'Applying element mappings...' },
      { progress: 85, step: 'Validating against guard rails...' },
      { progress: 100, step: 'Report generation complete!' },
    ]

    for (const { progress, step } of steps) {
      await new Promise((resolve) => setTimeout(resolve, 600))
      setGenerationProgress(progress)
      setGenerationStep(step)
    }

    // TODO: Fetch actual preview data from API
    // For now, just mark generation as complete
    setIsGenerating(false)
  }, [selectedTemplate])

  // Get preview for a section (calls backend /views API)
  const previewSection = useCallback(
    async (sectionId: string) => {
      if (!currentGraph && !selectedTemplate) return

      const section = sections.find((s) => s.id === sectionId)
      if (!section) return

      updateSection(sectionId, { isPreviewLoading: true, previewData: null })

      try {
        // TODO: Call backend /views API to get actual preview data
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // No preview data available until API is implemented
        updateSection(sectionId, {
          isPreviewLoading: false,
          previewData: null,
        })
      } catch (err) {
        console.error('Error generating preview:', err)
        updateSection(sectionId, { isPreviewLoading: false })
        setError('Failed to generate preview. Please try again.')
      }
    },
    [currentGraph, sections, updateSection, selectedTemplate]
  )

  // Get active section
  const activeSectionData = useMemo(
    () => sections.find((s) => s.id === activeSection),
    [sections, activeSection]
  )

  // Save report
  const handleSave = useCallback(async () => {
    if (!reportName.trim()) {
      setError('Please enter a report name')
      return
    }

    if (sections.length === 0) {
      setError('Please add at least one section')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      // TODO: Call backend to save report
      // This would create Report and Fact nodes in the graph
      await new Promise((resolve) => setTimeout(resolve, 1500))

      router.push('/reports')
    } catch (err) {
      console.error('Error saving report:', err)
      setError('Failed to save report. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }, [reportName, sections, router])

  const formatCurrency = (amount: number | null): string => {
    if (amount === null) return '-'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  return (
    <PageLayout>
      <PageHeader
        icon={TbReportAnalytics}
        title="Create Report"
        description="Build a financial report with configurable sections"
        gradient="from-orange-500 to-red-600"
      />

      {/* Template Selection */}
      <Card theme={customTheme.card}>
        <div className="mb-6">
          <Label className="mb-3 block">Select Report Template</Label>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {REPORT_TEMPLATES.map((template) => (
              <button
                type="button"
                key={template.id}
                onClick={() => selectTemplate(template.id)}
                className={`cursor-pointer rounded-lg border-2 p-4 text-center transition-all ${
                  selectedTemplate === template.id
                    ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:border-gray-600 dark:hover:bg-gray-800'
                }`}
              >
                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                  {template.name}
                </div>
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {template.description}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Report Metadata */}
        <div className="flex flex-wrap items-end gap-4">
          <div className="w-full sm:w-64">
            <Label htmlFor="reportName">Report Name</Label>
            <TextInput
              theme={customTheme.textInput}
              id="reportName"
              placeholder="e.g., Monthly Financial Report"
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
              required
            />
          </div>
          <div className="w-full sm:w-48">
            <Label htmlFor="reportType">Report Type</Label>
            <Select
              theme={customTheme.select}
              id="reportType"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
            >
              <option value="MONTHLY">Monthly</option>
              <option value="QUARTERLY">Quarterly</option>
              <option value="ANNUAL">Annual</option>
            </Select>
          </div>
          <div className="w-full sm:w-48">
            <Label htmlFor="period">Period</Label>
            <Select
              theme={customTheme.select}
              id="period"
              defaultValue="Q4-2025"
            >
              <option value="Q4-2025">Q4 2025</option>
              <option value="Q3-2025">Q3 2025</option>
              <option value="Q2-2025">Q2 2025</option>
              <option value="Q1-2025">Q1 2025</option>
            </Select>
          </div>
        </div>
      </Card>

      {error && (
        <Alert
          theme={customTheme.alert}
          color="failure"
          onDismiss={() => setError(null)}
        >
          <HiExclamationCircle className="h-4 w-4" />
          <span className="font-medium">Error!</span> {error}
        </Alert>
      )}

      {!currentGraph && !isLoadingMappings && (
        <Alert theme={customTheme.alert} color="info">
          No roboledger graph found. Create a graph first to build reports.
        </Alert>
      )}

      <Card theme={customTheme.card} className="p-0">
        <div className="flex min-h-[600px]">
          {/* Left Sidebar - Fact Grid & Dimensions */}
          <div className="w-80 border-r border-gray-200 p-4 dark:border-gray-700">
            {/* Fact Grid Visualization */}
            <div className="mb-6 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
                <HiLightningBolt className="h-4 w-4 text-blue-500" />
                Fact Grid: Your Data Foundation
              </h3>

              {/* Dimensions */}
              <div className="mb-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                    DIMENSIONS
                  </span>
                  <span className="text-xs text-gray-400">Multi-axis view</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {FACT_GRID_DIMENSIONS.map((dim) => (
                    <div
                      key={dim.id}
                      className={`rounded px-2 py-1.5 text-xs font-medium ${dim.bgClass} ${dim.textClass}`}
                    >
                      {dim.name}
                    </div>
                  ))}
                </div>
              </div>

              {/* Facts Preview */}
              <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                    FACTS
                  </span>
                  <span className="text-xs text-gray-400">
                    Validated values
                  </span>
                </div>
                <div className="py-2 text-center text-xs text-gray-400">
                  No facts loaded
                </div>
              </div>

              {/* XBRL Badge */}
              <div className="mt-3 flex items-center gap-2 rounded-lg border border-green-500/30 p-2">
                <HiCheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-xs font-medium text-green-700 dark:text-green-300">
                  XBRL-Compliant Structure
                </span>
              </div>
            </div>

            {/* Dimension Configuration */}
            <div className="mb-6">
              <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                Configure Dimensions
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    By Segment
                  </span>
                  <ToggleSwitch
                    theme={customTheme.toggleSwitch}
                    checked={includeSegments}
                    onChange={setIncludeSegments}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    By Geography
                  </span>
                  <ToggleSwitch
                    theme={customTheme.toggleSwitch}
                    checked={includeGeography}
                    onChange={setIncludeGeography}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Include Comparatives
                  </span>
                  <ToggleSwitch
                    theme={customTheme.toggleSwitch}
                    checked={includeComparatives}
                    onChange={setIncludeComparatives}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    AI Enhancements
                  </span>
                  <ToggleSwitch
                    theme={customTheme.toggleSwitch}
                    checked={enableAIEnhancements}
                    onChange={setEnableAIEnhancements}
                  />
                </div>
              </div>
            </div>

            {/* AI Generate Button */}
            {selectedTemplate && (
              <div className="mb-6">
                <Button
                  theme={customTheme.button}
                  color="purple"
                  className="w-full"
                  onClick={generateWithAI}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <HiSparkles className="mr-2 h-5 w-5" />
                      Generate with AI
                    </>
                  )}
                </Button>
                {isGenerating && (
                  <div className="mt-3">
                    <Progress
                      theme={customTheme.progress}
                      progress={generationProgress}
                      color="purple"
                      size="sm"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {generationStep}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Validation Results */}
            {validation && (
              <div className="mb-6">
                <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                  AI Guard Rails
                </h3>
                <div className="space-y-2">
                  {validation.checks.map((check, idx) => (
                    <div
                      key={idx}
                      className={`flex items-start gap-2 rounded-lg p-2 text-xs ${
                        check.status === 'pass'
                          ? 'bg-green-50 dark:bg-green-900/20'
                          : check.status === 'warn'
                            ? 'bg-yellow-50 dark:bg-yellow-900/20'
                            : 'bg-red-50 dark:bg-red-900/20'
                      }`}
                    >
                      <div
                        className={`mt-0.5 h-3 w-3 rounded-full ${
                          check.status === 'pass'
                            ? 'bg-green-500'
                            : check.status === 'warn'
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                        }`}
                      />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {check.name}
                        </div>
                        <div className="text-gray-600 dark:text-gray-400">
                          {check.message}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Section List */}
            <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Report Sections
                </h3>
                <Button
                  theme={customTheme.button}
                  size="xs"
                  color="light"
                  onClick={addSection}
                >
                  <HiOutlinePlusCircle className="h-4 w-4" />
                </Button>
              </div>

              {sections.length === 0 ? (
                <div className="py-4 text-center">
                  <TbReportAnalytics className="mx-auto mb-2 h-6 w-6 text-gray-400" />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Select a template to get started
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {sections.map((section) => (
                    <button
                      type="button"
                      key={section.id}
                      className={`w-full cursor-pointer rounded-lg border p-2 text-left transition-colors ${
                        activeSection === section.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-700'
                      }`}
                      onClick={() => setActiveSection(section.id)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {section.title}
                        </span>
                        <Button
                          theme={customTheme.button}
                          size="xs"
                          color="failure"
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation()
                            removeSection(section.id)
                          }}
                        >
                          <HiTrash className="h-3 w-3" />
                        </Button>
                      </div>
                      {section.previewData && (
                        <Badge color="success" size="xs" className="mt-1">
                          Preview Ready
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Section Editor */}
          <div className="flex-1 p-4">
            {!activeSectionData ? (
              <div className="flex h-full items-center justify-center">
                <Card theme={customTheme.card}>
                  <div className="py-8 text-center">
                    <TbReportAnalytics className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                    <h3 className="font-heading mb-2 text-lg font-bold dark:text-white">
                      Select or Add a Section
                    </h3>
                    <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                      Each section represents a part of your report (e.g.,
                      Income Statement, Balance Sheet).
                    </p>
                    <Button
                      theme={customTheme.button}
                      color="primary"
                      onClick={addSection}
                    >
                      <HiOutlinePlusCircle className="mr-2 h-5 w-5" />
                      Add First Section
                    </Button>
                  </div>
                </Card>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Section Title */}
                <div>
                  <Label htmlFor="sectionTitle">Section Title</Label>
                  <TextInput
                    theme={customTheme.textInput}
                    id="sectionTitle"
                    placeholder="e.g., Income Statement"
                    value={activeSectionData.title}
                    onChange={(e) =>
                      updateSection(activeSectionData.id, {
                        title: e.target.value,
                      })
                    }
                  />
                </div>

                {/* Data Source */}
                <Card theme={customTheme.card}>
                  <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">
                    Data Source
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="sourceType">Source Type</Label>
                      <Select
                        theme={customTheme.select}
                        id="sourceType"
                        value={activeSectionData.sourceType}
                        onChange={(e) =>
                          updateSection(activeSectionData.id, {
                            sourceType: e.target.value as
                              | 'transactions'
                              | 'facts',
                          })
                        }
                      >
                        <option value="transactions">Transactions</option>
                        <option value="facts">Existing Facts</option>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="mappingStructure">
                        Mapping Structure
                      </Label>
                      <Select
                        theme={customTheme.select}
                        id="mappingStructure"
                        value={activeSectionData.mappingStructureId || ''}
                        onChange={(e) =>
                          updateSection(activeSectionData.id, {
                            mappingStructureId: e.target.value || null,
                          })
                        }
                      >
                        <option value="">No Mapping (Raw CoA)</option>
                        {mappingStructures.map((structure) => (
                          <option
                            key={structure.identifier}
                            value={structure.identifier}
                          >
                            {structure.name} ({structure.associationCount}{' '}
                            mappings)
                          </option>
                        ))}
                      </Select>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="periodStart">Period Start</Label>
                      <TextInput
                        theme={customTheme.textInput}
                        type="date"
                        id="periodStart"
                        value={activeSectionData.periodStart}
                        onChange={(e) =>
                          updateSection(activeSectionData.id, {
                            periodStart: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="periodEnd">Period End</Label>
                      <TextInput
                        theme={customTheme.textInput}
                        type="date"
                        id="periodEnd"
                        value={activeSectionData.periodEnd}
                        onChange={(e) =>
                          updateSection(activeSectionData.id, {
                            periodEnd: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </Card>

                {/* Axes Configuration */}
                <Card theme={customTheme.card}>
                  <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">
                    Axes Configuration
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="rowDimension">Rows</Label>
                      <Select
                        theme={customTheme.select}
                        id="rowDimension"
                        value={activeSectionData.rowDimension}
                        onChange={(e) =>
                          updateSection(activeSectionData.id, {
                            rowDimension: e.target.value,
                          })
                        }
                      >
                        <option value="element">Element</option>
                        <option value="period">Period</option>
                        <option value="entity">Entity</option>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="columnDimension">Columns</Label>
                      <Select
                        theme={customTheme.select}
                        id="columnDimension"
                        value={activeSectionData.columnDimension}
                        onChange={(e) =>
                          updateSection(activeSectionData.id, {
                            columnDimension: e.target.value,
                          })
                        }
                      >
                        <option value="period">Period End Date</option>
                        <option value="element">Element</option>
                        <option value="entity">Entity</option>
                      </Select>
                    </div>
                  </div>
                </Card>

                {/* Preview */}
                <Card theme={customTheme.card}>
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Preview
                    </h3>
                    <Button
                      theme={customTheme.button}
                      size="sm"
                      color="light"
                      onClick={() => previewSection(activeSectionData.id)}
                      disabled={activeSectionData.isPreviewLoading}
                    >
                      <HiRefresh
                        className={`mr-2 h-4 w-4 ${activeSectionData.isPreviewLoading ? 'animate-spin' : ''}`}
                      />
                      {activeSectionData.isPreviewLoading
                        ? 'Loading...'
                        : 'Generate Preview'}
                    </Button>
                  </div>

                  {activeSectionData.isPreviewLoading ? (
                    <div className="flex justify-center py-8">
                      <Spinner size="lg" />
                    </div>
                  ) : activeSectionData.previewData ? (
                    <div className="overflow-x-auto">
                      <Table theme={customTheme.table}>
                        <TableHead>
                          <TableRow>
                            {activeSectionData.previewData.headers.map(
                              (header, idx) => (
                                <TableHeadCell
                                  key={idx}
                                  className={idx > 0 ? 'text-right' : ''}
                                >
                                  {header}
                                </TableHeadCell>
                              )
                            )}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {activeSectionData.previewData.rows.map(
                            (row, idx) => (
                              <TableRow
                                key={idx}
                                className={
                                  row.isHeader
                                    ? 'bg-gray-50 dark:bg-gray-800'
                                    : ''
                                }
                              >
                                <TableCell
                                  className={`${
                                    row.isHeader
                                      ? 'font-bold text-gray-900 dark:text-white'
                                      : row.label.startsWith('Total') ||
                                          row.label.includes('Net')
                                        ? 'pl-4 font-semibold text-gray-900 dark:text-white'
                                        : 'pl-8 text-gray-700 dark:text-gray-300'
                                  }`}
                                >
                                  {row.label}
                                </TableCell>
                                {row.values.map((value, vIdx) => (
                                  <TableCell
                                    key={vIdx}
                                    className={`text-right font-mono ${
                                      row.isHeader
                                        ? 'font-bold'
                                        : row.label.startsWith('Total') ||
                                            row.label.includes('Net')
                                          ? 'border-t border-gray-300 font-semibold dark:border-gray-600'
                                          : ''
                                    } ${
                                      value !== null && value < 0
                                        ? 'text-red-600 dark:text-red-400'
                                        : 'text-gray-900 dark:text-white'
                                    }`}
                                  >
                                    {value === null
                                      ? ''
                                      : selectedTemplate ===
                                            'income_statement' && vIdx === 2
                                        ? `${value > 0 ? '+' : ''}${value.toFixed(1)}%`
                                        : formatCurrency(value)}
                                  </TableCell>
                                ))}
                              </TableRow>
                            )
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                      {selectedTemplate ? (
                        <>
                          Click{' '}
                          <span className="font-semibold text-purple-600 dark:text-purple-400">
                            &quot;Generate with AI&quot;
                          </span>{' '}
                          in the sidebar to build your report
                        </>
                      ) : (
                        'Select a template and generate to see a preview'
                      )}
                    </div>
                  )}
                </Card>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-gray-200 p-4 dark:border-gray-700">
          <Button
            theme={customTheme.button}
            color="light"
            onClick={() => router.push('/reports')}
          >
            <HiChevronLeft className="mr-2 h-5 w-5" />
            Cancel
          </Button>
          <div className="flex gap-2">
            <Button
              theme={customTheme.button}
              color="primary"
              onClick={handleSave}
              disabled={isSaving || !reportName.trim() || sections.length === 0}
            >
              {isSaving ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <HiSave className="mr-2 h-5 w-5" />
                  Save Report
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </PageLayout>
  )
}

export default ReportBuilderContent
