'use client'

import type {
  LibraryClient,
  LibraryElementArc,
  LibraryElementClassification,
  LibraryElementDetail,
} from '@robosystems/client/clients'
import { Alert, Badge, Card, Spinner } from 'flowbite-react'
import { useEffect, useMemo, useState } from 'react'
import { HiExternalLink, HiInformationCircle } from 'react-icons/hi'
import { customTheme } from '../../theme'
import { arcTypeColor, classificationColor } from '../colors'

type LoadState = 'idle' | 'loading' | 'ready' | 'error'

const LABEL_ROLE_ORDER = [
  'standard',
  'verbose',
  'terse',
  'documentation',
  'periodStart',
  'periodEnd',
  'negated',
  'total',
  'commentaryGuidance',
  'other',
]

export function ElementDetail({
  client,
  graphId,
  elementId,
  onSelectElement,
}: {
  client: LibraryClient
  graphId: string
  elementId: string | null
  onSelectElement: (id: string) => void
}) {
  const [element, setElement] = useState<LibraryElementDetail | null>(null)
  const [arcs, setArcs] = useState<LibraryElementArc[]>([])
  const [classifications, setClassifications] = useState<
    LibraryElementClassification[]
  >([])
  const [state, setState] = useState<LoadState>('idle')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!elementId) {
      setElement(null)
      setArcs([])
      setClassifications([])
      setError(null)
      setState('idle')
      return
    }
    let cancelled = false
    setState('loading')
    setError(null)
    Promise.all([
      client.getLibraryElement(graphId, { id: elementId }),
      client.getLibraryElementArcs(graphId, elementId),
      client.getLibraryElementClassifications(graphId, elementId),
    ])
      .then(([el, arcRows, classRows]) => {
        if (cancelled) return
        setElement(el)
        setArcs(arcRows)
        setClassifications(classRows)
        setState('ready')
      })
      .catch((err) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Failed to load element')
        setState('error')
      })
    return () => {
      cancelled = true
    }
  }, [client, graphId, elementId])

  const arcsByTaxonomy = useMemo(() => {
    const groups = new Map<
      string,
      { label: string; arcs: LibraryElementArc[] }
    >()
    for (const arc of arcs) {
      const key =
        arc.taxonomyStandard ?? arc.structureName ?? arc.taxonomyName ?? 'other'
      const label =
        arc.taxonomyStandard ?? arc.structureName ?? arc.taxonomyName ?? 'other'
      if (!groups.has(key)) groups.set(key, { label, arcs: [] })
      groups.get(key)!.arcs.push(arc)
    }
    return groups
  }, [arcs])

  const classificationsByCategory = useMemo(() => {
    const groups = new Map<string, LibraryElementClassification[]>()
    for (const cls of classifications) {
      if (!groups.has(cls.category)) groups.set(cls.category, [])
      groups.get(cls.category)!.push(cls)
    }
    return groups
  }, [classifications])

  const sortedLabels = useMemo(() => {
    if (!element) return []
    return [...element.labels].sort((a, b) => {
      const ia = LABEL_ROLE_ORDER.indexOf(a.role)
      const ib = LABEL_ROLE_ORDER.indexOf(b.role)
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
    })
  }, [element])

  return (
    <section className="col-span-12 min-h-0 md:col-span-7">
      <Card
        theme={customTheme.card}
        className="flex h-full flex-col overflow-hidden"
      >
        {state === 'idle' && (
          <div className="flex h-full items-center justify-center text-sm text-gray-500 dark:text-gray-400">
            Select an element to view details
          </div>
        )}
        {state === 'loading' && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Spinner size="sm" /> Loading element…
          </div>
        )}
        {state === 'error' && (
          <Alert color="failure" icon={HiInformationCircle}>
            {error ?? 'Failed to load element'}
          </Alert>
        )}
        {state === 'ready' && element && (
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
            <div>
              <h2
                className="font-mono text-lg font-semibold break-words text-gray-900 dark:text-white"
                title={element.qname}
              >
                {element.qname}
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {element.name}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {element.trait && (
                <Badge
                  color={classificationColor(element.trait)}
                  title="FASB elementsOfFinancialStatements"
                >
                  {element.trait}
                </Badge>
              )}
              <Badge color="gray">{element.balanceType}</Badge>
              <Badge color="gray">{element.periodType}</Badge>
              <Badge color="gray">{element.elementType}</Badge>
              {element.isAbstract && <Badge color="purple">abstract</Badge>}
              {element.isMonetary && <Badge color="indigo">monetary</Badge>}
              <Badge color="info">{element.source}</Badge>
            </div>

            {classificationsByCategory.size > 0 && (
              <div>
                <h3 className="font-heading mb-2 text-sm font-semibold text-gray-900 dark:text-white">
                  Classifications
                </h3>
                <div className="space-y-2">
                  {Array.from(classificationsByCategory.entries()).map(
                    ([category, items]) => (
                      <div key={category}>
                        <div className="mb-1 px-1 font-mono text-[11px] font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">
                          {category}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {items.map((cls) => (
                            <Badge
                              key={cls.identifier}
                              color={
                                category === 'elementsOfFinancialStatements'
                                  ? classificationColor(cls.identifier)
                                  : 'gray'
                              }
                              size="xs"
                            >
                              {cls.identifier}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {sortedLabels.length > 0 && (
              <div>
                <h3 className="font-heading mb-2 text-sm font-semibold text-gray-900 dark:text-white">
                  Labels
                </h3>
                <ul className="space-y-1">
                  {sortedLabels.map((lab, i) => (
                    <li
                      key={`${lab.role}-${lab.language}-${i}`}
                      className="rounded bg-gray-50 p-2 dark:bg-gray-800"
                    >
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <span className="font-mono">{lab.role}</span>
                        <span>·</span>
                        <span>{lab.language}</span>
                      </div>
                      <p className="text-sm text-gray-900 dark:text-gray-100">
                        {lab.text}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {element.references.length > 0 && (
              <div>
                <h3 className="font-heading mb-2 text-sm font-semibold text-gray-900 dark:text-white">
                  References
                </h3>
                <ul className="space-y-1">
                  {element.references.map((ref, i) => (
                    <li
                      key={i}
                      className="text-sm text-gray-700 dark:text-gray-300"
                    >
                      {ref.refType && (
                        <Badge color="gray" size="xs" className="mr-2">
                          {ref.refType}
                        </Badge>
                      )}
                      {ref.citation}
                      {ref.uri && (
                        <a
                          href={ref.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2 inline-flex items-center gap-1 text-blue-600 hover:underline dark:text-blue-400"
                        >
                          <HiExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {arcs.length > 0 && (
              <div>
                <h3 className="font-heading mb-1 text-sm font-semibold text-gray-900 dark:text-white">
                  Mappings ({arcs.length})
                </h3>
                <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                  Cross-taxonomy arcs — equivalence, generalization, and
                  type-subtype bridges. Click a peer to jump to it.
                </p>
                <div className="space-y-3">
                  {Array.from(arcsByTaxonomy.entries()).map(
                    ([key, { label, arcs: groupArcs }]) => (
                      <div key={key}>
                        <div className="mb-1 flex items-center justify-between px-1">
                          <span className="font-mono text-[11px] font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">
                            {label}
                          </span>
                          <Badge color="gray" size="xs">
                            {groupArcs.length}
                          </Badge>
                        </div>
                        <ul className="space-y-0.5">
                          {groupArcs.map((arc) => (
                            <li key={arc.id}>
                              <button
                                onClick={() => onSelectElement(arc.peer.id)}
                                className="w-full rounded px-2 py-1 text-left transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                                title={`${arc.associationType} · ${arc.direction}`}
                              >
                                <div className="flex items-center gap-2">
                                  <span
                                    className="shrink-0 text-xs text-gray-400 dark:text-gray-500"
                                    title={
                                      arc.direction === 'outgoing'
                                        ? 'this element → peer'
                                        : 'peer → this element'
                                    }
                                  >
                                    {arc.direction === 'outgoing' ? '→' : '←'}
                                  </span>
                                  <span className="truncate font-mono text-xs text-blue-700 dark:text-blue-300">
                                    {arc.peer.qname}
                                  </span>
                                  <Badge
                                    color={arcTypeColor(arc.associationType)}
                                    size="xs"
                                    className="ml-auto shrink-0"
                                  >
                                    {arc.associationType}
                                  </Badge>
                                </div>
                                {arc.peer.name &&
                                  arc.peer.name !==
                                    arc.peer.qname.split(':').pop() && (
                                    <div className="truncate pl-5 text-xs text-gray-500 dark:text-gray-400">
                                      {arc.peer.name}
                                    </div>
                                  )}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    </section>
  )
}
