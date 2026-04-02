'use client'

import { PageHeader } from '@/components/PageHeader'
import {
  customTheme,
  extensions,
  GraphFilters,
  PageLayout,
  useGraphContext,
} from '@/lib/core'
import type { Report } from '@robosystems/client/extensions'
import {
  Badge,
  Button,
  Card,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from 'flowbite-react'
import Link from 'next/link'
import type { FC } from 'react'
import { useEffect, useMemo, useState } from 'react'
import {
  HiDocumentReport,
  HiExclamationCircle,
  HiEye,
  HiOutlinePlusCircle,
  HiShare,
} from 'react-icons/hi'

const STATUS_COLORS: Record<string, string> = {
  published: 'success',
  generating: 'warning',
  pending: 'gray',
  failed: 'failure',
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

interface ReportWithGraph extends Report {
  _graphId: string
  _graphName: string
}

const ReportsContent: FC = function () {
  const { state: graphState } = useGraphContext()
  const [reports, setReports] = useState<ReportWithGraph[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const currentGraph = useMemo(() => {
    const roboledgerGraphs = graphState.graphs.filter(GraphFilters.roboledger)
    return (
      roboledgerGraphs.find((g) => g.graphId === graphState.currentGraphId) ??
      roboledgerGraphs[0]
    )
  }, [graphState.graphs, graphState.currentGraphId])

  useEffect(() => {
    const loadReports = async () => {
      if (!currentGraph) {
        setReports([])
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        const reportList = await extensions.reports.list(currentGraph.graphId)

        const mapped: ReportWithGraph[] = reportList.map((r) => ({
          ...r,
          _graphId: currentGraph.graphId,
          _graphName: currentGraph.graphName,
        }))

        mapped.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )

        setReports(mapped)
      } catch (err) {
        console.error('Error loading reports:', err)
        setError('Failed to load reports. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    loadReports()
  }, [currentGraph])

  return (
    <PageLayout>
      <PageHeader
        icon={HiDocumentReport}
        title="Reports"
        description="View and manage financial reports"
        gradient="from-orange-500 to-red-600"
        actions={
          <div className="flex gap-2">
            <Link href="/reports/publish-lists">
              <Button theme={customTheme.button} color="light">
                <HiShare className="mr-2 h-5 w-5" />
                Publish Lists
              </Button>
            </Link>
            <Link href="/reports/new">
              <Button theme={customTheme.button} color="primary">
                <HiOutlinePlusCircle className="mr-2 h-5 w-5" />
                Create Report
              </Button>
            </Link>
          </div>
        }
      />

      {error && (
        <Card theme={customTheme.card}>
          <div className="flex items-center gap-2 text-red-500">
            <HiExclamationCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        </Card>
      )}

      <Card theme={customTheme.card}>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : reports.length === 0 ? (
            <div className="py-12 text-center">
              <HiDocumentReport className="mx-auto mb-4 h-12 w-12 text-gray-400" />
              <h3 className="font-heading mb-4 text-xl font-bold dark:text-white">
                No Reports Found
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Create your first financial report to get started.
              </p>
            </div>
          ) : (
            <Table theme={customTheme.table}>
              <TableHead>
                <TableHeadCell>Report Name</TableHeadCell>
                <TableHeadCell>Period</TableHeadCell>
                <TableHeadCell>Status</TableHeadCell>
                <TableHeadCell>Structures</TableHeadCell>
                <TableHeadCell className="w-24"></TableHeadCell>
              </TableHead>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium text-gray-900 dark:text-white">
                      <div className="flex flex-col">
                        <span className="font-semibold">{report.name}</span>
                        {report.sourceGraphId && (
                          <span className="flex items-center gap-1 text-xs text-blue-400">
                            <HiShare className="h-3 w-3" />
                            Shared report
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatDate(report.periodStart)} —{' '}
                      {formatDate(report.periodEnd)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        color={STATUS_COLORS[report.generationStatus] || 'gray'}
                        size="sm"
                      >
                        {report.generationStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {report.structures.map((s) => (
                          <Badge key={s.id} color="gray" size="sm">
                            {s.structureType
                              .replace(/_/g, ' ')
                              .replace(/\b\w/g, (c) => c.toUpperCase())
                              .replace(' Statement', '')}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/reports/${report.id}?graph=${report._graphId}`}
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

        {!isLoading && reports.length > 0 && (
          <div className="border-t border-gray-200 p-4 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing {reports.length} report{reports.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </Card>
    </PageLayout>
  )
}

export default ReportsContent
