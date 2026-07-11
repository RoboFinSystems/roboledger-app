'use client'

import { clients } from '@robosystems/core'
import type { NormalizedReport } from '@robosystems/report-components'
import {
  ReportView,
  reportSections,
  sliceReportSection,
} from '@robosystems/report-components'
import { parseJsonld } from '@robosystems/report-components/adapters'
import { Alert, Button, Spinner } from 'flowbite-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { HiExclamationCircle } from 'react-icons/hi'

/**
 * Comparison renderer: this Report rendered through the shared
 * ``@robosystems/report-components`` library instead of the in-app
 * ``BlockView``. The report's holon JSON-LD (scene / boundary / projection
 * named graphs) is normalized by ``parseJsonld`` and ``<ReportView>``
 * reconstructs the statement tables + fact inspector, identically to the
 * standalone Holon Viewer and RoboInvestor's SEC path. A section sidebar
 * (``reportSections`` / ``sliceReportSection``) renders one statement at a
 * time.
 *
 * The holon loads automatically: the client mints the presigned S3 URL via the
 * SDK, then reads it through the same-origin ``/api/reports/holon`` proxy (the
 * S3 bucket has no CORS, so a direct browser fetch is blocked). A holon only
 * exists once the report is published.
 */
interface HolonReportViewProps {
  graphId: string | null
  reportId: string
  /** Whether the report is published (a holon only exists once published). */
  published: boolean
}

export default function HolonReportView({
  graphId,
  reportId,
  published,
}: HolonReportViewProps) {
  const [report, setReport] = useState<NormalizedReport | null>(null)
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(
    null
  )
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(published)

  const sections = useMemo(
    () => (report ? reportSections(report) : []),
    [report]
  )

  // A holon is fully in memory, so slicing to one section is instant.
  const activeSlice = useMemo(() => {
    if (!report) return null
    if (!selectedSectionId) return report
    return sliceReportSection(report, selectedSectionId)
  }, [report, selectedSectionId])

  // Default-select the first section whenever the report loads.
  useEffect(() => {
    if (report) setSelectedSectionId(reportSections(report)[0]?.id ?? null)
  }, [report])

  // Mint the presigned holon URL (SDK, authenticated) then read it through the
  // same-origin proxy — the S3 bucket has no CORS so a direct browser fetch is
  // blocked cross-origin.
  const loadFromServer = useCallback(async () => {
    if (!graphId) return
    setIsLoading(true)
    setError(null)
    try {
      const resp = await clients.reports.getReportDownloadUrl(
        graphId,
        reportId,
        { format: 'HOLON_JSONLD' }
      )
      if (!resp) {
        setError('Report not found.')
        return
      }
      const proxied = await fetch('/api/reports/holon', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ url: resp.downloadUrl }),
      })
      if (!proxied.ok) {
        const detail = (await proxied.json().catch(() => null)) as {
          error?: string
        } | null
        throw new Error(detail?.error ?? `Proxy returned ${proxied.status}`)
      }
      const text = await proxied.text()
      const parsed = await parseJsonld(text)
      if (!parsed.informationBlocks.length) {
        setError('No Information Blocks found in this report’s holon.')
        return
      }
      setReport(parsed)
    } catch (err) {
      setError(
        `Could not load this report’s holon: ${
          err instanceof Error ? err.message : String(err)
        }`
      )
    } finally {
      setIsLoading(false)
    }
  }, [graphId, reportId])

  // Load once when the tab opens (published reports only).
  const didInit = useRef(false)
  useEffect(() => {
    if (didInit.current) return
    if (published && graphId) {
      didInit.current = true
      void loadFromServer()
    }
  }, [published, graphId, loadFromServer])

  if (report) {
    return (
      <div className="flex flex-col gap-4 lg:flex-row">
        {sections.length > 1 && (
          <aside className="lg:w-64 lg:shrink-0">
            <nav className="flex flex-col gap-1 lg:sticky lg:top-4">
              {sections.map((section) => {
                const active = section.id === selectedSectionId
                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => setSelectedSectionId(section.id)}
                    aria-current={active}
                    className={`rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      active
                        ? 'bg-primary-500 font-medium text-white'
                        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                    }`}
                  >
                    {section.title}
                  </button>
                )
              })}
            </nav>
          </aside>
        )}
        <div className="rs-report-scope min-w-0 flex-1">
          {activeSlice && <ReportView report={activeSlice} />}
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-3 py-16 text-sm text-gray-500 dark:text-gray-400">
        <Spinner size="lg" />
        Loading holon…
      </div>
    )
  }

  if (error) {
    return (
      <Alert color="failure" icon={HiExclamationCircle}>
        <div className="flex flex-col items-start gap-3">
          <span>{error}</span>
          <Button color="light" size="xs" onClick={loadFromServer}>
            Retry
          </Button>
        </div>
      </Alert>
    )
  }

  // Not published — no holon has been materialized yet.
  return (
    <div className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">
      This report’s holon is generated once it’s published.
    </div>
  )
}
