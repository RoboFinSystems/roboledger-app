'use client'

import { Badge, Card } from 'flowbite-react'
import { customTheme } from '../../theme'
import type { LibraryTaxonomy } from '../types'

export function TaxonomySidebar({
  taxonomies,
  selectedId,
  onSelect,
}: {
  taxonomies: LibraryTaxonomy[]
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  return (
    <aside className="col-span-12 min-h-0 md:col-span-3">
      <Card
        theme={customTheme.card}
        className="flex h-full flex-col overflow-hidden"
      >
        <h2 className="font-heading shrink-0 text-lg font-semibold text-gray-900 dark:text-white">
          Taxonomies
        </h2>
        <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto">
          {taxonomies.map((t) => {
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
                    <span
                      className="truncate font-mono text-xs"
                      title={`${t.standard ?? '?'}/${t.version ?? ''}`}
                    >
                      {t.standard ?? '?'}
                      <span className="text-gray-400 dark:text-gray-500">
                        /{t.version ?? ''}
                      </span>
                    </span>
                    {t.elementCount !== null && (
                      <Badge color="gray" size="xs" className="shrink-0">
                        {t.elementCount.toLocaleString()}
                      </Badge>
                    )}
                  </div>
                  <div
                    className="truncate text-xs text-gray-500 dark:text-gray-400"
                    title={t.name}
                  >
                    {t.name}
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      </Card>
    </aside>
  )
}
