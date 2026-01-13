'use client'

import { PageHeader } from '@/components/PageHeader'
import {
  customTheme,
  GraphFilters,
  PageLayout,
  SDK,
  useGraphContext,
} from '@/lib/core'
import type { Report } from '@/lib/ledger'
import { REPORTS_QUERY } from '@/lib/ledger'
import {
  Alert,
  Badge,
  Button,
  Card,
  Select,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
  TextInput,
} from 'flowbite-react'
import Link from 'next/link'
import type { FC } from 'react'
import { useEffect, useMemo, useState } from 'react'
import {
  HiDocumentReport,
  HiExclamationCircle,
  HiEye,
  HiOutlinePlusCircle,
  HiSearch,
} from 'react-icons/hi'

const REPORT_TYPE_COLORS: Record<string, string> = {
  MONTHLY: 'info',
  '10-K': 'success',
  '10-Q': 'warning',
  '8-K': 'purple',
}

interface ReportWithGraph extends Report {
  _graphId: string
  _graphName: string
}

const formatDate = (dateString: string): string => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const ReportsContent: FC = function () {
  const { state: graphState } = useGraphContext()
  const [reports, setReports] = useState<ReportWithGraph[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('')

  // Get unique report types
  const reportTypes = useMemo(() => {
    const types = new Set(reports.map((r) => r.form).filter(Boolean))
    return Array.from(types).sort()
  }, [reports])

  // Load reports from all roboledger graphs
  useEffect(() => {
    const loadReports = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const roboledgerGraphs = graphState.graphs.filter(
          GraphFilters.roboledger
        )

        if (roboledgerGraphs.length === 0) {
          setReports([])
          return
        }

        const allReports: ReportWithGraph[] = []

        for (const graph of roboledgerGraphs) {
          try {
            const response = await SDK.executeCypherQuery({
              path: { graph_id: graph.graphId },
              query: { mode: 'sync' },
              body: {
                query: REPORTS_QUERY,
                parameters: {},
              },
            })

            if (response.data) {
              const data = response.data as {
                data?: Array<{
                  identifier: string
                  uri: string
                  name: string
                  accessionNumber: string
                  form: string
                  filingDate: string
                  reportDate: string
                  periodEndDate: string
                  processed: boolean
                  updatedAt: string
                  entityName: string
                  factCount: number
                }>
              }
              const rows = data.data || []

              const graphReports: ReportWithGraph[] = rows.map((row) => ({
                identifier: row.identifier || '',
                uri: row.uri || '',
                name: row.name || 'Unnamed Report',
                accessionNumber: row.accessionNumber || '',
                form: row.form || '',
                filingDate: row.filingDate || '',
                reportDate: row.reportDate || '',
                periodEndDate: row.periodEndDate || '',
                processed: row.processed || false,
                updatedAt: row.updatedAt || '',
                entityName: row.entityName,
                factCount: row.factCount || 0,
                _graphId: graph.graphId,
                _graphName: graph.graphName,
              }))

              allReports.push(...graphReports)
            }
          } catch (err) {
            console.error(
              `Error loading reports from graph ${graph.graphName}:`,
              err
            )
          }
        }

        // Sort by report date descending
        allReports.sort(
          (a, b) =>
            new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime()
        )

        setReports(allReports)
      } catch (err) {
        console.error('Error loading reports:', err)
        setError('Failed to load reports. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    loadReports()
  }, [graphState.graphs])

  // Filter reports
  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const matchesSearch =
        searchTerm === '' ||
        report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.entityName?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesType = typeFilter === '' || report.form === typeFilter

      return matchesSearch && matchesType
    })
  }, [reports, searchTerm, typeFilter])

  return (
    <PageLayout>
      <PageHeader
        icon={HiDocumentReport}
        title="Reports"
        description="View and manage saved financial reports"
        gradient="from-orange-500 to-red-600"
        actions={
          <Link href="/reports/new">
            <Button theme={customTheme.button} color="primary">
              <HiOutlinePlusCircle className="mr-2 h-5 w-5" />
              Create Report
            </Button>
          </Link>
        }
      />

      {/* Filters */}
      <Card theme={customTheme.card}>
        <div className="flex flex-wrap items-end gap-4 p-4">
          <div className="w-full sm:w-64">
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <HiSearch className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </div>
              <TextInput
                theme={customTheme.textInput}
                id="search"
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="w-full sm:w-48">
            <Select
              theme={customTheme.select}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">All Types</option>
              {reportTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </Card>

      {error && (
        <Alert theme={customTheme.alert} color="failure">
          <HiExclamationCircle className="h-4 w-4" />
          <span className="font-medium">Error!</span> {error}
        </Alert>
      )}

      <Card theme={customTheme.card}>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : reports.length === 0 ? (
            <div className="p-8 text-center">
              <Card theme={customTheme.card}>
                <HiDocumentReport className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                <h3 className="font-heading mb-4 text-xl font-bold dark:text-white">
                  No Reports Found
                </h3>
                <p className="mb-4 text-gray-500 dark:text-gray-400">
                  Create your first financial report to get started.
                </p>
                <Link href="/reports/new">
                  <Button theme={customTheme.button} color="primary">
                    <HiOutlinePlusCircle className="mr-2 h-5 w-5" />
                    Create Report
                  </Button>
                </Link>
              </Card>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="p-8 text-center">
              <Card theme={customTheme.card}>
                <HiSearch className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                <h3 className="font-heading mb-4 text-xl font-bold dark:text-white">
                  No Matching Reports
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Try adjusting your search or filters.
                </p>
              </Card>
            </div>
          ) : (
            <Table theme={customTheme.table}>
              <TableHead>
                <TableHeadCell>Report Name</TableHeadCell>
                <TableHeadCell>Type</TableHeadCell>
                <TableHeadCell>Period End</TableHeadCell>
                <TableHeadCell>Entity</TableHeadCell>
                <TableHeadCell>Facts</TableHeadCell>
                <TableHeadCell className="w-24"></TableHeadCell>
              </TableHead>
              <TableBody>
                {filteredReports.map((report) => (
                  <TableRow key={`${report._graphId}-${report.identifier}`}>
                    <TableCell className="font-medium text-gray-900 dark:text-white">
                      <div className="flex flex-col">
                        <span className="font-semibold">{report.name}</span>
                        {report.accessionNumber && (
                          <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
                            {report.accessionNumber}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        color={REPORT_TYPE_COLORS[report.form] || 'gray'}
                        size="sm"
                      >
                        {report.form || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(report.periodEndDate)}</TableCell>
                    <TableCell>
                      {report.entityName || (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge color="gray" size="sm">
                        {report.factCount}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/reports/${report.identifier}?graph=${report._graphId}`}
                      >
                        <Button
                          theme={customTheme.button}
                          size="sm"
                          color="light"
                        >
                          <HiEye className="mr-1 h-4 w-4" />
                          View
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Footer */}
        {!isLoading && filteredReports.length > 0 && (
          <div className="border-t border-gray-200 p-4 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing {filteredReports.length} of {reports.length} reports
            </p>
          </div>
        )}
      </Card>
    </PageLayout>
  )
}

export default ReportsContent
