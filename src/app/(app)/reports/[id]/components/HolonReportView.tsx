'use client'

import { csvRow } from '@/lib/ledger/csv'
import { clients, getAuthHeader } from '@robosystems/core'
import type { NormalizedReport } from '@robosystems/report-components'
import {
  buildPivots,
  pivotToCsv,
  reportSections,
  ReportView,
  sliceReportSection,
} from '@robosystems/report-components'
import { parseReportDocument } from '@robosystems/report-components/adapters'
import { Alert, Button, Spinner } from 'flowbite-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { HiDownload, HiExclamationCircle } from 'react-icons/hi'
import {
  downloadCsv,
  exportFilename,
} from '../../../explorer/components/serialize'

/**
 * Comparison renderer: this Report rendered through the shared
 * ``@robosystems/report-components`` library instead of the in-app
 * ``BlockView``. The report's holon (the JSON-LD the report is published as,
 * and the one file that carries all of it) is normalized by
 * ``parseReportDocument`` and
 * ``<ReportView>`` reconstructs the statement tables + fact inspector,
 * identically to the standalone xbrlkit viewer and RoboInvestor's SEC path. A
 * section sidebar (``reportSections`` / ``sliceReportSection``) renders one
 * statement at a time.
 *
 * The document loads automatically: the client mints the presigned S3 URL via
 * the SDK, then reads it through the same-origin ``/api/reports/holon`` proxy
 * (the S3 bucket has no CORS, so a direct browser fetch is blocked). The holon
 * is asked for first; a report whose holon is not available falls back to the
 * Tavi compiled model, which the same parser reads. Either exists only once
 * the report is published.
 */
interface HolonReportViewProps {
  graphId: string | null
  reportId: string
  /** Whether the report is published (a document only exists once published). */
  published: boolean
  /**
   * Ask for the holon with lineage first: the report is this graph's own, so
   * its figures can walk to the books. Off for a report shared in from
   * another graph.
   */
  lineage?: boolean
}

/** A section's statement tables as one CSV, row for row with the tables on
 *  screen; a section holding several opens each with its title. */
export function sectionCsv(slice: NormalizedReport): string {
  const tables = buildPivots(slice)
  if (tables.length === 1) return pivotToCsv(tables[0])
  return tables
    .map((table) => `${csvRow([table.title])}\n${pivotToCsv(table)}`)
    .join('\n\n')
}

/** The renderable flavors, in the order they are tried. */
const RENDER_FORMATS = ['HOLON_JSONLD', 'TAVI'] as const
/**
 * For the graph's own reports the holon with its `#lineage` graph is tried
 * first, so a figure walks to its ledger lines in the fact inspector; it is
 * never offered for a report shared in from another graph, which carries no
 * lineage, and any failure falls through to the plain holon as before.
 */
const RENDER_FORMATS_WITH_LINEAGE = [
  'HOLON_JSONLD_LINEAGE',
  ...RENDER_FORMATS,
] as const
type RenderFormat = (typeof RENDER_FORMATS_WITH_LINEAGE)[number]

export default function HolonReportView({
  graphId,
  reportId,
  published,
  lineage = false,
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

  // The document is fully in memory, so slicing to one section is instant.
  const activeSlice = useMemo(() => {
    if (!report) return null
    if (!selectedSectionId) return report
    return sliceReportSection(report, selectedSectionId)
  }, [report, selectedSectionId])

  // Default-select the first section whenever the report loads.
  useEffect(() => {
    if (report) setSelectedSectionId(reportSections(report)[0]?.id ?? null)
  }, [report])

  // Mint the presigned URL for one flavor (SDK, authenticated) then read it
  // through the same-origin proxy — the S3 bucket has no CORS so a direct
  // browser fetch is blocked cross-origin. Returns the document text, or null
  // when the report does not exist.
  const fetchDocument = useCallback(
    async (format: RenderFormat): Promise<string | null> => {
      if (!graphId) return null
      const resp = await clients.reports.getReportDownloadUrl(
        graphId,
        reportId,
        { format }
      )
      if (!resp) return null
      // The proxy answers only the app's own call, which carries the session
      // bearer; a missing token is refused there like any other caller.
      const proxied = await fetch('/api/reports/holon', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: getAuthHeader() ?? '',
        },
        body: JSON.stringify({ url: resp.downloadUrl }),
      })
      if (!proxied.ok) {
        const detail = (await proxied.json().catch(() => null)) as {
          error?: string
        } | null
        throw new Error(detail?.error ?? `Proxy returned ${proxied.status}`)
      }
      return proxied.text()
    },
    [graphId, reportId]
  )

  const loadFromServer = useCallback(async () => {
    if (!graphId) return
    setIsLoading(true)
    setError(null)
    try {
      // The holon first; the Tavi only when the holon is not available. The SDK
      // resolves to null only when the report itself does not exist, so that
      // ends the search; a flavor that is not materialized (the
      // REPORT_BUNDLE_NOT_AVAILABLE answer) arrives as a thrown GraphQL error,
      // and any failure on the holon — that one, or a transient fault — moves
      // on to the Tavi, whose own failure is the one reported.
      let text: string | null = null
      let missing = false
      const formats = lineage ? RENDER_FORMATS_WITH_LINEAGE : RENDER_FORMATS
      for (const [index, format] of formats.entries()) {
        try {
          text = await fetchDocument(format)
          if (text === null) missing = true
          break
        } catch (err) {
          if (index === formats.length - 1) throw err
        }
      }
      if (missing || text === null) {
        setError('Report not found.')
        return
      }
      const { report: parsed } = await parseReportDocument(text)
      if (!parsed.informationBlocks.length) {
        setError('No Information Blocks found in this report.')
        return
      }
      setReport(parsed)
    } catch (err) {
      setError(
        `Could not load this report: ${
          err instanceof Error ? err.message : String(err)
        }`
      )
    } finally {
      setIsLoading(false)
    }
  }, [graphId, lineage, fetchDocument])

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
          {activeSlice && (
            <>
              <div className="mb-2 flex justify-end">
                <Button
                  size="xs"
                  color="light"
                  onClick={() =>
                    downloadCsv(
                      sectionCsv(activeSlice),
                      exportFilename(
                        (
                          sections.find((s) => s.id === selectedSectionId) ??
                          sections[0]
                        )?.title ?? 'statement',
                        'csv',
                        'statement'
                      )
                    )
                  }
                >
                  <HiDownload className="mr-1 h-4 w-4" />
                  Export CSV
                </Button>
              </div>
              <ReportView report={activeSlice} />
            </>
          )}
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-3 py-16 text-sm text-gray-500 dark:text-gray-400">
        <Spinner size="lg" />
        Loading report…
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

  // Not published — nothing has been materialized yet.
  return (
    <div className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">
      This view is generated once the report is published.
    </div>
  )
}
