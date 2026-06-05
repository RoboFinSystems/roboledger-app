'use client'

import {
  ElementBrowser,
  ElementDetail,
  GraphFilters,
  LibraryClient,
  LibraryHierarchy,
  useGraphContext,
  type LibraryTaxonomy,
} from '@/lib/core'
import { getValidToken } from '@/lib/core/auth-core/token-storage'
import { Alert, Select, Spinner } from 'flowbite-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { HiBookOpen, HiInformationCircle } from 'react-icons/hi'

type LoadState = 'idle' | 'loading' | 'ready' | 'error'

export default function LibraryContent() {
  const { state: graphState } = useGraphContext()

  const currentGraph = useMemo(() => {
    const roboledgerGraphs = graphState.graphs.filter(GraphFilters.roboledger)
    return (
      roboledgerGraphs.find((g) => g.graphId === graphState.currentGraphId) ??
      roboledgerGraphs[0] ??
      null
    )
  }, [graphState.graphs, graphState.currentGraphId])

  const graphId = currentGraph?.graphId ?? null

  const clientRef = useRef<LibraryClient | null>(null)
  if (!clientRef.current) {
    clientRef.current = new LibraryClient({
      baseUrl:
        process.env.NEXT_PUBLIC_ROBOSYSTEMS_API_URL || 'http://localhost:8000',
      credentials: 'include',
      tokenProvider: () => getValidToken().catch(() => null),
    })
  }
  const client = clientRef.current

  const [taxonomies, setTaxonomies] = useState<LibraryTaxonomy[]>([])
  const [taxonomiesState, setTaxonomiesState] = useState<LoadState>('idle')
  const [taxonomiesError, setTaxonomiesError] = useState<string | null>(null)

  const [selectedTaxonomyId, setSelectedTaxonomyId] = useState<string | null>(
    null
  )
  const [selectedElementId, setSelectedElementId] = useState<string | null>(
    null
  )
  const [viewMode, setViewMode] = useState<'browse' | 'hierarchy'>('browse')

  // The hierarchy view resolves the arc-owning taxonomy from the selected
  // taxonomy's standard ({base}-calculations / -presentation / -type-subtype).
  const baseStandard = useMemo(
    () => taxonomies.find((t) => t.id === selectedTaxonomyId)?.standard ?? null,
    [taxonomies, selectedTaxonomyId]
  )

  // Browse is an element browser, so show only frameworks with browsable
  // concepts: reporting standards (rs-gaap, fac) + the chart of accounts.
  // Supporting linkbases (rules, traits, mappings, disclosures, reporting
  // styles) carry no elements of their own.
  const sidebarTaxonomies = useMemo(() => {
    const order: Record<string, number> = { 'rs-gaap': 0, sfac6: 1, fac: 2 }
    const allowed = new Set(['reporting_standard', 'chart_of_accounts'])
    return taxonomies
      .filter((t) => allowed.has(t.taxonomyType ?? ''))
      .sort((a, b) => {
        const ai = order[a.standard ?? ''] ?? 99
        const bi = order[b.standard ?? ''] ?? 99
        if (ai !== bi) return ai - bi
        return (a.standard ?? '').localeCompare(b.standard ?? '')
      })
  }, [taxonomies])

  useEffect(() => {
    if (!graphId) return
    setTaxonomiesState('loading')
    setTaxonomies([])
    setSelectedTaxonomyId(null)
    client
      .listLibraryTaxonomies(graphId, { includeElementCount: true })
      .then((rows) => {
        setTaxonomies(rows)
        setTaxonomiesState('ready')
        if (rows.length > 0) {
          // Default to rs-gaap — the active framework (fac has no tenant
          // calc/presentation hierarchies); fall back to fac, then any row.
          const rsGaap = rows.find((r) => r.standard === 'rs-gaap')
          const fac = rows.find((r) => r.standard === 'fac')
          setSelectedTaxonomyId(rsGaap?.id ?? fac?.id ?? rows[0].id)
        }
      })
      .catch((err: Error) => {
        setTaxonomiesError(err.message)
        setTaxonomiesState('error')
      })
  }, [client, graphId])

  if (!graphId) {
    return (
      <div className="mx-auto max-w-[1600px] space-y-6 p-6">
        <Alert color="warning" icon={HiInformationCircle}>
          No qualifying entity graph found. Create or select a RoboLedger graph
          to browse its library.
        </Alert>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 p-3">
            <HiBookOpen className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="font-heading text-3xl font-bold text-gray-900 dark:text-white">
              Taxonomy Library
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Library taxonomies and CoA elements for{' '}
              <span className="font-mono text-xs">
                {currentGraph?.graphName ?? graphId}
              </span>
              . Library content is read-only; CoA elements and anchor mappings
              are tenant-managed.
            </p>
          </div>
        </div>
      </div>

      {taxonomiesState === 'loading' && (
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
          <Spinner size="sm" />
          <span>Loading taxonomies…</span>
        </div>
      )}
      {taxonomiesState === 'error' && (
        <Alert color="failure" icon={HiInformationCircle}>
          Failed to load taxonomies: {taxonomiesError}
        </Alert>
      )}

      {taxonomiesState === 'ready' && (
        <>
          {/* Shared toolbar above both panes: taxonomy scope + view toggle. */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Select
              sizing="sm"
              aria-label="Taxonomy"
              value={selectedTaxonomyId ?? ''}
              onChange={(e) => {
                setSelectedTaxonomyId(e.target.value)
                setSelectedElementId(null)
              }}
              className="shrink-0"
            >
              {sidebarTaxonomies.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.standard ?? t.name}
                  {t.version ? ` ${t.version}` : ''}
                  {typeof t.elementCount === 'number'
                    ? ` (${t.elementCount.toLocaleString()})`
                    : ''}
                </option>
              ))}
            </Select>
            <div
              className="flex shrink-0 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700"
              role="group"
              aria-label="View mode"
            >
              {(['browse', 'hierarchy'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  aria-pressed={viewMode === mode}
                  className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
                    viewMode === mode
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Grid height = viewport minus ~280px of header + toolbar + padding. */}
          <div
            className="grid grid-cols-12 items-stretch gap-6"
            style={{ height: 'calc(100vh - 280px)', minHeight: '560px' }}
          >
            {viewMode === 'browse' ? (
              <ElementBrowser
                key={selectedTaxonomyId ?? 'none'}
                client={client}
                graphId={graphId}
                taxonomyId={selectedTaxonomyId}
                selectedElementId={selectedElementId}
                onSelectElement={setSelectedElementId}
              />
            ) : (
              <LibraryHierarchy
                client={client}
                graphId={graphId}
                taxonomies={taxonomies}
                baseStandard={baseStandard}
                selectedElementId={selectedElementId}
                onSelectElement={setSelectedElementId}
              />
            )}
            <ElementDetail
              client={client}
              graphId={graphId}
              elementId={selectedElementId}
              onSelectElement={setSelectedElementId}
            />
          </div>
        </>
      )}
    </div>
  )
}
