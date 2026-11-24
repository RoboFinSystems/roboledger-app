'use client'

import type { LedgerIndustry } from '@robosystems/client/clients'
import { Label, TextInput } from '@robosystems/core/ui'
import { useEffect, useMemo, useRef, useState } from 'react'

const MAX_RESULTS = 50
const SEPARATOR = ' › '

const pathText = (node: LedgerIndustry) => node.path.join(SEPARATOR)

/**
 * The nodes a query finds, best first: a name that starts with the query, then
 * a name that contains it, then one whose path does. Retired nodes are never
 * offered.
 */
export function searchIndustries(
  industries: LedgerIndustry[],
  query: string
): LedgerIndustry[] {
  const q = query.trim().toLowerCase()
  const active = industries.filter((node) => !node.replacedBy && !node.carried)
  if (!q) return active.filter((node) => node.level === 'sector')
  const rank = (node: LedgerIndustry) => {
    const label = node.label.toLowerCase()
    if (label.startsWith(q)) return 0
    if (label.includes(q)) return 1
    if (pathText(node).toLowerCase().includes(q)) return 2
    return -1
  }
  return active
    .map((node) => ({ node, rank: rank(node) }))
    .filter((hit) => hit.rank >= 0)
    .sort((a, b) => a.rank - b.rank || a.node.path.length - b.node.path.length)
    .slice(0, MAX_RESULTS)
    .map((hit) => hit.node)
}

/**
 * An entity's industry: a choice from the classification, at any level, shown
 * as its path. A value from before the classification is shown as stored and
 * is replaced only when the user picks from the list.
 */
export default function IndustryField({
  value,
  editing,
  selected,
  onChange,
  industries,
  failed = false,
}: {
  /** The stored industry: a node id, text from before the list, or empty. */
  value?: string | null
  editing: boolean
  /** The form's current choice while editing. */
  selected: string
  onChange: (id: string) => void
  /** The classification; null while it loads and when it could not be read. */
  industries: LedgerIndustry[] | null
  /** The classification could not be read, as against not having arrived yet. */
  failed?: boolean
}) {
  const byId = useMemo(
    () => new Map((industries ?? []).map((node) => [node.id, node])),
    [industries]
  )
  const [query, setQuery] = useState<string | null>(null)
  const [activeIndex, setActiveIndex] = useState(-1)
  const listRef = useRef<HTMLUListElement>(null)
  // Keep the highlighted option in view as the arrow keys move it.
  useEffect(() => {
    if (activeIndex < 0) return
    const option = listRef.current?.children[activeIndex] as
      HTMLElement | undefined
    option?.scrollIntoView?.({ block: 'nearest' })
  }, [activeIndex])

  const labelClass = 'mb-1 text-sm font-medium text-gray-500 dark:text-gray-400'
  const display = (stored?: string | null) => {
    const node = stored ? byId.get(stored) : undefined
    return node ? pathText(node) : stored || ''
  }

  if (!editing) {
    return (
      <div>
        <dt className={labelClass}>Industry</dt>
        <dd className="text-base break-words text-gray-900 dark:text-white">
          {display(value) || (
            <span className="text-gray-400 dark:text-gray-500">--</span>
          )}
        </dd>
      </div>
    )
  }

  if (!industries) {
    return (
      <div>
        <Label htmlFor="industry" className={labelClass}>
          Industry
        </Label>
        <TextInput
          id="industry"
          sizing="sm"
          value={display(selected)}
          disabled
          readOnly
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {failed
            ? 'The industry list could not be loaded.'
            : 'Loading industries…'}
        </p>
      </div>
    )
  }

  const chosen = selected ? byId.get(selected) : undefined
  // Text from before the list: kept until the user picks a replacement.
  const legacy = selected && !chosen ? selected : null
  const open = query !== null
  const results = open ? searchIndustries(industries, query) : []
  const optionId = (index: number) => `industry-option-${index}`

  const close = () => {
    setQuery(null)
    setActiveIndex(-1)
  }
  const pick = (node: LedgerIndustry) => {
    onChange(node.id)
    close()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      close()
      return
    }
    // Closed with focus still here (after a pick or Escape): the box shows the
    // chosen path, so a search starts from empty, not from that text.
    if (!open) {
      const typing = e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey
      if (typing || e.key === 'ArrowDown' || e.key === 'Backspace') setQuery('')
      if (e.key === 'ArrowDown' || e.key === 'Backspace') e.preventDefault()
      return
    }
    if (results.length === 0) {
      if (e.key === 'Enter') e.preventDefault()
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => (i + 1) % results.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => (i <= 0 ? results.length - 1 : i - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (activeIndex >= 0) pick(results[activeIndex])
    }
  }

  return (
    <div>
      <Label htmlFor="industry" className={labelClass}>
        Industry
      </Label>
      <div className="relative">
        <TextInput
          id="industry"
          sizing="sm"
          value={open ? query : chosen ? pathText(chosen) : ''}
          placeholder="Search industries"
          onChange={(e) => {
            setQuery(e.target.value)
            setActiveIndex(-1)
          }}
          onFocus={() => setQuery('')}
          onClick={() => {
            if (!open) setQuery('')
          }}
          onBlur={close}
          onKeyDown={handleKeyDown}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open && results.length > 0}
          aria-controls={
            open && results.length > 0 ? 'industry-options' : undefined
          }
          aria-activedescendant={
            open && activeIndex >= 0 ? optionId(activeIndex) : undefined
          }
          autoComplete="off"
        />
        {open && results.length > 0 && (
          <ul
            ref={listRef}
            id="industry-options"
            role="listbox"
            aria-label="Industries"
            className="absolute z-10 mt-1 max-h-64 w-full min-w-64 overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800"
          >
            {results.map((node, index) => (
              <li
                key={node.id}
                id={optionId(index)}
                role="option"
                aria-selected={index === activeIndex}
                // onMouseDown so the pick wins over the input's blur.
                onMouseDown={(e) => {
                  e.preventDefault()
                  pick(node)
                }}
              >
                {/* Not a button: the option is picked from the input, and a
                    focusable child would take Tab and vanish with the list. */}
                <div
                  className={`w-full cursor-pointer px-3 py-1.5 text-left text-sm ${
                    index === activeIndex
                      ? 'bg-gray-100 dark:bg-gray-700'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <span className="text-gray-900 dark:text-white">
                    {node.label}
                  </span>
                  {node.path.length > 1 && (
                    <span className="block text-xs text-gray-500 dark:text-gray-400">
                      {node.path.slice(0, -1).join(SEPARATOR)}
                    </span>
                  )}
                </div>
              </li>
            ))}
            {results.length === MAX_RESULTS && (
              <li
                role="presentation"
                className="px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400"
              >
                Showing the first {MAX_RESULTS}. Keep typing to narrow.
              </li>
            )}
          </ul>
        )}
        {open && query.trim() !== '' && results.length === 0 && (
          <p className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-500 shadow-lg dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
            No industry matches.
          </p>
        )}
      </div>
      {legacy && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Currently “{legacy}”. Choose from the list to replace it.
        </p>
      )}
      {selected && (
        <button
          type="button"
          className="mt-1 text-xs text-gray-500 underline hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          onClick={() => onChange('')}
        >
          Clear
        </button>
      )}
    </div>
  )
}
