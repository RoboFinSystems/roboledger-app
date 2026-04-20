'use client'

import {
  ElementBrowser,
  ElementDetail,
  GraphFilters,
  LibraryClient,
  TaxonomySidebar,
  useGraphContext,
  type LibraryTaxonomy,
} from '@/lib/core'
import { getValidToken } from '@/lib/core/auth-core/token-storage'
import { Alert, Spinner } from 'flowbite-react'
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

  const reportingTaxonomies = useMemo(() => {
    const order: Record<string, number> = { sfac6: 0, fac: 1, 'rs-gaap': 2 }
    return taxonomies
      .filter((t) => (t.taxonomyType ?? 'reporting') === 'reporting')
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
          const reporting = rows.filter(
            (r) => (r.taxonomyType ?? 'reporting') === 'reporting'
          )
          const sfac6 = reporting.find((r) => r.standard === 'sfac6')
          const fac = reporting.find((r) => r.standard === 'fac')
          const rsGaap = reporting.find((r) => r.standard === 'rs-gaap')
          setSelectedTaxonomyId(
            sfac6?.id ?? fac?.id ?? rsGaap?.id ?? reporting[0]?.id ?? rows[0].id
          )
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
        <div
          className="grid grid-cols-12 items-stretch gap-6"
          style={{ height: 'calc(100vh - 220px)', minHeight: '600px' }}
        >
          <TaxonomySidebar
            taxonomies={reportingTaxonomies}
            selectedId={selectedTaxonomyId}
            onSelect={(id) => {
              setSelectedTaxonomyId(id)
              setSelectedElementId(null)
            }}
          />
          <ElementBrowser
            client={client}
            graphId={graphId}
            taxonomyId={selectedTaxonomyId}
            selectedElementId={selectedElementId}
            onSelectElement={setSelectedElementId}
          />
          <ElementDetail
            client={client}
            graphId={graphId}
            elementId={selectedElementId}
            onSelectElement={setSelectedElementId}
          />
        </div>
      )}
    </div>
  )
}
