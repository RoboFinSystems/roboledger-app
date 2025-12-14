'use client'

import { customTheme, useGraphContext } from '@/lib/core'
import { useStreamingQuery } from '@/lib/core/hooks'
import { Card } from 'flowbite-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { HiTerminal } from 'react-icons/hi'

interface TerminalMessage {
  id: string
  type: 'system' | 'user' | 'result' | 'error'
  content: string
  timestamp: Date
  data?: any
  isAnimating?: boolean
}

const SAMPLE_QUERIES = [
  {
    name: 'List all transactions',
    query: `MATCH (t:Transaction)-[:HAS_LINE_ITEM]->(li:LineItem)
RETURN t.date, t.description, li.account_name, li.debit, li.credit
ORDER BY t.date DESC LIMIT 20`,
  },
  {
    name: 'Trial balance summary',
    query: `MATCH (a:Account)
OPTIONAL MATCH (a)<-[:LINE_ITEM_FOR]-(li:LineItem)
RETURN a.code, a.name, a.classification,
       sum(li.debit) as total_debits,
       sum(li.credit) as total_credits
ORDER BY a.code`,
  },
  {
    name: 'Chart of accounts',
    query:
      'MATCH (a:Account) RETURN a.code, a.name, a.type, a.classification ORDER BY a.code',
  },
  {
    name: 'Recent reports',
    query: `MATCH (r:Report)
RETURN r.name, r.form, r.filing_date, r.period_end_date
ORDER BY r.filing_date DESC LIMIT 10`,
  },
  {
    name: 'Entity information',
    query: 'MATCH (e:Entity) RETURN e.name, e.identifier, e.entity_type',
  },
  {
    name: 'Facts with periods',
    query: `MATCH (f:Fact)--(e:Element)
OPTIONAL MATCH (f)-[:FACT_HAS_PERIOD]->(p:Period)
RETURN e.name, f.value, p.start_date, p.end_date
ORDER BY p.end_date DESC LIMIT 20`,
  },
]

// Progressive text component for terminal output
function ProgressiveText({
  text,
  onComplete,
  speed = 1,
  onUpdate,
}: {
  text: string
  onComplete?: () => void
  speed?: number
  onUpdate?: () => void
}) {
  const [displayedText, setDisplayedText] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(text.slice(0, currentIndex + 1))
        setCurrentIndex(currentIndex + 1)
        onUpdate?.()
      }, speed)
      return () => clearTimeout(timeout)
    } else if (onComplete) {
      onComplete()
    }
  }, [currentIndex, text, speed, onComplete, onUpdate])

  return <span>{displayedText}</span>
}

export default function ConsolePageContent() {
  const { state: graphState } = useGraphContext()
  const graphId = graphState.currentGraphId
  const streamingQuery = useStreamingQuery()

  // Terminal state
  const [terminalMessages, setTerminalMessages] = useState<TerminalMessage[]>(
    []
  )
  const [commandInput, setCommandInput] = useState('')
  const terminalEndRef = useRef<HTMLDivElement>(null)
  const terminalScrollRef = useRef<HTMLDivElement>(null)
  const [currentQueryStartTime, setCurrentQueryStartTime] = useState<
    number | null
  >(null)

  // Agent progress state
  const [apiVersion, setApiVersion] = useState<string | null>(null)
  const [agentProgress, setAgentProgress] = useState<{
    isRunning: boolean
    message: string
    percentage?: number
  }>({ isRunning: false, message: '' })

  // Track if we've initialized and the previous graph ID
  const hasInitialized = useRef(false)
  const previousGraphId = useRef<string | null>(null)
  const agentProgressMessageId = useRef<string | null>(null)

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
          `Graph context changed: ${previousGraphId.current} → ${graphId}\n` +
          `═══════════════════════════════════════════════════════════════\n\n` +
          `Console has been reset for the new graph context.\n` +
          `All queries will now execute against: ${graphId}\n\n` +
          `Type /help to see available commands.`,
        true
      )

      setTimeout(() => {
        addSystemMessage(getWelcomeMessage(), true)
      }, 500)
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

  // Monitor streaming query status and add terminal messages
  useEffect(() => {
    if (!currentQueryStartTime) return

    if (streamingQuery.status === 'completed') {
      const duration = Date.now() - currentQueryStartTime
      const resultText = `Query completed in ${duration}ms\nRows returned: ${streamingQuery.results.length}\nCredits used: ${streamingQuery.creditsUsed?.toFixed(1) || '0'}${streamingQuery.cached ? ' (Cached - Free)' : ''}`

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

  // Monitor agent progress and update terminal
  useEffect(() => {
    if (agentProgress.isRunning && agentProgress.message) {
      if (agentProgressMessageId.current) {
        setTerminalMessages((prev) =>
          prev.map((msg) =>
            msg.id === agentProgressMessageId.current
              ? {
                  ...msg,
                  content: `${agentProgress.message}${agentProgress.percentage !== undefined ? ` (${agentProgress.percentage}%)` : ''}`,
                }
              : msg
          )
        )
      } else {
        const id = generateMessageId()
        agentProgressMessageId.current = id
        setTerminalMessages((prev) => [
          ...prev,
          {
            id,
            type: 'system',
            content: `${agentProgress.message}${agentProgress.percentage !== undefined ? ` (${agentProgress.percentage}%)` : ''}`,
            timestamp: new Date(),
          },
        ])
      }
    } else if (!agentProgress.isRunning && agentProgressMessageId.current) {
      agentProgressMessageId.current = null
    }
  }, [agentProgress])

  const getWelcomeMessage = (): string => {
    return (
      `RoboLedger Console v${apiVersion} - Graph: ${graphId || 'Not selected'}\n` +
      `═══════════════════════════════════════════════════════════════\n\n` +
      `Claude powered interactive financial data console\n\n` +
      `USAGE:\n` +
      `  Natural Language (default):\n` +
      `    "Show me the trial balance"\n` +
      `    "What are the recent transactions?"\n` +
      `    "Summarize the chart of accounts"\n` +
      `    "What reports are available?"\n\n` +
      `  Direct Cypher Queries:\n` +
      `    /query MATCH (t:Transaction) RETURN t.date, t.description LIMIT 10\n` +
      `    /query MATCH (a:Account) RETURN a.code, a.name ORDER BY a.code\n\n` +
      `COMMANDS:\n` +
      `  /query      - Execute a Cypher query\n` +
      `  /mcp        - Show MCP connection setup\n` +
      `  /help       - Show this help message\n` +
      `  /clear      - Clear console history\n` +
      `  /examples   - Show example queries\n\n` +
      `How can I help you analyze your financial data today?`
    )
  }

  const generateMessageId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  const addSystemMessage = (content: string, animate = false) => {
    const message: TerminalMessage = {
      id: generateMessageId(),
      type: 'system',
      content,
      timestamp: new Date(),
      isAnimating: animate,
    }
    setTerminalMessages((prev) => [...prev, message])
  }

  const addUserMessage = (content: string) => {
    const message: TerminalMessage = {
      id: generateMessageId(),
      type: 'user',
      content,
      timestamp: new Date(),
    }
    setTerminalMessages((prev) => [...prev, message])
  }

  const addResultMessage = (content: string, data?: any) => {
    const message: TerminalMessage = {
      id: generateMessageId(),
      type: 'system',
      content,
      timestamp: new Date(),
      data,
    }
    setTerminalMessages((prev) => [...prev, message])
  }

  const addErrorMessage = (content: string) => {
    const message: TerminalMessage = {
      id: generateMessageId(),
      type: 'error',
      content,
      timestamp: new Date(),
    }
    setTerminalMessages((prev) => [...prev, message])
  }

  const handleAnimationComplete = (messageId: string) => {
    setTerminalMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, isAnimating: false } : msg
      )
    )
  }

  const handleCommand = async (command: string) => {
    if (!command.trim()) return

    addUserMessage(command)
    setCommandInput('')

    // Handle /query command - extract and execute Cypher
    if (command.toLowerCase().startsWith('/query ')) {
      const cypherQuery = command.slice(7).trim()
      if (cypherQuery) {
        await executeCypherQuery(cypherQuery)
      } else {
        addErrorMessage('Usage: /query <cypher-query>')
      }
      return
    }

    // Handle other slash commands
    if (command.startsWith('/')) {
      const cmd = command.toLowerCase().split(' ')[0]

      switch (cmd) {
        case '/help':
          addSystemMessage(getWelcomeMessage(), true)
          return
        case '/clear':
          setTerminalMessages([])
          addSystemMessage('Console cleared.', true)
          return
        case '/examples': {
          const examples = SAMPLE_QUERIES.map(
            (q, idx) => `${idx + 1}. ${q.name}\n/query ${q.query}`
          ).join('\n\n')
          addSystemMessage(
            `Example Financial Queries:\n\n${examples}\n\nUse: /query <cypher> to execute`,
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

    // Default: treat as natural language query for agent
    await executeAgentQuery(command)
  }

  const executeCypherQuery = async (cypherQuery: string) => {
    if (!graphId) {
      addErrorMessage('No graph selected. Please select a graph first.')
      return
    }

    setCurrentQueryStartTime(Date.now())

    try {
      await streamingQuery.executeQuery(graphId, cypherQuery)
    } catch (err: any) {
      addErrorMessage(err.message || 'Failed to execute query')
      setCurrentQueryStartTime(null)
    }
  }

  const executeAgentQuery = async (userQuery: string) => {
    if (!graphId) {
      addErrorMessage('No graph selected. Please select a graph first.')
      return
    }

    const startTime = Date.now()

    try {
      const { extensions } = await import('@robosystems/client/extensions')

      const result = await extensions.agent.executeQuery(
        graphId,
        {
          message: userQuery,
          mode: 'quick',
        },
        {
          mode: 'auto',
          onProgress: (message: string, percentage?: number) => {
            setAgentProgress({
              isRunning: true,
              message,
              percentage,
            })
          },
        }
      )

      setAgentProgress({ isRunning: false, message: '' })

      const duration = Date.now() - startTime
      const metadata = result.metadata || {}

      const creditsUsed = metadata.credits_consumed as number | undefined
      const creditsRemaining = metadata.credits_remaining as number | undefined
      const resultCount = metadata.result_count as number | undefined

      let outputMessage = `${result.content}\n\n`

      outputMessage += `═══════════════════════════════════════════════════════════════\n`
      outputMessage += `Agent: ${result.agent_used}\n`
      outputMessage += `Mode: ${result.mode_used}\n`
      outputMessage += `Execution time: ${duration}ms\n`

      if (result.confidence_score !== undefined) {
        outputMessage += `Confidence: ${(result.confidence_score * 100).toFixed(1)}%\n`
      }

      if (creditsUsed !== undefined) {
        outputMessage += `Credits used: ${creditsUsed.toFixed(6)}\n`
      }
      if (creditsRemaining !== undefined) {
        outputMessage += `Credits remaining: ${creditsRemaining.toFixed(2)}\n`
      }
      if (resultCount !== undefined) {
        outputMessage += `Results: ${resultCount} rows\n`
      }

      addSystemMessage(outputMessage, true)
    } catch (error: any) {
      setAgentProgress({ isRunning: false, message: '' })

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
        addErrorMessage(`Agent error: ${errorMessage}`)
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

      addSystemMessage(
        `MCP Setup Instructions:\n` +
          `═══════════════════════════════════════════════════════════════\n\n` +
          `API Key Created Successfully!\n\n` +
          `Add this configuration to claude_desktop_config.json:\n\n` +
          `   {\n` +
          `     "mcpServers": {\n` +
          `       "roboledger": {\n` +
          `         "command": "npx",\n` +
          `         "args": ["-y", "@roboledger/mcp"],\n` +
          `         "env": {\n` +
          `           "ROBOSYSTEMS_API_URL": "${apiUrl}",\n` +
          `           "ROBOSYSTEMS_API_KEY": "${apiKey}",\n` +
          `           "ROBOSYSTEMS_GRAPH_ID": "${graphId || 'your_graph_id'}"\n` +
          `         }\n` +
          `       }\n` +
          `     }\n` +
          `   }\n\n` +
          `Restart Claude Desktop or Claude Code to apply.\n\n` +
          `Once connected, ask Claude questions like:\n` +
          `  - "Show me the trial balance for this entity"\n` +
          `  - "What are the largest transactions this month?"\n` +
          `  - "Summarize the chart of accounts structure"\n\n` +
          `Keep this API key secure! It has full access to your account.`,
        true
      )
    } catch (error: any) {
      addErrorMessage(
        `Failed to create API key: ${error.message || 'Unknown error'}\n\n` +
          `You can manually create an API key in Settings and use it with:\n` +
          `  ROBOSYSTEMS_API_URL: https://api.robosystems.ai\n` +
          `  ROBOSYSTEMS_GRAPH_ID: ${graphId || 'your_graph_id'}`
      )
    }
  }

  const cancelQuery = () => {
    streamingQuery.cancelQuery()
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 p-3">
            <HiTerminal className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="font-heading text-3xl font-bold text-gray-900 dark:text-white">
              RoboLedger Console
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Interactive financial data analysis
            </p>
          </div>
        </div>
        {(streamingQuery.isStreaming || agentProgress.isRunning) && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-green-500"></span>
            {agentProgress.isRunning && agentProgress.message
              ? agentProgress.message
              : 'Processing...'}
            {agentProgress.percentage !== undefined &&
              ` (${agentProgress.percentage}%)`}
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

                {/* Render data table if present */}
                {message.data && message.data.length > 0 && (
                  <div className="mt-4 overflow-x-auto rounded border border-gray-800">
                    <table className="w-full border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-gray-800 bg-gray-900">
                          {Object.keys(message.data[0]).map((key) => (
                            <th
                              key={key}
                              className="px-4 py-2 text-left font-semibold text-cyan-400"
                            >
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {message.data
                          .slice(0, 10)
                          .map((row: any, idx: number) => (
                            <tr
                              key={idx}
                              className="border-b border-gray-900 hover:bg-gray-900/50"
                            >
                              {Object.values(row).map((value: any, vidx) => (
                                <td
                                  key={vidx}
                                  className="px-4 py-2 text-gray-400"
                                >
                                  {typeof value === 'object'
                                    ? JSON.stringify(value)
                                    : String(value)}
                                </td>
                              ))}
                            </tr>
                          ))}
                      </tbody>
                    </table>
                    {message.data.length > 10 && (
                      <div className="border-t border-gray-800 bg-gray-900/50 px-4 py-2 text-xs text-gray-600">
                        ... and {message.data.length - 10} more rows
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
