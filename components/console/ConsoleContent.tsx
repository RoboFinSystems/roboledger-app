'use client'

import type { SearchHit, SearchResponse } from '@robosystems/client'
import * as SDK from '@robosystems/client'
import { Card } from 'flowbite-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { HiTerminal } from 'react-icons/hi'

import { useGraphContext } from '../../contexts'
import { useStreamingQuery } from '../../hooks'
import { customTheme } from '../../theme'
import { ProgressiveText } from './ProgressiveText'
import type { ConsoleConfig, TerminalMessage } from './types'

function generateMessageId() {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
}

// Cap rendered rows so a large result set can't bloat the DOM; the full set
// is always available via the CSV export.
const MAX_TABLE_ROWS = 200

function isNumericValue(value: any): boolean {
  return typeof value === 'number' && Number.isFinite(value)
}

function formatCell(value: any): string {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'number') {
    return Number.isInteger(value)
      ? value.toLocaleString()
      : value.toLocaleString(undefined, { maximumFractionDigits: 2 })
  }
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function rowsToCsv(rows: any[]): string {
  const cols = Object.keys(rows[0])
  const escape = (v: any) => {
    const s =
      v === null || v === undefined
        ? ''
        : typeof v === 'object'
          ? JSON.stringify(v)
          : String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  return [
    cols.join(','),
    ...rows.map((row) => cols.map((c) => escape(row[c])).join(',')),
  ].join('\n')
}

function downloadText(filename: string, text: string, mime: string): void {
  const blob = new Blob([text], { type: mime })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

function copyRowsJson(rows: any[]): void {
  navigator.clipboard?.writeText(JSON.stringify(rows, null, 2))
}

export function ConsoleContent({ config }: { config: ConsoleConfig }) {
  const { state: graphState } = useGraphContext()
  const graphId = graphState.currentGraphId
  const streamingQuery = useStreamingQuery()

  // Terminal state
  const [terminalMessages, setTerminalMessages] = useState<TerminalMessage[]>(
    []
  )
  const [commandInput, setCommandInput] = useState('')
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const terminalEndRef = useRef<HTMLDivElement>(null)
  const terminalScrollRef = useRef<HTMLDivElement>(null)
  const [currentQueryStartTime, setCurrentQueryStartTime] = useState<
    number | null
  >(null)

  const [apiVersion, setApiVersion] = useState<string | null>(null)
  const [operatorProgress, setOperatorProgress] = useState<{
    isRunning: boolean
    message: string
    percentage?: number
  }>({ isRunning: false, message: '' })

  // Track if we've initialized and the previous graph ID
  const hasInitialized = useRef(false)
  const previousGraphId = useRef<string | null>(null)
  const operatorProgressMessageId = useRef<string | null>(null)

  // ── Helpers ──────────────────────────────────────────────────────────

  const getWelcomeMessage = useCallback((): string => {
    const { welcome } = config

    const nlExamples = welcome.naturalLanguageExamples
      .map((ex) => `    "${ex}"`)
      .join('\n')

    const queryExamples = welcome.directQueryExamples
      .map((ex) => `    /query ${ex}`)
      .join('\n')

    const builtInCommands =
      `  /query      - Execute a Cypher query\n` +
      `  /search     - Search documents\n` +
      `  /mcp        - Show MCP connection setup\n` +
      `  /help       - Show this help message\n` +
      `  /clear      - Clear console history\n` +
      `  /examples   - Show example queries`

    const extraLines = (config.extraCommands ?? [])
      .map((ec) => `  ${ec.command.padEnd(12)}- Custom command`)
      .join('\n')

    const commandsBlock = extraLines
      ? `${builtInCommands}\n${extraLines}`
      : builtInCommands

    return (
      `${welcome.consoleName} v${apiVersion} - ${welcome.contextLabel}: ${graphId || 'Not selected'}\n` +
      `═══════════════════════════════════════════════════════════════\n\n` +
      `${welcome.description}\n\n` +
      `USAGE:\n` +
      `  Natural Language (default):\n` +
      `${nlExamples}\n\n` +
      `  Direct Cypher Queries:\n` +
      `${queryExamples}\n\n` +
      `COMMANDS:\n` +
      `${commandsBlock}\n\n` +
      `${welcome.closingMessage}`
    )
  }, [config, apiVersion, graphId])

  const addSystemMessage = useCallback((content: string, animate = false) => {
    const message: TerminalMessage = {
      id: generateMessageId(),
      type: 'system',
      content,
      timestamp: new Date(),
      isAnimating: animate,
    }
    setTerminalMessages((prev) => [...prev, message])
  }, [])

  const addUserMessage = useCallback((content: string) => {
    const message: TerminalMessage = {
      id: generateMessageId(),
      type: 'user',
      content,
      timestamp: new Date(),
    }
    setTerminalMessages((prev) => [...prev, message])
  }, [])

  const addResultMessage = useCallback(
    (content: string, data?: any, cypher?: string) => {
      const message: TerminalMessage = {
        id: generateMessageId(),
        type: 'system',
        content,
        timestamp: new Date(),
        data,
        cypher,
      }
      setTerminalMessages((prev) => [...prev, message])
    },
    []
  )

  const addErrorMessage = useCallback((content: string) => {
    const message: TerminalMessage = {
      id: generateMessageId(),
      type: 'error',
      content,
      timestamp: new Date(),
    }
    setTerminalMessages((prev) => [...prev, message])
  }, [])

  const handleAnimationComplete = (messageId: string) => {
    setTerminalMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, isAnimating: false } : msg
      )
    )
  }

  // ── Effects ─────────────────────────────────────────────────────────

  // Fetch API version from status endpoint
  useEffect(() => {
    const fetchApiVersion = async () => {
      try {
        const apiUrl =
          process.env.NEXT_PUBLIC_ROBOSYSTEMS_API_URL ||
          'https://api.robosystems.ai'
        const response = await fetch(`${apiUrl}/v1/status`)
        const data = await response.json()
        if (data?.details?.version) {
          setApiVersion(data.details.version)
        } else {
          setApiVersion('1.0.0')
        }
      } catch (err) {
        console.error('Failed to fetch API version:', err)
        setApiVersion('1.0.0')
      }
    }
    fetchApiVersion()
  }, [])

  // Detect graph context changes and reset console
  useEffect(() => {
    if (!graphId) return

    if (previousGraphId.current && previousGraphId.current !== graphId) {
      if (streamingQuery.isStreaming) {
        streamingQuery.cancelQuery()
      }

      setTerminalMessages([])
      setCurrentQueryStartTime(null)
      addSystemMessage(
        `═══════════════════════════════════════════════════════════════\n` +
          `${config.welcome.contextLabel} context changed: ${previousGraphId.current} → ${graphId}\n` +
          `═══════════════════════════════════════════════════════════════\n\n` +
          `Console has been reset for the new ${config.welcome.contextLabel.toLowerCase()} context.\n` +
          `All queries will now execute against: ${graphId}\n\n` +
          `Type /help to see available commands.`,
        true
      )

      const timer = setTimeout(() => {
        addSystemMessage(getWelcomeMessage(), true)
      }, 500)

      return () => clearTimeout(timer)
    }

    previousGraphId.current = graphId
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graphId])

  // Initialize terminal with welcome message
  useEffect(() => {
    const isValidGraph =
      graphId && graphState.graphs.some((g) => g.graphId === graphId)
    if (
      !hasInitialized.current &&
      !graphState.isLoading &&
      apiVersion !== null
    ) {
      if (!graphId || isValidGraph) {
        addSystemMessage(getWelcomeMessage(), true)
        hasInitialized.current = true
        previousGraphId.current = graphId
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graphState.isLoading, graphId, graphState.graphs, apiVersion])

  // Auto-scroll terminal to bottom
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [terminalMessages])

  // Scroll handler for progressive text updates
  const scrollToBottom = useCallback(() => {
    terminalEndRef.current?.scrollIntoView({
      behavior: 'auto',
      block: 'nearest',
    })
  }, [])

  // Monitor streaming query status
  useEffect(() => {
    if (!currentQueryStartTime) return

    if (streamingQuery.status === 'completed') {
      const duration = Date.now() - currentQueryStartTime
      let resultText = `Query completed in ${duration}ms\nRows returned: ${streamingQuery.results.length}`
      if (streamingQuery.cached) {
        resultText += `\nCached - Free`
      } else if (streamingQuery.creditsUsed && streamingQuery.creditsUsed > 0) {
        resultText += `\nCredits used: ${streamingQuery.creditsUsed.toFixed(1)}`
      }

      if (streamingQuery.results.length > 0) {
        addResultMessage(resultText, streamingQuery.results)
      } else {
        addResultMessage(resultText)
      }
      setCurrentQueryStartTime(null)
    } else if (streamingQuery.status === 'error') {
      addErrorMessage(streamingQuery.error || 'Query execution failed')
      setCurrentQueryStartTime(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    streamingQuery.status,
    streamingQuery.results,
    streamingQuery.error,
    currentQueryStartTime,
  ])

  // Monitor agent progress
  useEffect(() => {
    if (operatorProgress.isRunning && operatorProgress.message) {
      if (operatorProgressMessageId.current) {
        setTerminalMessages((prev) =>
          prev.map((msg) =>
            msg.id === operatorProgressMessageId.current
              ? {
                  ...msg,
                  content: `${operatorProgress.message}${operatorProgress.percentage !== undefined ? ` (${operatorProgress.percentage}%)` : ''}`,
                }
              : msg
          )
        )
      } else {
        const id = generateMessageId()
        operatorProgressMessageId.current = id
        setTerminalMessages((prev) => [
          ...prev,
          {
            id,
            type: 'system',
            content: `${operatorProgress.message}${operatorProgress.percentage !== undefined ? ` (${operatorProgress.percentage}%)` : ''}`,
            timestamp: new Date(),
          },
        ])
      }
    } else if (
      !operatorProgress.isRunning &&
      operatorProgressMessageId.current
    ) {
      operatorProgressMessageId.current = null
    }
  }, [operatorProgress])

  // ── Command handling ────────────────────────────────────────────────

  const executeCypherQuery = async (cypherQuery: string) => {
    if (!graphId) {
      addErrorMessage(config.noSelectionError)
      return
    }

    // Reset streaming state before starting a new query to prevent the
    // status effect from firing with stale 'completed' results
    streamingQuery.reset()
    setCurrentQueryStartTime(Date.now())

    try {
      await streamingQuery.executeQuery(graphId, cypherQuery)
    } catch (err: any) {
      addErrorMessage(err.message || 'Failed to execute query')
      setCurrentQueryStartTime(null)
    }
  }

  const executeOperatorQuery = async (userQuery: string) => {
    if (!graphId) {
      addErrorMessage(config.noSelectionError)
      return
    }

    const startTime = Date.now()

    try {
      const { clients } = await import('@robosystems/client/clients')

      const result = await clients.operator.executeQuery(
        graphId,
        {
          message: userQuery,
          mode: 'quick',
        },
        {
          mode: 'auto',
          onProgress: (message: string, percentage?: number) => {
            setOperatorProgress({
              isRunning: true,
              message,
              percentage,
            })
          },
        }
      )

      setOperatorProgress({ isRunning: false, message: '' })

      const duration = Date.now() - startTime
      const metadata = (result.metadata || {}) as Record<string, any>

      const creditsUsed = metadata.credits_consumed as number | undefined
      const resultCount = metadata.result_count as number | undefined

      // Prefer the structured outputs the operator loop now returns
      // (metadata.rows + metadata.cypher). Fall back to scraping the prose
      // for backends that don't emit them yet, so this stays compatible
      // during the rollout.
      let rows: any[] | undefined =
        Array.isArray(metadata.rows) &&
        metadata.rows.length > 0 &&
        typeof metadata.rows[0] === 'object'
          ? (metadata.rows as any[])
          : undefined
      let cypher: string | undefined =
        typeof metadata.cypher === 'string' ? metadata.cypher : undefined
      let narrative = result.content

      if (!rows) {
        const jsonBlockMatch = narrative.match(
          /```(?:json)?\s*\n(\[[\s\S]*?\])\s*\n```/
        )
        if (jsonBlockMatch) {
          try {
            const parsed = JSON.parse(jsonBlockMatch[1])
            if (
              Array.isArray(parsed) &&
              parsed.length > 0 &&
              typeof parsed[0] === 'object'
            ) {
              rows = parsed
              narrative = narrative.replace(jsonBlockMatch[0], '').trim()
            }
          } catch {
            // Not valid JSON, keep as text
          }
        }
      }
      if (!cypher) {
        const cypherMatch = narrative.match(/```cypher\s*\n([\s\S]*?)```/)
        if (cypherMatch) {
          cypher = cypherMatch[1].trim()
          narrative = narrative.replace(cypherMatch[0], '').trim()
        }
      }

      // Compact status footer matching the direct-query style.
      let footer = `Query completed in ${duration}ms`
      const count = resultCount ?? rows?.length
      if (count !== undefined) {
        footer += `\nRows returned: ${count}`
      }
      if (creditsUsed != null && Number(creditsUsed) > 0) {
        footer += `\nCredits used: ${Number(creditsUsed).toFixed(1)}`
      }

      const displayText = narrative ? `${narrative}\n\n${footer}` : footer
      addResultMessage(displayText, rows, cypher)
    } catch (error: any) {
      setOperatorProgress({ isRunning: false, message: '' })

      const errorMessage =
        error.message ||
        error.data?.detail ||
        'Failed to process natural language query'

      if (error.status === 402) {
        addErrorMessage(
          `Insufficient credits to process query.\n\nPlease upgrade your subscription or wait for credits to reset.`
        )
      } else if (error.status === 429) {
        addErrorMessage(
          `Rate limit exceeded.\n\nPlease wait a moment before trying again.`
        )
      } else {
        addErrorMessage(`Operator error: ${errorMessage}`)
      }
    }
  }

  const showMcpSetup = async () => {
    addSystemMessage('Creating MCP API key...', true)

    try {
      const { createUserApiKey } = await import('@robosystems/client/sdk')

      const response = await createUserApiKey({
        body: {
          name: `MCP - Console Generated - ${new Date().toLocaleDateString()}`,
        },
      })

      if (!response.data) {
        throw new Error('Failed to create API key')
      }

      const apiKey = response.data.key
      const apiUrl =
        process.env.NEXT_PUBLIC_ROBOSYSTEMS_API_URL ||
        'https://api.robosystems.ai'

      const { mcp } = config
      const exampleLines = mcp.exampleQuestions
        .map((q) => `  • "${q}"`)
        .join('\n')

      addSystemMessage(
        `MCP Setup Instructions:\n` +
          `═══════════════════════════════════════════════════════════════\n\n` +
          `API Key Created Successfully!\n\n` +
          `Add this configuration to claude_desktop_config.json:\n\n` +
          `   {\n` +
          `     "mcpServers": {\n` +
          `       "${mcp.serverName}": {\n` +
          `         "command": "npx",\n` +
          `         "args": ["-y", "${mcp.packageName}@latest"],\n` +
          `         "env": {\n` +
          `           "ROBOSYSTEMS_API_URL": "${apiUrl}",\n` +
          `           "ROBOSYSTEMS_API_KEY": "${apiKey}",\n` +
          `           "ROBOSYSTEMS_GRAPH_ID": "${graphId || mcp.contextIdFallback}"\n` +
          `         }\n` +
          `       }\n` +
          `     }\n` +
          `   }\n\n` +
          `Restart Claude Desktop or Claude Code to apply.\n\n` +
          `Once connected, ask Claude questions like:\n` +
          `${exampleLines}\n\n` +
          `Keep this API key secure! It has full access to your account.`,
        true
      )
    } catch (error: any) {
      addErrorMessage(
        `Failed to create API key: ${error.message || 'Unknown error'}\n\n` +
          `You can manually create an API key in Settings and use it with:\n` +
          `  ROBOSYSTEMS_API_URL: https://api.robosystems.ai\n` +
          `  ROBOSYSTEMS_GRAPH_ID: ${graphId || config.mcp.contextIdFallback}`
      )
    }
  }

  const handleCommand = async (command: string) => {
    if (!command.trim()) return

    addUserMessage(command)
    setCommandHistory((prev) => [...prev, command])
    setHistoryIndex(-1)
    setCommandInput('')

    // Handle /query command
    if (command.toLowerCase().startsWith('/query ')) {
      const cypherQuery = command.slice(7).trim()
      if (cypherQuery) {
        await executeCypherQuery(cypherQuery)
      } else {
        addErrorMessage('Usage: /query <cypher-query>')
      }
      return
    }

    // Handle /search command
    if (command.toLowerCase().startsWith('/search')) {
      const searchQuery = command.slice(7).trim()
      if (!searchQuery) {
        addErrorMessage(
          'Usage: /search <query>\n\nExamples:\n  /search revenue recognition\n  /search month end close procedures'
        )
        return
      }
      if (!graphId) {
        addErrorMessage('No graph selected. Please select a graph first.')
        return
      }
      addSystemMessage(`Searching for "${searchQuery}"...`)
      try {
        const body: Record<string, unknown> = {
          query: searchQuery,
          size: 10,
        }
        const res = await SDK.searchDocuments({
          path: { graph_id: graphId },
          body: body as SDK.SearchRequest,
        })
        if (res.data) {
          const data = res.data as SearchResponse
          if (data.hits.length === 0) {
            addSystemMessage(`No results found for "${searchQuery}".`)
          } else {
            const lines = data.hits.map((hit: SearchHit, idx: number) => {
              const title =
                hit.document_title || hit.section_label || 'Untitled'
              const section =
                hit.section_label && hit.document_title
                  ? ` > ${hit.section_label}`
                  : ''
              const tags = hit.tags?.length ? `  [${hit.tags.join(', ')}]` : ''
              const snippet = hit.snippet
                ? `\n     ${hit.snippet.slice(0, 150)}${hit.snippet.length > 150 ? '...' : ''}`
                : ''
              return `  ${idx + 1}. [${hit.score.toFixed(2)}] ${title}${section}${tags}${snippet}`
            })
            addSystemMessage(
              `Found ${data.total} results for "${searchQuery}" (showing ${data.hits.length}):\n\n${lines.join('\n\n')}`,
              true
            )
          }
        } else {
          addErrorMessage('Search failed. Please try again.')
        }
      } catch {
        addErrorMessage('An error occurred while searching.')
      }
      return
    }

    // Handle slash commands
    if (command.startsWith('/')) {
      const cmd = command.toLowerCase().split(' ')[0]

      // Check extra commands first
      const extra = config.extraCommands?.find(
        (ec) => ec.command.toLowerCase() === cmd
      )
      if (extra) {
        await extra.handler({ addSystemMessage, addErrorMessage, graphId })
        return
      }

      switch (cmd) {
        case '/help':
          addSystemMessage(getWelcomeMessage(), true)
          return
        case '/clear':
          setTerminalMessages([])
          addSystemMessage('Console cleared.', true)
          return
        case '/examples': {
          const examples = config.sampleQueries
            .map((q, idx) => `${idx + 1}. ${q.name}\n/query ${q.query}`)
            .join('\n\n')
          addSystemMessage(
            `${config.examplesLabel}\n\n${examples}\n\nUse: /query <cypher> to execute`,
            true
          )
          return
        }
        case '/mcp':
          await showMcpSetup()
          return
        default:
          addErrorMessage(
            `Unknown command: ${cmd}\n\nType /help for available commands.`
          )
          return
      }
    }

    // Default: treat as natural language query
    await executeOperatorQuery(command)
  }

  const cancelQuery = () => {
    streamingQuery.cancelQuery()
  }

  // ── Render ──────────────────────────────────────────────────────────

  const { header } = config

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className={`rounded-lg bg-gradient-to-br ${header.gradientFrom} ${header.gradientTo} p-3`}
          >
            <HiTerminal className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="font-heading text-3xl font-bold text-gray-900 dark:text-white">
              {header.title}
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {header.subtitle}
            </p>
          </div>
        </div>
        {(streamingQuery.isStreaming || operatorProgress.isRunning) && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-green-500"></span>
            {operatorProgress.isRunning && operatorProgress.message
              ? operatorProgress.message
              : 'Processing...'}
            {operatorProgress.percentage !== undefined &&
              ` (${operatorProgress.percentage}%)`}
          </div>
        )}
      </div>

      {/* Terminal Interface */}
      <Card
        theme={customTheme.card}
        className="overflow-hidden bg-gray-950 !p-0 [&>div]:!p-0"
      >
        <div
          className="flex flex-col bg-gray-950"
          style={{ height: 'calc(100vh - 280px)' }}
        >
          {/* Terminal Output - Scrollable */}
          <div
            ref={terminalScrollRef}
            className="flex-1 overflow-y-auto p-4 font-mono text-sm"
          >
            {terminalMessages.map((message) => (
              <div key={message.id} className="mb-4">
                <div className="mb-1 flex items-center gap-2 text-xs text-gray-700">
                  <span>{message.timestamp.toLocaleTimeString()}</span>
                  <span>-</span>
                  <span className="tracking-wider uppercase">
                    {message.type}
                  </span>
                </div>
                <div
                  className={`leading-relaxed break-words whitespace-pre-wrap ${
                    message.type === 'system'
                      ? 'text-cyan-400'
                      : message.type === 'user'
                        ? 'text-green-400'
                        : message.type === 'error'
                          ? 'text-red-400'
                          : 'text-gray-300'
                  }`}
                >
                  {message.type === 'user' && (
                    <span className="mr-2 text-green-500">$</span>
                  )}
                  {message.isAnimating ? (
                    <ProgressiveText
                      text={message.content}
                      onComplete={() => handleAnimationComplete(message.id)}
                      onUpdate={scrollToBottom}
                    />
                  ) : (
                    message.content
                  )}
                </div>

                {/* Generated Cypher with a one-click re-run */}
                {message.cypher && (
                  <div className="mt-3 overflow-hidden rounded border border-gray-800 bg-gray-900/40">
                    <div className="flex items-center justify-between border-b border-gray-800 px-3 py-1.5">
                      <span className="text-xs tracking-wider text-gray-500 uppercase">
                        Generated Cypher
                      </span>
                      <button
                        onClick={() =>
                          handleCommand(`/query ${message.cypher ?? ''}`)
                        }
                        className="rounded bg-cyan-600/90 px-2 py-0.5 text-xs font-medium text-white transition-colors hover:bg-cyan-600"
                      >
                        Run
                      </button>
                    </div>
                    <pre className="overflow-x-auto px-3 py-2 font-mono text-xs whitespace-pre-wrap text-cyan-300">
                      {message.cypher}
                    </pre>
                  </div>
                )}

                {/* Render data table if present */}
                {message.data && message.data.length > 0 && (
                  <div className="mt-3 overflow-hidden rounded border border-gray-800">
                    <div className="flex items-center justify-between border-b border-gray-800 bg-gray-900 px-4 py-2">
                      <span className="text-xs text-gray-500">
                        {message.data.length} row
                        {message.data.length === 1 ? '' : 's'}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => copyRowsJson(message.data)}
                          className="rounded border border-gray-700 px-2 py-0.5 text-xs text-gray-300 transition-colors hover:bg-gray-800"
                        >
                          Copy JSON
                        </button>
                        <button
                          onClick={() =>
                            downloadText(
                              'results.csv',
                              rowsToCsv(message.data),
                              'text/csv'
                            )
                          }
                          className="rounded border border-gray-700 px-2 py-0.5 text-xs text-gray-300 transition-colors hover:bg-gray-800"
                        >
                          Download CSV
                        </button>
                      </div>
                    </div>
                    <div className="max-h-96 overflow-auto">
                      <table className="w-full border-collapse text-xs">
                        <thead className="sticky top-0">
                          <tr className="border-b border-gray-800 bg-gray-900">
                            {Object.keys(message.data[0]).map((key) => (
                              <th
                                key={key}
                                className="px-4 py-2 text-left font-semibold whitespace-nowrap text-cyan-400"
                              >
                                {key}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {message.data
                            .slice(0, MAX_TABLE_ROWS)
                            .map((row: any, idx: number) => (
                              <tr
                                key={idx}
                                className="border-b border-gray-900 hover:bg-gray-900/50"
                              >
                                {Object.keys(message.data[0]).map(
                                  (key: string) => {
                                    const value = row[key]
                                    const numeric = isNumericValue(value)
                                    const isNull =
                                      value === null || value === undefined
                                    return (
                                      <td
                                        key={key}
                                        className={`px-4 py-2 ${
                                          numeric
                                            ? 'text-right text-gray-300 tabular-nums'
                                            : 'text-gray-400'
                                        } ${isNull ? 'text-gray-600' : ''}`}
                                      >
                                        {formatCell(value)}
                                      </td>
                                    )
                                  }
                                )}
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                    {message.data.length > MAX_TABLE_ROWS && (
                      <div className="border-t border-gray-800 bg-gray-900/50 px-4 py-2 text-xs text-gray-600">
                        Showing {MAX_TABLE_ROWS} of {message.data.length} rows —
                        download CSV for the full set
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            <div ref={terminalEndRef} />
          </div>

          {/* Command Input - Fixed at Bottom */}
          <div className="flex items-center gap-3 border-t border-gray-700 bg-gray-950 px-4 py-3">
            <span className="font-mono text-sm text-green-500">$</span>
            <input
              type="text"
              value={commandInput}
              onChange={(e) => setCommandInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCommand(commandInput)
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault()
                  if (commandHistory.length > 0) {
                    const newIndex =
                      historyIndex === -1
                        ? commandHistory.length - 1
                        : Math.max(0, historyIndex - 1)
                    setHistoryIndex(newIndex)
                    setCommandInput(commandHistory[newIndex])
                  }
                } else if (e.key === 'ArrowDown') {
                  e.preventDefault()
                  if (historyIndex !== -1) {
                    const newIndex = historyIndex + 1
                    if (newIndex >= commandHistory.length) {
                      setHistoryIndex(-1)
                      setCommandInput('')
                    } else {
                      setHistoryIndex(newIndex)
                      setCommandInput(commandHistory[newIndex])
                    }
                  }
                }
              }}
              placeholder="Type a question, /query <cypher>, or /help..."
              className="terminal-input flex-1 border-none bg-transparent font-mono text-sm text-gray-300 outline-none placeholder:text-gray-700"
              disabled={!graphId}
            />
            {streamingQuery.isStreaming && (
              <button
                onClick={cancelQuery}
                className="rounded bg-red-600/90 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-600"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
