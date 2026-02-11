'use client'

import {
  ConsoleContent,
  type ConsoleCommandContext,
  type ConsoleConfig,
} from '@/lib/core'

const ROBOSYSTEMS_CONSOLE_CONFIG: ConsoleConfig = {
  header: {
    title: 'Console',
    subtitle: 'Execute Cypher queries and analyze data',
    gradientFrom: 'from-blue-500',
    gradientTo: 'to-purple-600',
  },
  welcome: {
    consoleName: 'RoboSystems Console',
    description: 'Claude powered interactive graph database console',
    contextLabel: 'Graph',
    naturalLanguageExamples: [
      'What entity is in the graph?',
      'How many facts are in the latest report?',
      'What are the latest transactions for this company?',
    ],
    directQueryExamples: [
      'MATCH (n) RETURN count(n) as node_count',
      'MATCH (e:Entity) RETURN e.name, e.identifier LIMIT 10',
      'MATCH (r:Report) RETURN r.form, r.filing_date LIMIT 10',
    ],
    closingMessage: 'How can I help you today?',
  },
  mcp: {
    serverName: 'robosystems',
    packageName: '@robosystems/mcp',
    exampleQuestions: [
      'Query my graph for all nodes',
      'Get the schema of my graph',
      'Find relationships between entities',
    ],
    contextIdFallback: 'your_graph_id',
  },
  sampleQueries: [
    {
      name: 'What entity is in the graph?',
      query: 'MATCH (e:Entity) RETURN e.name, e.identifier LIMIT 10',
    },
    {
      name: 'How many reports are in the graph?',
      query: 'MATCH (r:Report) RETURN count(r) as report_count',
    },
    {
      name: 'What are the latest facts for this company?',
      query: `MATCH (f:Fact)--(e:Element)
OPTIONAL MATCH (f)-[:FACT_HAS_PERIOD]->(p:Period)
RETURN e.name, f.value, p.start_date, p.end_date
ORDER BY p.end_date DESC
LIMIT 10`,
    },
    {
      name: 'Count all nodes',
      query: 'MATCH (n) RETURN count(n) as node_count',
    },
    {
      name: 'Find top 10 connected nodes',
      query: `MATCH (n)
WITH n, size((n)--()) as degree
ORDER BY degree DESC
LIMIT 10
RETURN n.name as name, degree`,
    },
    {
      name: 'Show all tables',
      query: 'CALL show_tables() RETURN *',
    },
    {
      name: 'Sample nodes',
      query: 'MATCH (n) RETURN n LIMIT 10',
    },
  ],
  examplesLabel: 'Example Cypher Queries:',
  noSelectionError: 'No graph selected. Please select a graph first.',
  extraCommands: [
    {
      command: '/api-keys',
      handler: (ctx: ConsoleCommandContext) => {
        ctx.addSystemMessage(
          `API key management coming soon.\n\nNavigate to Settings to create and manage API keys.`,
          true
        )
      },
    },
  ],
}

export function QueryInterfaceContent() {
  return <ConsoleContent config={ROBOSYSTEMS_CONSOLE_CONFIG} />
}
