'use client'

import { PageHeader } from '@/components/PageHeader'
import { customTheme, PageLayout } from '@/lib/core'
import { Button, Card, Spinner } from 'flowbite-react'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import type { FC } from 'react'
import { useEffect, useState } from 'react'
import {
  HiChevronLeft,
  HiDocumentReport,
  HiExclamationCircle,
} from 'react-icons/hi'

const ReportViewerContent: FC = function () {
  const params = useParams()
  const searchParams = useSearchParams()
  const reportId = params.id as string
  const graphId = searchParams.get('graph')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // TODO: Load report data from API
  useEffect(() => {
    const loadReport = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // TODO: Fetch report from RoboSystems API
        // const response = await SDK.getReport({ graphId, reportId })
        await new Promise((resolve) => setTimeout(resolve, 500))

        // For now, show not found state
        setError('Report not found')
      } catch (err) {
        console.error('Error loading report:', err)
        setError('Failed to load report. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    loadReport()
  }, [reportId, graphId])

  return (
    <PageLayout>
      <PageHeader
        icon={HiDocumentReport}
        title="Report Viewer"
        description="View financial report details"
        gradient="from-orange-500 to-red-600"
      />

      <Card theme={customTheme.card}>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <div className="py-12 text-center">
            <HiExclamationCircle className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <h3 className="font-heading mb-4 text-xl font-bold dark:text-white">
              {error}
            </h3>
            <p className="mb-6 text-gray-500 dark:text-gray-400">
              The requested report could not be loaded.
            </p>
            <Link href="/reports">
              <Button theme={customTheme.button} color="primary">
                <HiChevronLeft className="mr-2 h-5 w-5" />
                Back to Reports
              </Button>
            </Link>
          </div>
        ) : (
          <div className="py-12 text-center">
            <HiDocumentReport className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <h3 className="font-heading mb-4 text-xl font-bold dark:text-white">
              No Report Data
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Report content will be displayed once data is available from the
              API.
            </p>
          </div>
        )}
      </Card>
    </PageLayout>
  )
}

export default ReportViewerContent
