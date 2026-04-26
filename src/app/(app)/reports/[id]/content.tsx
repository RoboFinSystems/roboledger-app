'use client'

import { PageHeader } from '@/components/PageHeader'
import { clients, customTheme, PageLayout } from '@/lib/core'
import type { PublishList, ReportPackage } from '@robosystems/client/clients'
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
} from 'flowbite-react'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import type { FC } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  HiChevronLeft,
  HiDocumentReport,
  HiExclamationCircle,
  HiShare,
} from 'react-icons/hi'
import BlockView from '../../ledger/close/components/blockview/BlockView'
import type { ViewMode } from '../../ledger/close/components/ViewModeToggle'
import ViewModeToggle from '../../ledger/close/components/ViewModeToggle'

const formatDate = (dateString: string | null): string => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString + 'T00:00:00')
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const PACKAGE_STATUS_BADGE: Record<
  string,
  { color: 'gray' | 'info' | 'success' | 'failure' | 'warning'; label: string }
> = {
  draft: { color: 'gray', label: 'Draft' },
  under_review: { color: 'info', label: 'Under Review' },
  filed: { color: 'success', label: 'Filed' },
  archived: { color: 'failure', label: 'Archived' },
}

interface ShareReportResultEntry {
  target_graph_id: string
  status: string
  error: string | null
  fact_count?: number
}

interface ShareReportResult {
  results?: ShareReportResultEntry[]
}

/**
 * Saved-report viewer in package mode. Loads the Report's
 * ``ReportPackage`` envelope (Report metadata + N pre-rehydrated
 * `InformationBlock` envelopes — one per attached FactSet) and stacks
 * a `BlockView` per item, grouped visually.
 *
 * Replaces the legacy per-tab `getStatement(reportId, structureType)`
 * flow. Frozen FactSets pin each item to the snapshot the Report
 * generated, so the viewer is the same whether the Report is currently
 * generating or filed long ago.
 */
const ReportViewerContent: FC = function () {
  const params = useParams()
  const searchParams = useSearchParams()
  const reportId = params.id as string
  const graphId = searchParams.get('graph')

  const [pkg, setPkg] = useState<ReportPackage | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('rendered')

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
      const ack = await clients.reports.shareReport(
        graphId,
        reportId,
        selectedListId
      )

      const shareResults =
        (ack.result as ShareReportResult | null)?.results ?? []
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

  // Load the package — Report metadata + rehydrated envelopes
  useEffect(() => {
    const loadPackage = async () => {
      if (!graphId || !reportId) {
        setIsLoading(false)
        setError('Report not found — missing graph context.')
        return
      }
      try {
        setIsLoading(true)
        setError(null)
        const data = await clients.reports.getReportPackage(graphId, reportId)
        setPkg(data)
      } catch (err) {
        console.error('Error loading report package:', err)
        setError('Failed to load report.')
      } finally {
        setIsLoading(false)
      }
    }
    loadPackage()
  }, [graphId, reportId])

  const periodLabel = useMemo(() => {
    if (!pkg) return ''
    const entityPrefix = pkg.entityName ? `${pkg.entityName} — ` : ''
    if (pkg.periodType === 'quarterly' || !pkg.periodStart) {
      return `${entityPrefix}${pkg.name}`
    }
    return `${entityPrefix}${formatDate(pkg.periodStart)} — ${formatDate(pkg.periodEnd)}`
  }, [pkg])

  if (isLoading) {
    return (
      <PageLayout>
        <div className="flex justify-center py-24">
          <Spinner size="xl" />
        </div>
      </PageLayout>
    )
  }

  if (error || !pkg) {
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

  const filingBadge =
    PACKAGE_STATUS_BADGE[pkg.filingStatus] ?? PACKAGE_STATUS_BADGE.draft

  return (
    <PageLayout>
      <PageHeader
        icon={HiDocumentReport}
        title={pkg.name}
        description={periodLabel}
        gradient="from-orange-500 to-red-600"
        actions={
          <>
            {pkg.generationStatus === 'published' && !pkg.sourceGraphId && (
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

      {/* Status banner — filing lifecycle + provenance */}
      <Card theme={customTheme.card}>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <Badge color={filingBadge.color} size="sm">
            {filingBadge.label}
          </Badge>
          {pkg.filedAt && (
            <span className="text-gray-500 dark:text-gray-400">
              Filed {formatDate(pkg.filedAt.split('T')[0])}
              {pkg.filedBy ? ` by ${pkg.filedBy}` : ''}
            </span>
          )}
          {pkg.sourceGraphId && (
            <span className="flex items-center gap-1 text-blue-400">
              <HiShare className="h-4 w-4" />
              Shared report
              {pkg.entityName ? ` from ${pkg.entityName}` : ''}
              {pkg.sharedAt
                ? ` — received ${formatDate(pkg.sharedAt.split('T')[0])}`
                : ''}
            </span>
          )}
          <div className="ml-auto">
            <ViewModeToggle viewMode={viewMode} onChange={setViewMode} />
          </div>
        </div>
      </Card>

      {/* Package items — stacked BlockViews, one per FactSet */}
      {pkg.items.length === 0 ? (
        <Card theme={customTheme.card}>
          <div className="py-12 text-center text-gray-500 dark:text-gray-400">
            No statements available for this report yet.
          </div>
        </Card>
      ) : (
        pkg.items.map((item) => (
          <Card key={item.factSetId} theme={customTheme.card}>
            <BlockView
              envelope={item.block}
              viewMode={viewMode}
              entityName={pkg.entityName}
            />
          </Card>
        ))
      )}

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
