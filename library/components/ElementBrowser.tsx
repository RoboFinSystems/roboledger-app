'use client'

import { Alert, Badge, Button, Card, Spinner, TextInput } from 'flowbite-react'
import { useCallback, useEffect, useState } from 'react'
import { HiInformationCircle, HiSearch } from 'react-icons/hi'
import { customTheme } from '../../theme'
import { classificationColor, classificationLabel } from '../colors'
import type {
  LibraryClient,
  LibraryElement,
  LibrarySearchResult,
} from '../types'
import { ClassificationPicker } from './ClassificationPicker'
import { DerivationRolePicker } from './DerivationRolePicker'
import { StatementContextPicker } from './StatementContextPicker'

type LoadState = 'idle' | 'loading' | 'ready' | 'error'
type ListItem = LibraryElement | LibrarySearchResult

const PAGE_SIZE = 50

export function ElementBrowser({
  client,
  graphId,
  taxonomyId,
  selectedElementId,
  onSelectElement,
}: {
  client: LibraryClient
  graphId: string
  taxonomyId: string | null
  selectedElementId: string | null
  onSelectElement: (id: string) => void
}) {
  const [elements, setElements] = useState<ListItem[]>([])
  const [state, setState] = useState<LoadState>('idle')
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [offset, setOffset] = useState(0)
  const [classification, setClassification] = useState<string | null>(null)
  const [statementContext, setStatementContext] = useState<string | null>(null)
  const [derivationRole, setDerivationRole] = useState<string | null>(null)

  const activeQuery = search.trim()
  const searchMode = activeQuery.length > 0

  const load = useCallback(async () => {
    setState('loading')
    setError(null)
    try {
      const rows = searchMode
        ? await client.searchLibraryElements(graphId, activeQuery, {
            limit: PAGE_SIZE,
          })
        : await client.listLibraryElements(graphId, {
            taxonomyId: taxonomyId ?? undefined,
            classification:
              classification && classification !== 'abstract'
                ? classification
                : undefined,
            statementContext: statementContext ?? undefined,
            derivationRole: derivationRole ?? undefined,
            isAbstract:
              classification === 'abstract'
                ? true
                : classification !== null
                  ? false
                  : null,
            limit: PAGE_SIZE,
            offset,
          })
      setElements(rows)
      setState('ready')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setState('error')
    }
  }, [
    client,
    graphId,
    taxonomyId,
    offset,
    classification,
    statementContext,
    derivationRole,
    searchMode,
    activeQuery,
  ])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    setOffset(0)
  }, [
    taxonomyId,
    classification,
    statementContext,
    derivationRole,
    activeQuery,
  ])

  return (
    <section className="col-span-12 min-h-0 md:col-span-4">
      <Card
        theme={customTheme.card}
        className="flex h-full flex-col overflow-hidden"
      >
        <h2 className="font-heading shrink-0 text-lg font-semibold text-gray-900 dark:text-white">
          Elements
        </h2>

        <div className="flex gap-2">
          <TextInput
            icon={HiSearch}
            sizing="sm"
            placeholder="Search qname, name, label…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1"
          />
        </div>

        <div className="space-y-1">
          <ClassificationPicker
            selected={classification}
            onSelect={setClassification}
            disabled={searchMode}
          />
          <StatementContextPicker
            selected={statementContext}
            onSelect={setStatementContext}
            disabled={searchMode}
          />
          <DerivationRolePicker
            selected={derivationRole}
            onSelect={setDerivationRole}
            disabled={searchMode}
          />
        </div>

        {state === 'loading' && (
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Spinner size="sm" /> Loading…
          </div>
        )}
        {state === 'error' && (
          <Alert color="failure" icon={HiInformationCircle}>
            {error}
          </Alert>
        )}

        {state === 'ready' && elements.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No elements match these filters.
          </p>
        )}

        <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto">
          {elements.map((el) => {
            const isSelected = el.id === selectedElementId
            return (
              <li key={el.id}>
                <button
                  onClick={() => onSelectElement(el.id)}
                  className={`w-full rounded px-3 py-2 text-left text-sm transition-colors ${
                    isSelected
                      ? 'bg-blue-100 text-blue-900 dark:bg-blue-900/50 dark:text-blue-100'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className="truncate font-mono text-sm" title={el.qname}>
                    {el.qname}
                  </div>
                  <div className="mt-0.5 flex items-center justify-between gap-2">
                    <span
                      className="truncate text-xs text-gray-500 dark:text-gray-400"
                      title={el.name}
                    >
                      {el.name}
                    </span>
                    <Badge
                      color={
                        el.elementType === 'hypercube'
                          ? 'indigo'
                          : el.isAbstract
                            ? 'purple'
                            : classificationColor(el.classification ?? '')
                      }
                      size="xs"
                      className="shrink-0"
                    >
                      {el.elementType === 'hypercube'
                        ? 'hypercube'
                        : el.isAbstract
                          ? 'abstract'
                          : classificationLabel(el.classification ?? '—')}
                    </Badge>
                  </div>
                </button>
              </li>
            )
          })}
        </ul>

        {!searchMode && state === 'ready' && elements.length === PAGE_SIZE && (
          <div className="flex shrink-0 justify-between pt-2">
            <Button
              size="xs"
              color="gray"
              disabled={offset === 0}
              onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
            >
              ← Previous
            </Button>
            <span className="self-center text-xs text-gray-500 dark:text-gray-400">
              {offset + 1}–{offset + elements.length}
            </span>
            <Button
              size="xs"
              color="gray"
              onClick={() => setOffset(offset + PAGE_SIZE)}
            >
              Next →
            </Button>
          </div>
        )}
      </Card>
    </section>
  )
}
