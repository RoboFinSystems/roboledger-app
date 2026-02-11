'use client'

import { ConsoleContent, type ConsoleConfig } from '@/lib/core'

const ROBOLEDGER_CONSOLE_CONFIG: ConsoleConfig = {
  header: {
    title: 'RoboLedger Console',
    subtitle: 'Interactive financial data analysis',
    gradientFrom: 'from-purple-500',
    gradientTo: 'to-indigo-600',
  },
  welcome: {
    consoleName: 'RoboLedger Console',
    description: 'Claude powered interactive financial data console',
    contextLabel: 'Graph',
    naturalLanguageExamples: [
      'Show me the trial balance',
      'What are the recent transactions?',
      'Summarize the chart of accounts',
      'What reports are available?',
    ],
    directQueryExamples: [
      'MATCH (t:Transaction) RETURN t.date, t.description LIMIT 10',
      'MATCH (a:Account) RETURN a.code, a.name ORDER BY a.code',
    ],
    closingMessage: 'How can I help you analyze your financial data today?',
  },
  mcp: {
    serverName: 'roboledger',
    packageName: '@roboledger/mcp',
    exampleQuestions: [
      'Show me the trial balance for this entity',
      'What are the largest transactions this month?',
      'Summarize the chart of accounts structure',
    ],
    contextIdFallback: 'your_graph_id',
  },
  sampleQueries: [
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
  ],
  examplesLabel: 'Example Financial Queries:',
  noSelectionError: 'No graph selected. Please select a graph first.',
}

export default function ConsolePageContent() {
  return <ConsoleContent config={ROBOLEDGER_CONSOLE_CONFIG} />
}
