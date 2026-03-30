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
  Report,
  StatementData,
  StatementRow,
} from '@robosystems/client/extensions'
import {
  Alert,
  Badge,
  Button,
  Card,
  Checkbox,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from 'flowbite-react'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import type { FC } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  HiCheckCircle,
  HiChevronLeft,
  HiDocumentReport,
  HiExclamationCircle,
  HiShare,
} from 'react-icons/hi'

const STRUCTURE_LABELS: Record<string, string> = {
  income_statement: 'Income Statement',
  balance_sheet: 'Balance Sheet',
  cash_flow_statement: 'Cash Flow',
  equity_statement: 'Equity',
}

const formatCurrency = (value: number): string => {
  const abs = Math.abs(value)
  const formatted = abs.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return value < 0 ? `(${formatted})` : formatted
}

const formatDate = (dateString: string | null): string => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString + 'T00:00:00')
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const StatementTable: FC<{ data: StatementData }> = ({ data }) => {
  const hasComparative = data.rows.some((r) => r.priorValue !== null)

  return (
    <div className="overflow-x-auto">
      <Table theme={customTheme.table}>
        <TableHead>
          <TableHeadCell className="w-1/2">{data.structureName}</TableHeadCell>
          <TableHeadCell className="text-right">
            {formatDate(data.periodStart)} — {formatDate(data.periodEnd)}
          </TableHeadCell>
          {hasComparative && (
            <TableHeadCell className="text-right">
              {formatDate(data.comparativePeriodStart)} —{' '}
              {formatDate(data.comparativePeriodEnd)}
            </TableHeadCell>
          )}
        </TableHead>
        <TableBody>
          {data.rows.map((row: StatementRow, idx: number) => {
            const indent = row.depth * 24
            const isBold = row.isSubtotal
            const isZero = row.currentValue === 0

            return (
              <TableRow
                key={`${row.elementId}-${idx}`}
                className={isBold ? 'bg-gray-50 dark:bg-gray-800/50' : ''}
              >
                <TableCell
                  style={{ paddingLeft: `${indent + 16}px` }}
                  className={`${
                    isBold
                      ? 'font-semibold text-gray-900 dark:text-white'
                      : 'text-gray-700 dark:text-gray-300'
                  } ${isZero && !isBold ? 'text-gray-400 dark:text-gray-500' : ''}`}
                >
                  {row.elementName}
                </TableCell>
                <TableCell
                  className={`text-right font-mono ${
                    isBold
                      ? 'font-semibold text-gray-900 dark:text-white'
                      : 'text-gray-700 dark:text-gray-300'
                  } ${isZero && !isBold ? 'text-gray-400 dark:text-gray-500' : ''}`}
                >
                  {formatCurrency(row.currentValue)}
                </TableCell>
                {hasComparative && (
                  <TableCell
                    className={`text-right font-mono ${
                      isBold
                        ? 'font-semibold text-gray-900 dark:text-white'
                        : 'text-gray-700 dark:text-gray-300'
                    } ${
                      (row.priorValue ?? 0) === 0 && !isBold
                        ? 'text-gray-400 dark:text-gray-500'
                        : ''
                    }`}
                  >
                    {row.priorValue !== null
                      ? formatCurrency(row.priorValue)
                      : '—'}
                  </TableCell>
                )}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

const ReportViewerContent: FC = function () {
  const params = useParams()
  const searchParams = useSearchParams()
  const { state: graphState } = useGraphContext()
  const reportId = params.id as string
  const graphId = searchParams.get('graph')

  const [report, setReport] = useState<Report | null>(null)
  const [activeStructure, setActiveStructure] = useState<string | null>(null)
  const [statement, setStatement] = useState<StatementData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingStatement, setIsLoadingStatement] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Share modal state
  const [showShareModal, setShowShareModal] = useState(false)
  const [selectedTargets, setSelectedTargets] = useState<Set<string>>(new Set())
  const [externalGraphId, setExternalGraphId] = useState('')
  const [isSharing, setIsSharing] = useState(false)
  const [shareResult, setShareResult] = useState<string | null>(null)

  // Other roboledger graphs to share to (exclude current graph)
  const shareableGraphs = useMemo(() => {
    return graphState.graphs
      .filter(GraphFilters.roboledger)
      .filter((g) => g.graphId !== graphId)
  }, [graphState.graphs, graphId])

  // All target graph IDs (own graphs + external)
  const allTargetIds = useMemo(() => {
    const ids = new Set(selectedTargets)
    const trimmed = externalGraphId.trim()
    if (trimmed) {
      // Support comma-separated IDs
      trimmed.split(/[,\s]+/).forEach((id) => {
        if (id) ids.add(id)
      })
    }
    return ids
  }, [selectedTargets, externalGraphId])

  const handleShare = useCallback(async () => {
    if (!graphId || !reportId || allTargetIds.size === 0) return

    try {
      setIsSharing(true)
      setShareResult(null)
      const result = await extensions.reports.share(
        graphId,
        reportId,
        Array.from(allTargetIds)
      )

      const succeeded = result.results.filter(
        (r) => r.status === 'shared'
      ).length
      const failed = result.results.filter((r) => r.status === 'error')
      let msg = `Shared to ${succeeded} graph${succeeded !== 1 ? 's' : ''} successfully.`
      if (failed.length > 0) {
        msg += ` ${failed.length} failed: ${failed.map((f) => f.error || f.targetGraphId).join(', ')}`
      }
      setShareResult(msg)
      setSelectedTargets(new Set())
      setExternalGraphId('')
    } catch (err) {
      console.error('Share failed:', err)
      setShareResult('Failed to share report.')
    } finally {
      setIsSharing(false)
    }
  }, [graphId, reportId, allTargetIds])

  const toggleTarget = useCallback((gid: string) => {
    setSelectedTargets((prev) => {
      const next = new Set(prev)
      if (next.has(gid)) {
        next.delete(gid)
      } else {
        next.add(gid)
      }
      return next
    })
  }, [])

  // Load report metadata
  useEffect(() => {
    const loadReport = async () => {
      if (!graphId || !reportId) return

      try {
        setIsLoading(true)
        setError(null)
        const r = await extensions.reports.get(graphId, reportId)
        setReport(r)

        // Auto-select first structure
        if (r.structures.length > 0) {
          setActiveStructure(r.structures[0].structureType)
        }
      } catch (err) {
        console.error('Error loading report:', err)
        setError('Failed to load report.')
      } finally {
        setIsLoading(false)
      }
    }

    loadReport()
  }, [graphId, reportId])

  // Load statement when structure tab changes
  const loadStatement = useCallback(
    async (structureType: string) => {
      if (!graphId || !reportId) return

      try {
        setIsLoadingStatement(true)
        const data = await extensions.reports.statement(
          graphId,
          reportId,
          structureType
        )
        setStatement(data)
      } catch (err) {
        console.error('Error loading statement:', err)
        setStatement(null)
      } finally {
        setIsLoadingStatement(false)
      }
    },
    [graphId, reportId]
  )

  useEffect(() => {
    if (activeStructure) {
      loadStatement(activeStructure)
    }
  }, [activeStructure, loadStatement])

  if (isLoading) {
    return (
      <PageLayout>
        <div className="flex justify-center py-24">
          <Spinner size="xl" />
        </div>
      </PageLayout>
    )
  }

  if (error || !report) {
    return (
      <PageLayout>
        <Card theme={customTheme.card}>
          <div className="py-12 text-center">
            <HiExclamationCircle className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <h3 className="font-heading mb-4 text-xl font-bold dark:text-white">
              {error || 'Report not found'}
            </h3>
            <Link href="/reports">
              <Button theme={customTheme.button} color="primary">
                <HiChevronLeft className="mr-2 h-5 w-5" />
                Back to Reports
              </Button>
            </Link>
          </div>
        </Card>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <PageHeader
        icon={HiDocumentReport}
        title={report.name}
        description={`${formatDate(report.periodStart)} — ${formatDate(report.periodEnd)}`}
        gradient="from-orange-500 to-red-600"
        actions={
          <>
            {report.generationStatus === 'published' &&
              !report.sourceGraphId && (
                <Button
                  theme={customTheme.button}
                  color="purple"
                  onClick={() => {
                    setShareResult(null)
                    setShowShareModal(true)
                  }}
                >
                  <HiShare className="mr-2 h-5 w-5" />
                  Share
                </Button>
              )}
            <Link href="/reports">
              <Button theme={customTheme.button} color="light">
                <HiChevronLeft className="mr-2 h-5 w-5" />
                Back to Reports
              </Button>
            </Link>
          </>
        }
      />

      {/* Provenance banner for shared reports */}
      {report.sourceGraphId && (
        <Card theme={customTheme.card}>
          <div className="flex items-center gap-2 text-sm text-blue-400">
            <HiShare className="h-4 w-4" />
            <span>
              Shared report — received{' '}
              {report.sharedAt ? formatDate(report.sharedAt.split('T')[0]) : ''}
            </span>
          </div>
        </Card>
      )}

      {/* Structure tabs */}
      <Card theme={customTheme.card}>
        <div className="flex gap-2 border-b border-gray-200 pb-3 dark:border-gray-700">
          {report.structures.map((s) => (
            <Button
              key={s.id}
              theme={customTheme.button}
              color={activeStructure === s.structureType ? 'primary' : 'light'}
              size="sm"
              onClick={() => setActiveStructure(s.structureType)}
            >
              {STRUCTURE_LABELS[s.structureType] || s.name}
            </Button>
          ))}
        </div>

        {/* Statement content */}
        {isLoadingStatement ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : statement && statement.rows.length > 0 ? (
          <>
            <StatementTable data={statement} />

            {/* Validation */}
            {statement.validation && (
              <div className="mt-4 border-t border-gray-200 pt-4 dark:border-gray-700">
                <div className="flex items-center gap-2 text-sm">
                  {statement.validation.passed ? (
                    <Badge color="success" size="sm">
                      <HiCheckCircle className="mr-1 inline h-3 w-3" />
                      Validation Passed
                    </Badge>
                  ) : (
                    <Badge color="failure" size="sm">
                      <HiExclamationCircle className="mr-1 inline h-3 w-3" />
                      Validation Failed
                    </Badge>
                  )}
                  {statement.validation.warnings.length > 0 && (
                    <Badge color="warning" size="sm">
                      {statement.validation.warnings.length} warning
                      {statement.validation.warnings.length !== 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
                {statement.validation.failures.length > 0 && (
                  <ul className="mt-2 text-sm text-red-400">
                    {statement.validation.failures.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                )}
                {statement.validation.warnings.length > 0 && (
                  <ul className="mt-2 text-sm text-yellow-400">
                    {statement.validation.warnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Unmapped elements notice */}
            {statement.unmappedCount > 0 && (
              <div className="mt-2 text-sm text-gray-500">
                {statement.unmappedCount} unmapped CoA element
                {statement.unmappedCount !== 1 ? 's' : ''} not included in
                report
              </div>
            )}
          </>
        ) : (
          <div className="py-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              No data available for this structure.
            </p>
          </div>
        )}
      </Card>
      {/* Share modal */}
      <Modal
        show={showShareModal}
        onClose={() => setShowShareModal(false)}
        size="md"
      >
        <ModalHeader>Share Report</ModalHeader>
        <ModalBody>
          {shareResult && (
            <Alert
              theme={customTheme.alert}
              color={shareResult.includes('Failed') ? 'failure' : 'success'}
              className="mb-4"
            >
              {shareResult}
            </Alert>
          )}

          <div className="space-y-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Share a snapshot copy of this report. Recipients get a read-only
              copy that won&apos;t change if your books are updated.
            </p>

            {/* Own graphs */}
            {shareableGraphs.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs font-semibold tracking-wide text-gray-400 uppercase">
                  Your Graphs
                </Label>
                {shareableGraphs.map((g) => (
                  <div key={g.graphId} className="flex items-center gap-3">
                    <Checkbox
                      id={`share-${g.graphId}`}
                      checked={selectedTargets.has(g.graphId)}
                      onChange={() => toggleTarget(g.graphId)}
                    />
                    <Label htmlFor={`share-${g.graphId}`}>{g.graphName}</Label>
                  </div>
                ))}
              </div>
            )}

            {/* External graph IDs */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold tracking-wide text-gray-400 uppercase">
                External Graph IDs
              </Label>
              <input
                type="text"
                value={externalGraphId}
                onChange={(e) => setExternalGraphId(e.target.value)}
                placeholder="e.g. kg1abc123, kg2def456"
                className="w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-purple-500 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
              />
              <p className="text-xs text-gray-400">
                Comma-separated graph IDs from any account
              </p>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            theme={customTheme.button}
            color="purple"
            onClick={handleShare}
            disabled={isSharing || allTargetIds.size === 0}
          >
            {isSharing ? <Spinner size="sm" className="mr-2" /> : null}
            Share to {allTargetIds.size} graph
            {allTargetIds.size !== 1 ? 's' : ''}
          </Button>
          <Button
            theme={customTheme.button}
            color="gray"
            onClick={() => setShowShareModal(false)}
          >
            Close
          </Button>
        </ModalFooter>
      </Modal>
    </PageLayout>
  )
}

export default ReportViewerContent
