'use client'

import { isGraphAdmin } from '@/lib/graph-role'
import { friendlyError } from '@/lib/ledger/errors'
import type { PublishList, ReportPackage } from '@robosystems/client/clients'
import {
  clients,
  EmptyState,
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
  Dropdown,
  DropdownDivider,
  DropdownHeader,
  DropdownItem,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Spinner,
} from 'flowbite-react'
import Link from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import type { FC } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  HiBan,
  HiChevronLeft,
  HiCog,
  HiDocumentReport,
  HiDotsVertical,
  HiExclamationCircle,
  HiShare,
  HiTrash,
} from 'react-icons/hi'
import BlockView from '../../ledger/close/components/blockview/BlockView'
import type { ViewMode } from '../../ledger/close/components/ViewModeToggle'
import ViewModeToggle from '../../ledger/close/components/ViewModeToggle'
import BlockSenderModal from './components/BlockSenderModal'
import HolonReportView from './components/HolonReportView'
import ManageSharesModal from './components/ManageSharesModal'
import ReportPackageSidebar from './components/ReportPackageSidebar'

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

// `ShareReportResponse` (with its typed `results: ShareResultItem[]`)
// is exported by the SDK since 0.3.20 — the previous hand-rolled
// `ShareReportResultEntry`/`ShareReportResult` interfaces were retired.

/**
 * Saved-report viewer in package mode. Loads the Report's
 * ``ReportPackage`` envelope (Report metadata + N pre-rehydrated
 * `InformationBlock` envelopes — one per attached FactSet) and stacks
 * a `BlockView` per item, grouped visually.
 *
 * Replaces the legacy per-tab `getStatement(reportId, blockType)`
 * flow. Frozen FactSets pin each item to the snapshot the Report
 * generated, so the viewer is the same whether the Report is currently
 * generating or filed long ago.
 */
const ReportViewerContent: FC = function () {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const reportId = params.id as string
  const graphId = searchParams.get('graph')

  // Admin gates the destructive halves of the share controls. Client-side
  // gating is an affordance only — the API re-checks and 403s regardless.
  const { state: graphState } = useGraphContext()
  const isAdmin = isGraphAdmin(graphState.graphs, graphId)

  const [pkg, setPkg] = useState<ReportPackage | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('rendered')
  // Comparison spike: 'envelope' = in-app BlockView (current), 'holon' =
  // shared @robosystems/report-components ReportView fed a holon JSON-LD.
  const [renderer, setRenderer] = useState<'envelope' | 'holon'>('envelope')
  const [activeFactSetId, setActiveFactSetId] = useState<string | null>(null)
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  // Share modal state
  const [showShareModal, setShowShareModal] = useState(false)
  const [publishLists, setPublishLists] = useState<PublishList[]>([])
  const [selectedListId, setSelectedListId] = useState<string | null>(null)
  const [isLoadingLists, setIsLoadingLists] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const [shareResult, setShareResult] = useState<string | null>(null)
  // Tracked explicitly rather than sniffed out of the message: a partial
  // failure reads "… 2 failed: …", which the old `includes('Failed')` check
  // missed, so partly-failed shares were reported in a green success alert.
  const [shareOk, setShareOk] = useState(true)

  const [isDownloadingBundle, setIsDownloadingBundle] = useState(false)
  const [isDownloadingHolon, setIsDownloadingHolon] = useState(false)
  const [isDownloadingXbrl, setIsDownloadingXbrl] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)

  // Cross-graph share controls
  const [showBlockModal, setShowBlockModal] = useState(false)
  const [showSharesModal, setShowSharesModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

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

  // Both flavors resolve to a presigned S3 URL via the GraphQL
  // `reportDownloadUrl` read. window.location.href (not <a download>)
  // because the URL is cross-origin — the download attribute is ignored
  // cross-origin, but the backend signs Content-Disposition: attachment
  // so the file still saves with a versioned filename.
  const handleDownloadBundle = useCallback(async () => {
    if (!graphId || !reportId) return
    try {
      setIsDownloadingBundle(true)
      setDownloadError(null)
      const resp = await clients.reports.getReportDownloadUrl(graphId, reportId)
      if (!resp) {
        setDownloadError('Report not found.')
        return
      }
      window.location.href = resp.downloadUrl
    } catch (err) {
      console.error('Bundle download failed:', err)
      // The REPORT_BUNDLE_NOT_AVAILABLE error ("publish or regenerate to
      // produce a bundle") is the most actionable failure mode for users
      // viewing an unpublished Report, so surface the server detail when
      // available rather than a generic string.
      const message =
        err instanceof Error ? err.message : 'Failed to start download.'
      setDownloadError(message)
    } finally {
      setIsDownloadingBundle(false)
    }
  }, [graphId, reportId])

  // The holon is the same report as dataset-form JSON-LD — scene / boundary /
  // projection named graphs — materialized + cached server-side on first
  // request, then the same presigned-redirect path. It's what the holon viewer
  // and report-components library consume.
  const handleDownloadHolon = useCallback(async () => {
    if (!graphId || !reportId) return
    try {
      setIsDownloadingHolon(true)
      setDownloadError(null)
      const resp = await clients.reports.getReportDownloadUrl(
        graphId,
        reportId,
        {
          format: 'HOLON_JSONLD',
        }
      )
      if (!resp) {
        setDownloadError('Report not found.')
        return
      }
      window.location.href = resp.downloadUrl
    } catch (err) {
      console.error('Holon download failed:', err)
      const message =
        err instanceof Error ? err.message : 'Failed to download holon bundle.'
      setDownloadError(message)
    } finally {
      setIsDownloadingHolon(false)
    }
  }, [graphId, reportId])

  // XBRL is now a presigned S3 URL too (materialized + cached server-side
  // on first request), so it follows the same redirect path as JSON-LD —
  // no more client-side blob assembly.
  const handleDownloadXbrl = useCallback(async () => {
    if (!graphId || !reportId) return
    try {
      setIsDownloadingXbrl(true)
      setDownloadError(null)
      const resp = await clients.reports.getReportDownloadUrl(
        graphId,
        reportId,
        {
          format: 'XBRL_2_1',
        }
      )
      if (!resp) {
        setDownloadError('Report not found.')
        return
      }
      window.location.href = resp.downloadUrl
    } catch (err) {
      console.error('XBRL download failed:', err)
      const message =
        err instanceof Error ? err.message : 'Failed to download XBRL bundle.'
      setDownloadError(message)
    } finally {
      setIsDownloadingXbrl(false)
    }
  }, [graphId, reportId])

  const handleShare = useCallback(async () => {
    if (!graphId || !reportId || !selectedListId) return

    try {
      setIsSharing(true)
      setShareResult(null)
      const share = await clients.reports.shareReport(
        graphId,
        reportId,
        selectedListId
      )

      const shareResults = share.results
      const succeeded = shareResults.filter((r) => r.status === 'shared').length
      const failed = shareResults.filter((r) => r.status === 'error')
      let msg = `Shared to ${succeeded} recipient${succeeded !== 1 ? 's' : ''} successfully.`
      if (failed.length > 0) {
        msg += ` ${failed.length} failed: ${failed.map((f) => f.error || f.target_graph_id).join(', ')}`
      }
      setShareResult(msg)
      setShareOk(failed.length === 0)
      setSelectedListId(null)
    } catch (err) {
      console.error('Share failed:', err)
      setShareResult('Failed to share report.')
      setShareOk(false)
    } finally {
      setIsSharing(false)
    }
  }, [graphId, reportId, selectedListId])

  // Removing a copy shared in from another graph. The copy carries the
  // *sender's* user id in `created_by`, so the ordinary owner rule can never
  // match anyone here — the receiving graph's admin is who gets to delete it.
  const handleDeleteCopy = useCallback(async () => {
    if (!graphId || !reportId) return
    try {
      setIsDeleting(true)
      setActionError(null)
      await clients.reports.deleteReport(graphId, reportId)
      router.push('/reports')
    } catch (err) {
      console.error('Delete report failed:', err)
      const message =
        err instanceof Error ? err.message : 'Failed to delete this report.'
      setActionError(friendlyError(message).message)
      setShowDeleteConfirm(false)
    } finally {
      setIsDeleting(false)
    }
  }, [graphId, reportId, router])

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

  // Reset the active highlight every time the loaded package changes
  // — the IntersectionObserver in the next effect will overwrite this
  // shortly, but during the gap (e.g., navigating between two reports
  // that both have items) we'd otherwise carry the previous report's
  // factSetId into the new sidebar. Kept as a separate effect so the
  // observer setup below doesn't need to depend on `activeFactSetId`.
  useEffect(() => {
    setActiveFactSetId(pkg?.items[0]?.factSetId ?? null)
  }, [pkg])

  // Scroll-spy: highlight the sidebar entry for whichever block is
  // closest to the top of the viewport. Re-runs when the items list
  // changes (e.g., after re-generation). Top-of-viewport observation
  // window is `-20% / -70%` so a block lights up just before its
  // header crosses the fold.
  useEffect(() => {
    if (!pkg || pkg.items.length === 0) return
    const observer = new IntersectionObserver(
      (entries) => {
        // Multiple entries can fire on the same tick; pick the one
        // highest in the viewport (smallest top, but still visible).
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible.length > 0) {
          const id = visible[0].target.getAttribute('data-fact-set-id')
          if (id) setActiveFactSetId(id)
        }
      },
      { rootMargin: '-20% 0px -70% 0px' }
    )
    itemRefs.current.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [pkg])

  const scrollToItem = useCallback((factSetId: string) => {
    const el = itemRefs.current.get(factSetId)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setActiveFactSetId(factSetId)
    }
  }, [])

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
        <LoadingState size="xl" className="py-24" />
      </PageLayout>
    )
  }

  if (error || !pkg) {
    return (
      <PageLayout>
        <Card>
          <EmptyState
            icon={HiExclamationCircle}
            title={error || 'Report not found'}
            action={
              <Link href="/reports">
                <Button color="primary">
                  <HiChevronLeft className="mr-2 h-5 w-5" />
                  Back to Reports
                </Button>
              </Link>
            }
          />
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
        subtitle={periodLabel}
        actions={
          <>
            {/* Downloads need a published bundle, but a recipient's exit must
                not — generation status is the sender's property, and a copy
                that never published would otherwise strand its recipient with
                no way to block or remove it. So the menu opens for any
                received report too. */}
            {(pkg.generationStatus === 'published' || pkg.sourceGraphId) && (
              <Dropdown
                color="light"
                size="sm"
                arrowIcon={false}
                disabled={
                  isDownloadingBundle || isDownloadingHolon || isDownloadingXbrl
                }
                label={
                  isDownloadingBundle ||
                  isDownloadingHolon ||
                  isDownloadingXbrl ? (
                    <Spinner size="sm" />
                  ) : (
                    <HiDotsVertical className="h-5 w-5" />
                  )
                }
              >
                {pkg.generationStatus === 'published' && (
                  <>
                    <DropdownHeader>Download</DropdownHeader>
                    <DropdownItem onClick={handleDownloadBundle}>
                      JSON-LD bundle
                    </DropdownItem>
                    <DropdownItem onClick={handleDownloadHolon}>
                      Holon (JSON-LD)
                    </DropdownItem>
                    <DropdownItem onClick={handleDownloadXbrl}>
                      XBRL 2.1 package
                    </DropdownItem>
                  </>
                )}
                {!pkg.sourceGraphId ? (
                  pkg.generationStatus === 'published' && (
                    <>
                      <DropdownDivider />
                      <DropdownItem
                        icon={HiShare}
                        onClick={() => {
                          setShareResult(null)
                          setSelectedListId(null)
                          loadPublishLists()
                          setShowShareModal(true)
                        }}
                      >
                        Share
                      </DropdownItem>
                      <DropdownItem
                        icon={HiCog}
                        onClick={() => setShowSharesModal(true)}
                      >
                        Manage shares
                      </DropdownItem>
                    </>
                  )
                ) : (
                  <>
                    {pkg.generationStatus === 'published' && (
                      <DropdownDivider />
                    )}
                    <DropdownHeader>
                      Shared in from another graph
                    </DropdownHeader>
                    <DropdownItem
                      icon={HiBan}
                      onClick={() => setShowBlockModal(true)}
                    >
                      Block sender
                    </DropdownItem>
                    {isAdmin && (
                      <DropdownItem
                        icon={HiTrash}
                        onClick={() => setShowDeleteConfirm(true)}
                      >
                        Delete this copy
                      </DropdownItem>
                    )}
                  </>
                )}
              </Dropdown>
            )}
          </>
        }
      />

      {downloadError && (
        <Alert
          color="failure"
          icon={HiExclamationCircle}
          onDismiss={() => setDownloadError(null)}
        >
          {downloadError}
        </Alert>
      )}

      {actionError && (
        <Alert
          color="failure"
          icon={HiExclamationCircle}
          onDismiss={() => setActionError(null)}
        >
          {actionError}
        </Alert>
      )}

      {/* Status banner — filing lifecycle + provenance.
          `relative z-[5]` lifts this card — and the inline ViewModeToggle /
          renderer-toggle dropdowns it holds — above the report cards below it.
          Flowbite dropdowns render inline (no portal), so their menus would
          otherwise be painted under the next `backdrop-blur` card (which forms
          its own stacking context). Kept under z-10 so the PageHeader kebab
          menu still paints over this card. */}
      <Card className="relative z-[5]">
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
            <span className="text-primary-400 flex items-center gap-1">
              <HiShare className="h-4 w-4" />
              Shared report
              {pkg.entityName ? ` from ${pkg.entityName}` : ''}
              {pkg.sharedAt
                ? ` — received ${formatDate(pkg.sharedAt.split('T')[0])}`
                : ''}
            </span>
          )}
          <div className="ml-auto flex items-center gap-3">
            {renderer === 'envelope' && (
              <ViewModeToggle viewMode={viewMode} onChange={setViewMode} />
            )}
            <div className="inline-flex overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setRenderer('envelope')}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  renderer === 'envelope'
                    ? 'bg-primary-500 text-white'
                    : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                Package
              </button>
              <button
                type="button"
                onClick={() => setRenderer('holon')}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  renderer === 'holon'
                    ? 'bg-primary-500 text-white'
                    : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                Holon
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Package items — sidebar + stacked BlockViews, one per FactSet.
          The 'holon' renderer swaps in the shared ReportView for comparison. */}
      {renderer === 'holon' ? (
        <Card>
          <HolonReportView
            graphId={graphId}
            reportId={reportId}
            published={pkg.generationStatus === 'published'}
          />
        </Card>
      ) : pkg.items.length === 0 ? (
        <Card>
          <div className="py-12 text-center text-gray-500 dark:text-gray-400">
            No statements available for this report yet.
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-4 lg:flex-row">
          <ReportPackageSidebar
            items={pkg.items}
            activeFactSetId={activeFactSetId}
            onSelect={scrollToItem}
          />
          <div className="flex min-w-0 flex-1 flex-col gap-4">
            {pkg.items.map((item) => (
              <div
                key={item.factSetId}
                data-fact-set-id={item.factSetId}
                ref={(el) => {
                  if (el) {
                    itemRefs.current.set(item.factSetId, el)
                  } else {
                    itemRefs.current.delete(item.factSetId)
                  }
                }}
                // scroll-margin-top keeps the anchored block clear of the
                // sticky page header when sidebar clicks scroll-to-anchor.
                className="scroll-mt-4"
              >
                <Card>
                  <BlockView
                    envelope={item.block}
                    viewMode={viewMode}
                    entityName={pkg.entityName}
                  />
                </Card>
              </div>
            ))}
          </div>
        </div>
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
            <Alert color={shareOk ? 'success' : 'failure'} className="mb-4">
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
              <LoadingState size="md" className="py-4" />
            ) : publishLists.length === 0 ? (
              <div className="rounded-lg border border-gray-200 p-4 text-center dark:border-gray-700">
                <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                  No publish lists yet.
                </p>
                <Link href="/reports/publish-lists">
                  <Button size="sm" color="purple">
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
                        ? 'border-secondary-500 bg-secondary-50 dark:border-secondary-400 dark:bg-secondary-900/20'
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
            color="purple"
            onClick={handleShare}
            disabled={isSharing || !selectedListId}
          >
            {isSharing ? (
              <Spinner size="sm" className="mr-2 text-white" />
            ) : null}
            Share Report
          </Button>
          <Button color="gray" onClick={() => setShowShareModal(false)}>
            Close
          </Button>
        </ModalFooter>
      </Modal>

      {showSharesModal && graphId && (
        <ManageSharesModal
          graphId={graphId}
          reportId={reportId}
          onClose={() => setShowSharesModal(false)}
        />
      )}

      {showBlockModal && graphId && pkg.sourceGraphId && (
        <BlockSenderModal
          graphId={graphId}
          sourceGraphId={pkg.sourceGraphId}
          sourceLabel={pkg.entityName}
          isAdmin={isAdmin}
          onClose={() => setShowBlockModal(false)}
          onBlocked={() => {}}
        />
      )}

      {/* Deleting a received copy is irreversible and the sender is not
          notified, so it gets an explicit confirm rather than riding the
          dropdown click. */}
      <Modal
        show={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        size="md"
      >
        <ModalHeader>Delete this copy?</ModalHeader>
        <ModalBody>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            This removes the copy of{' '}
            <span className="font-medium text-gray-900 dark:text-white">
              {pkg.name}
            </span>{' '}
            that was shared into this graph, along with its facts. It cannot be
            undone, and the sender is not notified. To stop them sending more,
            block the sender as well.
          </p>
        </ModalBody>
        <ModalFooter>
          <Button
            color="failure"
            onClick={handleDeleteCopy}
            disabled={isDeleting}
          >
            {isDeleting ? <Spinner size="sm" className="mr-2" /> : null}
            Delete copy
          </Button>
          <Button
            color="gray"
            onClick={() => setShowDeleteConfirm(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
        </ModalFooter>
      </Modal>
    </PageLayout>
  )
}

export default ReportViewerContent
