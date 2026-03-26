'use client'

import type {
  DocumentSection,
  SearchHit,
  SearchResponse,
} from '@robosystems/client'
import * as SDK from '@robosystems/client'
import {
  Alert,
  Badge,
  Button,
  Card,
  Select,
  Spinner,
  TextInput,
} from 'flowbite-react'
import { useCallback, useEffect, useState } from 'react'
import { HiChevronDown, HiChevronUp, HiSearch } from 'react-icons/hi'
import ReactMarkdown from 'react-markdown'

import { useGraphContext } from '../../contexts'
import { customTheme } from '../../theme'
import { PageLayout } from '../PageLayout'
import type { SearchConfig } from './types'

const PAGE_SIZE = 20

export function SearchContent({ config }: { config: SearchConfig }) {
  const { state: graphState } = useGraphContext()
  const graphId = graphState.currentGraphId

  // Search state
  const [query, setQuery] = useState('')
  const [sourceType, setSourceType] = useState(config.defaultSourceType ?? '')
  const [entity, setEntity] = useState('')
  const [formType, setFormType] = useState('')
  const [fiscalYear, setFiscalYear] = useState('')

  // Results state
  const [results, setResults] = useState<SearchHit[]>([])
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchedQuery, setSearchedQuery] = useState('')

  // Document stats
  const [docCount, setDocCount] = useState<number | null>(null)

  // Expanded section
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null)
  const [sectionContent, setSectionContent] = useState<DocumentSection | null>(
    null
  )
  const [sectionLoading, setSectionLoading] = useState(false)

  // Filters visibility
  const [showFilters, setShowFilters] = useState(false)
  const filters = config.filters ?? { sourceType: true }

  // Load document stats when graph changes
  useEffect(() => {
    if (!graphId) {
      setDocCount(null)
      return
    }
    SDK.listDocuments({ path: { graph_id: graphId } }).then((res) => {
      if (res.data) {
        setDocCount(res.data.total)
      }
    })
  }, [graphId])

  // Reset when graph changes
  useEffect(() => {
    setResults([])
    setTotal(0)
    setOffset(0)
    setSearchedQuery('')
    setError(null)
    setExpandedDocId(null)
    setSectionContent(null)
  }, [graphId])

  const handleSearch = useCallback(
    async (newOffset = 0) => {
      if (!graphId || !query.trim()) return

      setLoading(true)
      setError(null)
      setExpandedDocId(null)
      setSectionContent(null)

      try {
        const body: Record<string, unknown> = {
          query: query.trim(),
          size: PAGE_SIZE,
          offset: newOffset,
        }

        if (sourceType) body.source_type = sourceType
        if (entity) body.entity = entity
        if (formType) body.form_type = formType
        if (fiscalYear) body.fiscal_year = parseInt(fiscalYear, 10)

        const res = await SDK.searchDocuments({
          path: { graph_id: graphId },
          body: body as SDK.SearchRequest,
        })

        if (res.data) {
          const data = res.data as SearchResponse
          setResults(data.hits)
          setTotal(data.total)
          setOffset(newOffset)
          setSearchedQuery(data.query)
        } else {
          setError('Search failed. Please try again.')
        }
      } catch {
        setError('An error occurred while searching.')
      } finally {
        setLoading(false)
      }
    },
    [graphId, query, sourceType, entity, formType, fiscalYear]
  )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(0)
    }
  }

  const handleExpand = async (docId: string) => {
    if (expandedDocId === docId) {
      setExpandedDocId(null)
      setSectionContent(null)
      return
    }

    if (!graphId) return
    setExpandedDocId(docId)
    setSectionLoading(true)

    try {
      const res = await SDK.getDocumentSection({
        path: { graph_id: graphId, document_id: docId },
      })
      if (res.data) {
        setSectionContent(res.data as DocumentSection)
      }
    } catch {
      setSectionContent(null)
    } finally {
      setSectionLoading(false)
    }
  }

  const hasFilters =
    filters.entity ||
    filters.formType ||
    filters.fiscalYear ||
    filters.sourceType

  if (!graphId) {
    return (
      <PageLayout>
        <div className="py-12 text-center">
          <div className="mx-auto mb-4 w-fit rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 p-3">
            <HiSearch className="h-8 w-8 text-white" />
          </div>
          <h2 className="font-heading text-lg font-semibold text-gray-700 dark:text-gray-300">
            {config.title}
          </h2>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            Select a graph to search documents.
          </p>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 p-3">
          <HiSearch className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="font-heading text-3xl font-bold text-gray-900 dark:text-white">
            {config.title}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {config.description}
            {docCount !== null && (
              <span className="ml-2 text-gray-400 dark:text-gray-500">
                ({docCount} document{docCount !== 1 ? 's' : ''} indexed)
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <Card theme={customTheme.card}>
        <div className="space-y-4">
          <div className="flex gap-2">
            <TextInput
              className="flex-1"
              placeholder={config.placeholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              icon={HiSearch}
            />
            <Button
              color="purple"
              onClick={() => handleSearch(0)}
              disabled={loading || !query.trim()}
            >
              {loading ? <Spinner size="sm" /> : 'Search'}
            </Button>
          </div>

          {/* Toggles row */}
          <div className="flex flex-wrap items-center gap-4">
            {hasFilters && (
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Filters
                {showFilters ? (
                  <HiChevronUp className="h-4 w-4" />
                ) : (
                  <HiChevronDown className="h-4 w-4" />
                )}
              </button>
            )}
          </div>

          {/* Collapsible filters */}
          {showFilters && hasFilters && (
            <div className="grid grid-cols-1 gap-3 border-t border-gray-200 pt-4 sm:grid-cols-2 lg:grid-cols-4 dark:border-gray-700">
              {filters.sourceType && (
                <div>
                  <label
                    htmlFor="search-source-type"
                    className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400"
                  >
                    Source Type
                  </label>
                  <Select
                    id="search-source-type"
                    value={sourceType}
                    onChange={(e) => setSourceType(e.target.value)}
                  >
                    <option value="">All types</option>
                    <option value="uploaded_doc">Uploaded Documents</option>
                    <option value="memory">AI Memories</option>
                    <option value="narrative_section">
                      Narrative Sections
                    </option>
                    <option value="xbrl_textblock">XBRL Text Blocks</option>
                    <option value="ixbrl_disclosure">iXBRL Disclosures</option>
                  </Select>
                </div>
              )}

              {filters.entity && (
                <div>
                  <label
                    htmlFor="search-entity"
                    className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400"
                  >
                    Entity / Ticker
                  </label>
                  <TextInput
                    id="search-entity"
                    placeholder="e.g. NVDA"
                    value={entity}
                    onChange={(e) => setEntity(e.target.value)}
                  />
                </div>
              )}

              {filters.formType && (
                <div>
                  <label
                    htmlFor="search-form-type"
                    className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400"
                  >
                    Form Type
                  </label>
                  <Select
                    id="search-form-type"
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                  >
                    <option value="">All forms</option>
                    <option value="10-K">10-K (Annual)</option>
                    <option value="10-Q">10-Q (Quarterly)</option>
                    <option value="8-K">8-K (Current)</option>
                    <option value="20-F">20-F (Foreign Annual)</option>
                  </Select>
                </div>
              )}

              {filters.fiscalYear && (
                <div>
                  <label
                    htmlFor="search-fiscal-year"
                    className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400"
                  >
                    Fiscal Year
                  </label>
                  <TextInput
                    id="search-fiscal-year"
                    type="number"
                    placeholder="e.g. 2024"
                    value={fiscalYear}
                    onChange={(e) => setFiscalYear(e.target.value)}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Error */}
      {error && (
        <Alert color="failure">
          <span>{error}</span>
        </Alert>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing {offset + 1}–{Math.min(offset + PAGE_SIZE, total)} of{' '}
              {total} results for &quot;{searchedQuery}&quot;
            </p>
          </div>

          {results.map((hit) => (
            <Card key={hit.document_id} theme={customTheme.card}>
              <button
                type="button"
                className="w-full cursor-pointer text-left"
                onClick={() => handleExpand(hit.document_id)}
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                        {hit.document_title || hit.section_label || 'Untitled'}
                      </h3>
                      {hit.section_label && hit.document_title && (
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          / {hit.section_label}
                        </span>
                      )}
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge color="info" size="xs">
                        {hit.score.toFixed(2)}
                      </Badge>
                      <Badge color="gray" size="xs">
                        {hit.source_type}
                      </Badge>
                      {hit.entity_ticker && (
                        <Badge color="purple" size="xs">
                          {hit.entity_ticker}
                        </Badge>
                      )}
                      {hit.form_type && (
                        <Badge color="warning" size="xs">
                          {hit.form_type}
                        </Badge>
                      )}
                      {hit.fiscal_year && (
                        <Badge color="gray" size="xs">
                          FY{hit.fiscal_year}
                        </Badge>
                      )}
                      {hit.tags?.map((tag) => (
                        <Badge key={tag} color="purple" size="xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    {hit.snippet && (
                      <p className="mt-3 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">
                        {hit.snippet}
                      </p>
                    )}
                  </div>

                  <div className="ml-3 shrink-0 pt-1">
                    {expandedDocId === hit.document_id ? (
                      <HiChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <HiChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </button>

              {/* Expanded content */}
              {expandedDocId === hit.document_id && (
                <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
                  {sectionLoading ? (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Spinner size="sm" />
                      Loading full content...
                    </div>
                  ) : sectionContent ? (
                    <div>
                      <div className="prose prose-sm prose-gray max-h-96 max-w-none overflow-auto rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-800">
                        <ReactMarkdown
                          components={{
                            h1: ({ children }) => (
                              <h1 className="text-gray-900 dark:text-white">
                                {children}
                              </h1>
                            ),
                            h2: ({ children }) => (
                              <h2 className="text-gray-900 dark:text-white">
                                {children}
                              </h2>
                            ),
                            h3: ({ children }) => (
                              <h3 className="text-gray-900 dark:text-white">
                                {children}
                              </h3>
                            ),
                            h4: ({ children }) => (
                              <h4 className="text-gray-900 dark:text-white">
                                {children}
                              </h4>
                            ),
                            p: ({ children }) => (
                              <p className="text-gray-700 dark:text-gray-200">
                                {children}
                              </p>
                            ),
                            li: ({ children }) => (
                              <li className="text-gray-700 dark:text-gray-200">
                                {children}
                              </li>
                            ),
                            strong: ({ children }) => (
                              <strong className="text-gray-900 dark:text-white">
                                {children}
                              </strong>
                            ),
                          }}
                        >
                          {sectionContent.content}
                        </ReactMarkdown>
                      </div>
                      {sectionContent.content_length && (
                        <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                          {sectionContent.content_length.toLocaleString()}{' '}
                          characters
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      Could not load section content.
                    </p>
                  )}
                </div>
              )}
            </Card>
          ))}

          {/* Pagination */}
          {total > PAGE_SIZE && (
            <div className="flex items-center justify-between pt-2">
              <Button
                color="gray"
                size="sm"
                disabled={offset === 0 || loading}
                onClick={() => handleSearch(Math.max(0, offset - PAGE_SIZE))}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Page {Math.floor(offset / PAGE_SIZE) + 1} of{' '}
                {Math.ceil(total / PAGE_SIZE)}
              </span>
              <Button
                color="gray"
                size="sm"
                disabled={offset + PAGE_SIZE >= total || loading}
                onClick={() => handleSearch(offset + PAGE_SIZE)}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Empty state after search */}
      {!loading && searchedQuery && results.length === 0 && (
        <div className="py-8 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            No results found for &quot;{searchedQuery}&quot;.
          </p>
          <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
            Try a different query or adjust your filters.
          </p>
        </div>
      )}
    </PageLayout>
  )
}
