'use client'

import {
  customTheme,
  useGraphContext,
  useServiceOfferings,
  useToast,
} from '@/lib/core'
import { createUserApiKey } from '@robosystems/client/sdk'
import { Button, Card, Spinner } from 'flowbite-react'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import {
  HiCheckCircle,
  HiCreditCard,
  HiDatabase,
  HiKey,
  HiLightningBolt,
  HiTerminal,
} from 'react-icons/hi'

interface ApiKeysContentProps {
  repository: string
}

// Progressive text typing animation component
function ProgressiveText({
  text,
  onComplete,
  speed = 10,
}: {
  text: string
  onComplete?: () => void
  speed?: number
}) {
  const [displayedText, setDisplayedText] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(text.slice(0, currentIndex + 1))
        setCurrentIndex(currentIndex + 1)
      }, speed)
      return () => clearTimeout(timeout)
    } else if (onComplete) {
      onComplete()
    }
  }, [currentIndex, text, speed, onComplete])

  return <>{displayedText}</>
}

export function ApiKeysContent({ repository }: ApiKeysContentProps) {
  const router = useRouter()
  const { setCurrentGraph } = useGraphContext()
  const { offerings } = useServiceOfferings()
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [isCreatingKey, setIsCreatingKey] = useState(false)
  const [keyCreated, setKeyCreated] = useState(false)
  const [isTypingKey, setIsTypingKey] = useState(false)
  const { showSuccess, showError, showWarning, ToastContainer } = useToast()
  const codeExamplesRef = React.useRef<HTMLDivElement>(null)

  const repoOffering = offerings?.repositoryPlans?.[repository]

  const handleOpenConsole = async () => {
    await setCurrentGraph(repository)
    router.push('/console')
  }

  const handleOpenUsage = async () => {
    await setCurrentGraph(repository)
    router.push('/usage')
  }

  const generateApiKey = async () => {
    setIsCreatingKey(true)
    try {
      const response = await createUserApiKey({
        body: {
          name: `Repository Access - ${repository.toUpperCase()} - ${new Date().toLocaleDateString()}`,
        },
      })

      if (!response.data?.key) {
        throw new Error('Failed to create API key')
      }

      setApiKey(response.data.key)
      setKeyCreated(true)

      showSuccess('API key created successfully!')
      showWarning(
        'Keep this key secure! You can manage all your API keys in Settings.'
      )

      // Trigger typing animation and scroll to code examples
      setIsTypingKey(true)
      setTimeout(() => {
        codeExamplesRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
      }, 300)
    } catch (error: any) {
      console.error('Failed to create API key:', error)
      showError(`Failed to create API key: ${error.message || 'Unknown error'}`)
    } finally {
      setIsCreatingKey(false)
    }
  }

  const displayApiKey = apiKey || 'YOUR_API_KEY_HERE'

  // Component to render API key with typing animation
  const ApiKeyDisplay = ({ children }: { children: string }) => {
    if (!keyCreated || !isTypingKey) {
      return <>{children}</>
    }
    return (
      <ProgressiveText
        text={children}
        speed={8}
        onComplete={() => setIsTypingKey(false)}
      />
    )
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <ToastContainer />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 p-3">
            <HiDatabase className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="font-heading text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              {repoOffering?.name || repository.toUpperCase()} Repository
            </h1>
            <p className="mt-1 text-zinc-600 dark:text-zinc-400">
              {repoOffering?.description ||
                'Curated graph database ready to query'}
            </p>
          </div>
        </div>
      </div>

      {/* What's Included */}
      <Card theme={customTheme.card}>
        <div className="space-y-4">
          <h2 className="font-heading text-xl font-bold text-zinc-900 dark:text-zinc-100">
            What's Included
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400">
            Access a curated graph database with structured financial data ready
            for queries and analysis.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-start gap-2">
              <HiCheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
              <div>
                <p className="font-medium text-zinc-900 dark:text-zinc-100">
                  Query with Cypher
                </p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Use graph queries to explore relationships in the data
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <HiCheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
              <div>
                <p className="font-medium text-zinc-900 dark:text-zinc-100">
                  Regular Updates
                </p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Data refreshed automatically as new information becomes
                  available
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <HiCheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
              <div>
                <p className="font-medium text-zinc-900 dark:text-zinc-100">
                  AI Agent Integration
                </p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Use our in-house agent via Console or connect external AI
                  tools via MCP
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <HiCheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
              <div>
                <p className="font-medium text-zinc-900 dark:text-zinc-100">
                  Multiple Access Methods
                </p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Console, REST API, MCP tools, and client SDKs
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Quick Actions */}
      <Card theme={customTheme.card}>
        <div className="space-y-4">
          <h3 className="font-heading text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Quick Start
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Choose how you want to access and explore the data
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Button
              color="purple"
              onClick={handleOpenConsole}
              className="h-auto flex-col items-start gap-2 py-4"
            >
              <HiTerminal className="h-6 w-6" />
              <div className="text-left">
                <div className="font-semibold">Console</div>
                <div className="text-xs font-normal opacity-90">
                  Interactive query interface
                </div>
              </div>
            </Button>
            <Button
              color="gray"
              onClick={handleOpenUsage}
              className="h-auto flex-col items-start gap-2 py-4"
            >
              <HiLightningBolt className="h-6 w-6" />
              <div className="text-left">
                <div className="font-semibold">Credits & Usage</div>
                <div className="text-xs font-normal opacity-90">
                  Monitor your consumption
                </div>
              </div>
            </Button>
            <Button
              color="gray"
              onClick={() => router.push('/billing')}
              className="h-auto flex-col items-start gap-2 py-4"
            >
              <HiCreditCard className="h-6 w-6" />
              <div className="text-left">
                <div className="font-semibold">Billing</div>
                <div className="text-xs font-normal opacity-90">
                  Manage subscription
                </div>
              </div>
            </Button>
            <Button
              color="gray"
              onClick={() => {
                const element = document.getElementById('api-access')
                element?.scrollIntoView({ behavior: 'smooth' })
              }}
              className="h-auto flex-col items-start gap-2 py-4"
            >
              <HiKey className="h-6 w-6" />
              <div className="text-left">
                <div className="font-semibold">API Access</div>
                <div className="text-xs font-normal opacity-90">
                  Generate API keys
                </div>
              </div>
            </Button>
          </div>
        </div>
      </Card>

      {/* Access via Console */}
      <Card theme={customTheme.card} id="console-access">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-purple-100 p-2 dark:bg-purple-900/30">
              <HiTerminal className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-heading text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Access via Console
              </h3>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                The fastest way to explore and query the repository
              </p>
            </div>
          </div>

          <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800/50">
            <p className="mb-3 text-sm text-zinc-700 dark:text-zinc-300">
              The Console provides an interactive interface to:
            </p>
            <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
              <li className="flex items-start gap-2">
                <HiCheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                <span>Run Cypher queries against the graph database</span>
              </li>
              <li className="flex items-start gap-2">
                <HiCheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                <span>
                  Chat with our AI agent using natural language queries
                </span>
              </li>
              <li className="flex items-start gap-2">
                <HiCheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                <span>
                  Browse the schema and explore available data structures
                </span>
              </li>
              <li className="flex items-start gap-2">
                <HiCheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                <span>
                  View real-time query results and performance metrics
                </span>
              </li>
              <li className="flex items-start gap-2">
                <HiCheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                <span>Save and share queries with your team</span>
              </li>
            </ul>
          </div>

          <Button color="purple" onClick={handleOpenConsole} size="lg">
            <HiTerminal className="mr-2 h-5 w-5" />
            Open Console
          </Button>
        </div>
      </Card>

      {/* Programmatic Access & Code Examples */}
      <Card theme={customTheme.card} id="api-access" ref={codeExamplesRef}>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/30">
              <HiKey className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-heading text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Programmatic Access
              </h3>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Generate an API key and use the code examples below to access
                the repository.{' '}
                <a
                  href={`${process.env.NEXT_PUBLIC_ROBOSYSTEMS_API_URL || 'https://api.robosystems.ai'}/docs`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  View Full API Documentation →
                </a>
              </p>
            </div>
          </div>

          <Button
            color="blue"
            onClick={generateApiKey}
            disabled={isCreatingKey}
          >
            {isCreatingKey ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Creating API Key...
              </>
            ) : (
              <>
                <HiKey className="mr-2 h-4 w-4" />
                Generate API Key
              </>
            )}
          </Button>

          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
            <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Use your API key to:
            </p>
            <ul className="space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-zinc-400"></span>
                Access via MCP tools in Claude Desktop, Cursor, or other AI apps
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-zinc-400"></span>
                Query programmatically with Python, TypeScript, or cURL
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-zinc-400"></span>
                Build automated workflows and integrations
              </li>
            </ul>
          </div>

          {/* MCP Client Configuration */}
          <div className="space-y-3 border-t border-zinc-200 pt-4 dark:border-zinc-700">
            <h4 className="font-heading font-medium text-zinc-900 dark:text-zinc-100">
              MCP Configuration
            </h4>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Add this to your MCP settings file for Claude Desktop, Cursor, or
              other AI tools:
            </p>
            <pre className="overflow-x-auto rounded-lg bg-zinc-100 p-4 text-sm text-zinc-900 dark:bg-zinc-900 dark:text-zinc-300">
              <code>
                {`{
  "mcpServers": {
    "robosystems": {
      "command": "npx",
      "args": ["-y", "@robosystems/mcp"],
      "env": {
        "ROBOSYSTEMS_API_KEY": "`}
                <ApiKeyDisplay>{displayApiKey}</ApiKeyDisplay>
                {`",
        "ROBOSYSTEMS_API_URL": "${process.env.NEXT_PUBLIC_ROBOSYSTEMS_API_URL || 'https://api.robosystems.ai'}",
        "ROBOSYSTEMS_GRAPH_ID": "${repository}"
      }
    }
  }
}`}
              </code>
            </pre>
          </div>

          {/* API SDK Examples */}
          <div className="space-y-3 border-t border-zinc-200 pt-4 dark:border-zinc-700">
            <h4 className="font-heading font-medium text-zinc-900 dark:text-zinc-100">
              SDK Examples
            </h4>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Query the {repository.toUpperCase()} repository using our client
              libraries:
            </p>

            {/* Tabs for different languages */}
            <div className="space-y-3">
              {/* cURL Example */}
              <details className="group">
                <summary className="cursor-pointer rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700">
                  cURL
                </summary>
                <pre className="mt-2 overflow-x-auto rounded-lg bg-zinc-100 p-4 text-sm text-zinc-900 dark:bg-zinc-900 dark:text-zinc-300">
                  <code>
                    {`curl -X POST "${process.env.NEXT_PUBLIC_ROBOSYSTEMS_API_URL || 'https://api.robosystems.ai'}/v1/graphs/${repository}/query" \\
  -H "X-API-Key: `}
                    <ApiKeyDisplay>{displayApiKey}</ApiKeyDisplay>
                    {`" \\
  -H "Content-Type: application/json" \\
  -d '{
    "query": "MATCH (n) RETURN n LIMIT 10",
    "parameters": {},
    "timeout": 30
  }'`}
                  </code>
                </pre>
              </details>

              {/* Python Example */}
              <details className="group">
                <summary className="cursor-pointer rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700">
                  Python Client
                </summary>
                <pre className="mt-2 overflow-x-auto rounded-lg bg-zinc-100 p-4 text-sm text-zinc-900 dark:bg-zinc-900 dark:text-zinc-300">
                  <code>
                    {`import asyncio
from robosystems_client import RoboSystemsClient
from robosystems_client.api.query.execute_cypher_query import asyncio as execute_cypher_query
from robosystems_client.models.cypher_query_request import CypherQueryRequest

async def query_repository():
    # Initialize the client with API key authentication
    client = RoboSystemsClient(
        base_url="${process.env.NEXT_PUBLIC_ROBOSYSTEMS_API_URL || 'https://api.robosystems.ai'}",
        token="`}
                    <ApiKeyDisplay>{displayApiKey}</ApiKeyDisplay>
                    {`",
        auth_header_name="X-API-Key",
        prefix=""  # No prefix needed for API key
    )

    # Create the query request
    query_request = CypherQueryRequest(
        query="MATCH (n) RETURN n LIMIT 10",
        parameters={}
    )

    # Execute the query
    response = await execute_cypher_query(
        graph_id="${repository}",
        client=client,
        body=query_request
    )

    # Process results
    if response and response.data:
        for record in response.data:
            print(record)

    return response

# Run the async function
asyncio.run(query_repository())`}
                  </code>
                </pre>
              </details>

              {/* TypeScript Example */}
              <details className="group">
                <summary className="cursor-pointer rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700">
                  Typescript Client
                </summary>
                <pre className="mt-2 overflow-x-auto rounded-lg bg-zinc-100 p-4 text-sm text-zinc-900 dark:bg-zinc-900 dark:text-zinc-300">
                  <code>
                    {`import * as SDK from '@robosystems/core';

// Configure the client with API key authentication
SDK.client.setConfig({
  baseUrl: '${process.env.NEXT_PUBLIC_ROBOSYSTEMS_API_URL || 'https://api.robosystems.ai'}',
  credentials: 'omit', // Don't send cookies when using API key
  headers: {
    'X-API-Key': '`}
                    <ApiKeyDisplay>{displayApiKey}</ApiKeyDisplay>
                    {`'
  }
});

// Execute the query
async function queryRepository() {
  try {
    const response = await SDK.executeCypherQuery({
      path: {
        graph_id: '${repository}'
      },
      body: {
        query: 'MATCH (n) RETURN n LIMIT 10',
        parameters: {}
      }
    });

    // Process results
    if (response.data && response.data.success) {
      response.data.data.forEach((record: any) => {
        console.log(record);
      });
    }

    return response;
  } catch (error) {
    console.error('Query failed:', error);
    throw error;
  }
}

// Call the function
await queryRepository();`}
                  </code>
                </pre>
              </details>
            </div>
          </div>

          <div className="rounded-lg bg-zinc-100 p-4 dark:bg-zinc-800">
            <p className="text-sm text-zinc-700 dark:text-zinc-300">
              <strong>Note:</strong> Your API key works across all subscribed
              repositories. Queries consume credits based on your subscription
              plan.{' '}
              <button
                onClick={handleOpenUsage}
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                View usage →
              </button>
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
