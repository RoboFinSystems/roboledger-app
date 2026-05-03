'use client'

import type {
  LibraryClient,
  LibraryStructure,
  LibraryTaxonomy,
} from '@robosystems/client/clients'
import { Alert, Badge, Card, Select, Spinner } from 'flowbite-react'
import { useEffect, useState } from 'react'
import { HiInformationCircle } from 'react-icons/hi'
import { customTheme } from '../../theme'
import { arcTypeColor } from '../colors'

type LoadState = 'idle' | 'loading' | 'ready' | 'error'

const STRUCTURE_TYPE_ORDER: Record<string, number> = {
  // FAC's statement-typed structures (and equivalents) come first, in the
  // canonical financial-statement reading order.
  balance_sheet: 0,
  income_statement: 1,
  cash_flow_statement: 2,
  equity_statement: 3,
  // Generic XBRL hierarchy kinds, when surfaced.
  presentation: 10,
  calculation: 11,
  definition: 12,
  dimension: 13,
  // FAC's "custom" bucket holds disclosure/info hierarchies that aren't
  // financial statements (Basic Information, General Information, Key
  // Ratios, Other Information, Validation Results). Sink them last.
  custom: 90,
}

function isBreakdownVariant(s: LibraryStructure): boolean {
  const tail = (s.roleUri ?? '').split('/').pop() ?? ''
  return /breakdown/i.test(tail) || /breakdown/i.test(s.name)
}

function structureSort(a: LibraryStructure, b: LibraryStructure): number {
  if (a.isActive !== b.isActive) return a.isActive ? -1 : 1
  const ta = STRUCTURE_TYPE_ORDER[a.structureType] ?? 50
  const tb = STRUCTURE_TYPE_ORDER[b.structureType] ?? 50
  if (ta !== tb) return ta - tb
  // Within a type, demote -breakdown / breakdown variants below their main.
  const ba = isBreakdownVariant(a) ? 1 : 0
  const bb = isBreakdownVariant(b) ? 1 : 0
  if (ba !== bb) return ba - bb
  return a.name.localeCompare(b.name)
}

function shortRole(roleUri: string | null): string {
  if (!roleUri) return ''
  const tail = roleUri.split('/').pop() ?? roleUri
  return tail
}

export function StructuresBrowser({
  client,
  graphId,
  taxonomyId,
  taxonomies,
  onTaxonomyChange,
  selectedStructureId,
  onSelectStructure,
}: {
  client: LibraryClient
  graphId: string
  taxonomyId: string | null
  taxonomies?: LibraryTaxonomy[]
  onTaxonomyChange?: (id: string) => void
  selectedStructureId: string | null
  onSelectStructure: (id: string) => void
}) {
  const [structures, setStructures] = useState<LibraryStructure[]>([])
  const [state, setState] = useState<LoadState>('idle')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!taxonomyId) {
      setStructures([])
      setState('idle')
      return
    }
    let cancelled = false
    setState('loading')
    setError(null)

    client
      .listLibraryStructures(graphId, { taxonomyId })
      .then((rows) => {
        if (cancelled) return
        setStructures([...rows].sort(structureSort))
        setState('ready')
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(
          err instanceof Error ? err.message : 'Failed to load structures'
        )
        setState('error')
      })

    return () => {
      cancelled = true
    }
  }, [client, graphId, taxonomyId])

  const showTaxonomyDropdown = taxonomies && onTaxonomyChange

  return (
    <section className="col-span-12 min-h-0 md:col-span-3">
      <Card
        theme={customTheme.card}
        className="flex h-full flex-col overflow-hidden"
      >
        <h2 className="font-heading shrink-0 text-lg font-semibold text-gray-900 dark:text-white">
          Structures
        </h2>

        {showTaxonomyDropdown && (
          <Select
            sizing="sm"
            value={taxonomyId ?? ''}
            onChange={(e) => onTaxonomyChange?.(e.target.value)}
            className="shrink-0"
            aria-label="Taxonomy"
          >
            {taxonomies.map((t) => (
              <option key={t.id} value={t.id}>
                {t.standard ?? t.name}
                {t.version ? ` ${t.version}` : ''}
              </option>
            ))}
          </Select>
        )}

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

        {state === 'ready' && structures.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            This taxonomy contributes no structures.
          </p>
        )}

        <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto">
          {structures.map((s) => {
            const isSelected = s.id === selectedStructureId
            return (
              <li key={s.id}>
                <button
                  onClick={() => onSelectStructure(s.id)}
                  className={`w-full rounded px-3 py-2 text-left text-sm transition-colors ${
                    isSelected
                      ? 'bg-blue-100 text-blue-900 dark:bg-blue-900/50 dark:text-blue-100'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800'
                  } ${s.isActive ? '' : 'opacity-60'}`}
                >
                  <div className="truncate text-sm font-medium" title={s.name}>
                    {s.name}
                  </div>
                  <div className="mt-0.5 flex items-center justify-between gap-2">
                    <span
                      className="truncate font-mono text-xs text-gray-500 dark:text-gray-400"
                      title={s.roleUri ?? ''}
                    >
                      {shortRole(s.roleUri)}
                    </span>
                    <Badge
                      color={arcTypeColor(s.structureType)}
                      size="xs"
                      className="shrink-0"
                    >
                      {s.structureType}
                    </Badge>
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      </Card>
    </section>
  )
}
