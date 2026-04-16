'use client'

import { PageHeader } from '@/components/PageHeader'
import { customTheme, clients, PageLayout } from '@/lib/core'
import type {
  PublishList,
  Report,
  StatementData,
  StatementRow,
} from '@robosystems/client/clients'
import {
  Alert,
  Badge,
  Button,
  Card,
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
import { useCallback, useEffect, useState } from 'react'
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

const StatementTable: FC<{
  data: StatementData
  entityName?: string | null
}> = ({ data, entityName }) => {
  const periods = data.periods
  return (
    <div className="overflow-x-auto">
      {entityName && (
        <div className="border-b border-gray-200 bg-gray-50 py-3 text-center dark:border-gray-700 dark:bg-gray-800">
          <p className="text-sm font-bold tracking-widest text-gray-900 uppercase dark:text-white">
            {entityName}
          </p>
        </div>
      )}
      <Table theme={customTheme.table}>
        <TableHead>
          <TableHeadCell className="w-1/2">{data.structureName}</TableHeadCell>
          {periods.map((period, i) => (
            <TableHeadCell key={i} className="text-right">
              {period.label ||
                `${formatDate(period.start)} — ${formatDate(period.end)}`}
            </TableHeadCell>
          ))}
        </TableHead>
        <TableBody>
          {data.rows.map((row: StatementRow, idx: number) => {
            const indent = row.depth * 24
            const isBold = row.isSubtotal
            const primaryValue = row.values[0] ?? 0
            const isZero = primaryValue === 0

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
                {row.values.map((value, i) => (
                  <TableCell
                    key={i}
                    className={`text-right font-mono ${
                      isBold
                        ? 'font-semibold text-gray-900 dark:text-white'
                        : 'text-gray-700 dark:text-gray-300'
                    } ${
                      (value ?? 0) === 0 && !isBold
                        ? 'text-gray-400 dark:text-gray-500'
                        : ''
                    }`}
                  >
                    {value !== null ? formatCurrency(value) : '—'}
                  </TableCell>
                ))}
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
  const [publishLists, setPublishLists] = useState<PublishList[]>([])
  const [selectedListId, setSelectedListId] = useState<string | null>(null)
  const [isLoadingLists, setIsLoadingLists] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const [shareResult, setShareResult] = useState<string | null>(null)

  const loadPublishLists = useCallback(async () => {
    if (!graphId) return
    try {
      setIsLoadingLists(true)
      const lists = await clients.reports.listPublishLists(graphId)
      setPublishLists(lists)
    } catch (err) {
      console.error('Failed to load publish lists:', err)
    } finally {
      setIsLoadingLists(false)
    }
  }, [graphId])

  const handleShare = useCallback(async () => {
    if (!graphId || !reportId || !selectedListId) return

    try {
      setIsSharing(true)
      setShareResult(null)
      const ack = await clients.reports.share(
        graphId,
        reportId,
        selectedListId
      )

      // `share` is a sync backend dispatch today — the envelope's `result`
      // carries the backend's ShareReportResponse payload (a list of
      // per-target outcomes). Shape: { report_id, results: [...] }.
      const shareResults =
        (
          ack.result as {
            results?: Array<{
              target_graph_id: string
              status: string
              error: string | null
              fact_count?: number
            }>
          } | null
        )?.results ?? []
      const succeeded = shareResults.filter((r) => r.status === 'shared').length
      const failed = shareResults.filter((r) => r.status === 'error')
      let msg = `Shared to ${succeeded} recipient${succeeded !== 1 ? 's' : ''} successfully.`
      if (failed.length > 0) {
        msg += ` ${failed.length} failed: ${failed.map((f) => f.error || f.target_graph_id).join(', ')}`
      }
      setShareResult(msg)
      setSelectedListId(null)
    } catch (err) {
      console.error('Share failed:', err)
      setShareResult('Failed to share report.')
    } finally {
      setIsSharing(false)
    }
  }, [graphId, reportId, selectedListId])

  // Load report metadata
  useEffect(() => {
    const loadReport = async () => {
      if (!graphId || !reportId) {
        setIsLoading(false)
        setError('Report not found — missing graph context.')
        return
      }

      try {
        setIsLoading(true)
        setError(null)
        const r = await clients.reports.get(graphId, reportId)
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
        const data = await clients.reports.statement(
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
        description={`${report.entityName ? `${report.entityName} — ` : ''}${report.periodType === 'quarterly' || !report.periodStart ? report.name : `${formatDate(report.periodStart)} — ${formatDate(report.periodEnd)}`}`}
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
                    setSelectedListId(null)
                    loadPublishLists()
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
              Shared report
              {report.entityName ? ` from ${report.entityName}` : ''} — received{' '}
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
            <StatementTable data={statement} entityName={report.entityName} />

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
              Share a snapshot copy of this report to a publish list. Recipients
              get a read-only copy that won&apos;t change if your books are
              updated.
            </p>

            {isLoadingLists ? (
              <div className="flex justify-center py-4">
                <Spinner size="md" />
              </div>
            ) : publishLists.length === 0 ? (
              <div className="rounded-lg border border-gray-200 p-4 text-center dark:border-gray-700">
                <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                  No publish lists yet.
                </p>
                <Link href="/reports/publish-lists">
                  <Button theme={customTheme.button} size="sm" color="purple">
                    Create a Publish List
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                <Label className="text-xs font-semibold tracking-wide text-gray-400 uppercase">
                  Select a Publish List
                </Label>
                {publishLists.map((list) => (
                  <button
                    key={list.id}
                    onClick={() => setSelectedListId(list.id)}
                    className={`w-full rounded-lg border p-3 text-left transition-colors ${
                      selectedListId === list.id
                        ? 'border-purple-500 bg-purple-50 dark:border-purple-400 dark:bg-purple-900/20'
                        : 'border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium dark:text-white">
                        {list.name}
                      </span>
                      <span className="text-xs text-gray-400">
                        {list.memberCount} recipient
                        {list.memberCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                    {list.description && (
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {list.description}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            theme={customTheme.button}
            color="purple"
            onClick={handleShare}
            disabled={isSharing || !selectedListId}
          >
            {isSharing ? <Spinner size="sm" className="mr-2" /> : null}
            Share Report
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
