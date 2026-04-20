'use client'

import { Badge, Card } from 'flowbite-react'
import { customTheme } from '../../theme'
import type { LibraryTaxonomy } from '../types'

const SECTION_ORDER = ['reporting', 'chart_of_accounts', 'schedule', 'mapping']
const SECTION_LABELS: Record<string, string> = {
  reporting: 'Reporting',
  chart_of_accounts: 'Chart of Accounts',
  schedule: 'Schedules',
  mapping: 'Mappings',
}

export function TaxonomySidebar({
  taxonomies,
  selectedId,
  onSelect,
}: {
  taxonomies: LibraryTaxonomy[]
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  // Group by taxonomyType, preserve SECTION_ORDER
  const groups: Array<{ type: string; items: LibraryTaxonomy[] }> = []
  const seen = new Set<string>()
  const grouped = new Map<string, LibraryTaxonomy[]>()

  for (const t of taxonomies) {
    const type = t.taxonomyType ?? 'reporting'
    if (!grouped.has(type)) grouped.set(type, [])
    grouped.get(type)!.push(t)
  }

  for (const type of SECTION_ORDER) {
    if (grouped.has(type)) {
      groups.push({ type, items: grouped.get(type)! })
      seen.add(type)
    }
  }
  // Any remaining types not in SECTION_ORDER
  for (const [type, items] of grouped) {
    if (!seen.has(type)) groups.push({ type, items })
  }

  const showSections = groups.length > 1

  return (
    <aside className="col-span-12 min-h-0 md:col-span-3">
      <Card theme={customTheme.card} className="flex h-full flex-col overflow-hidden">
        <h2 className="font-heading shrink-0 text-lg font-semibold text-gray-900 dark:text-white">
          Taxonomies
        </h2>
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto">
          {groups.map(({ type, items }, gi) => (
            <div key={type}>
              {showSections && (
                <div
                  className={`px-1 pb-1 text-[10px] font-semibold tracking-wider text-gray-400 uppercase dark:text-gray-500 ${gi > 0 ? 'border-t border-gray-100 pt-3 dark:border-gray-700' : ''}`}
                >
                  {SECTION_LABELS[type] ?? type}
                </div>
              )}
              <ul className="space-y-1">
                {items.map((t) => {
                  const isSelected = t.id === selectedId
                  return (
                    <li key={t.id}>
                      <button
                        onClick={() => onSelect(t.id)}
                        className={`w-full rounded px-3 py-2 text-left text-sm transition-colors ${
                          isSelected
                            ? 'bg-blue-100 text-blue-900 dark:bg-blue-900/50 dark:text-blue-100'
                            : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          {t.standard ? (
                            <span
                              className="truncate font-mono text-xs"
                              title={`${t.standard}/${t.version ?? ''}`}
                            >
                              {t.standard}
                              <span className="text-gray-400 dark:text-gray-500">
                                /{t.version ?? ''}
                              </span>
                            </span>
                          ) : (
                            <span
                              className="truncate text-xs font-medium"
                              title={t.name}
                            >
                              {t.name}
                            </span>
                          )}
                          {t.elementCount !== null && (
                            <Badge color="gray" size="xs" className="shrink-0">
                              {t.elementCount.toLocaleString()}
                            </Badge>
                          )}
                        </div>
                        {t.standard && (
                          <div
                            className="truncate text-xs text-gray-500 dark:text-gray-400"
                            title={t.name}
                          >
                            {t.name}
                          </div>
                        )}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      </Card>
    </aside>
  )
}
