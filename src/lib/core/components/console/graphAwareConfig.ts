'use client'

import type { GraphInfo } from '@robosystems/client'
import { useMemo } from 'react'

import { useIsRepository } from '../RepositoryGuard'
import type { ConsoleConfig, SampleQuery } from './types'

/**
 * Graph-aware console configuration.
 *
 * The console's natural-language agent (the "cypher operator") and its example
 * queries only make sense against the schema of the *selected* graph. A shared
 * SEC repository, a RoboLedger accounting graph, a RoboInvestor portfolio
 * graph, and a generic custom graph each expose completely different nodes —
 * so the welcome examples, sample queries, and MCP prompts must switch with the
 * graph. This module holds one example set per graph kind plus a builder that
 * merges the right set with an app's branding.
 */

export type GraphExampleKind = 'sec' | 'roboledger' | 'roboinvestor' | 'generic'

export interface GraphExampleSet {
  /** Header subtitle describing what this graph is. */
  subtitle: string
  /** Welcome-message description. May contain the token "your graph", which the
   *  builder swaps for the graph's display name when available. */
  description: string
  /** Natural-language prompts shown in the USAGE section. Must be answerable by
   *  the cypher operator against THIS graph's schema. */
  naturalLanguageExamples: string[]
  /** `/query <cypher>` one-liners shown in the USAGE section. */
  directQueryExamples: string[]
  /** Full sample queries listed by the `/examples` command. */
  sampleQueries: SampleQuery[]
  /** Questions suggested after MCP setup (answered by the full MCP toolset). */
  mcpExampleQuestions: string[]
}

// ── SEC shared repository (base + roboledger reporting; XBRL facts) ──────────
// Data: XBRL financial facts + filing narrative text for 10,000+ public
// companies. No prices/macro. Gotchas baked into the queries: anchor on a
// ticker FIRST, use Element.canonical_concept (not a single qname),
// has_dimensions:false for consolidated totals, duration_type for
// income-statement periods vs period_type:'instant' for the balance sheet.

const SEC_EXAMPLE_SET: GraphExampleSet = {
  subtitle: 'AI financial analyst for 10,000+ public companies',
  description:
    'Ask in plain English and an AI analyst does the work — pulling full financial statements, comparing companies side by side, computing ratios and multi-year trends, and searching filing narratives like risk factors and MD&A. Every answer comes back with the data and the Cypher behind it. The graph holds XBRL filings from over 10,000 public companies.',
  naturalLanguageExamples: [
    'Compare gross margin for NVIDIA, AMD, and Intel over the last three years',
    'Show Apple’s income statement for the last three fiscal years',
    'Break down Microsoft’s revenue by segment',
    'Calculate Tesla’s free cash flow and current ratio for the last two fiscal years',
    'What are the biggest risk factors in Apple’s latest 10-K?',
  ],
  directQueryExamples: [
    "MATCH (e:Entity {ticker: 'NVDA'}) RETURN e.name, e.cik, e.sic_description, e.fiscal_year_end",
    "MATCH (e:Entity) WHERE e.sic_description CONTAINS 'Semiconductor' RETURN e.ticker, e.name LIMIT 20",
    "MATCH (e:Entity {ticker: 'AAPL'})-[:ENTITY_HAS_REPORT]->(r:Report) RETURN r.form, r.fiscal_year_focus, r.filing_date ORDER BY r.filing_date DESC LIMIT 10",
  ],
  sampleQueries: [
    {
      name: 'Companies by sector',
      query: `MATCH (e:Entity)
WHERE e.sic_description IS NOT NULL
RETURN e.sic_description AS sector, count(e) AS company_count
ORDER BY company_count DESC
LIMIT 20`,
    },
    {
      name: 'Recent SEC filings',
      query: `MATCH (e:Entity)-[:ENTITY_HAS_REPORT]->(r:Report)
RETURN e.ticker, e.name, r.form, r.fiscal_year_focus, r.filing_date
ORDER BY r.filing_date DESC
LIMIT 25`,
    },
    {
      name: 'NVIDIA annual revenue',
      // canonical_concept normalizes across filers (us-gaap:Revenues vs
      // RevenueFromContractWithCustomer…); has_dimensions:false = consolidated total.
      query: `MATCH (e:Entity {ticker: 'NVDA'})<-[:FACT_HAS_ENTITY]-(f:Fact {has_dimensions: false})-[:FACT_HAS_ELEMENT]->(el:Element),
      (f)-[:FACT_HAS_PERIOD]->(p:Period {duration_type: 'annual'})
WHERE el.canonical_concept = 'revenue' AND f.numeric_value IS NOT NULL
RETURN e.ticker, p.end_date, f.numeric_value AS revenue
ORDER BY p.end_date DESC
LIMIT 10`,
    },
    {
      name: 'NVIDIA income statement',
      // Pull a whole statement via Structure.canonical_type. Anchor on the
      // Entity FIRST and reach Structure LAST, or the query scans every filing.
      query: `MATCH (e:Entity {ticker: 'NVDA'})<-[:FACT_HAS_ENTITY]-(f:Fact {has_dimensions: false})-[:FACT_HAS_ELEMENT]->(el:Element),
      (f)-[:FACT_HAS_PERIOD]->(p:Period {duration_type: 'annual'}),
      (fs:FactSet)-[:FACT_SET_CONTAINS_FACT]->(f),
      (s:Structure {canonical_type: 'income_statement'})-[:STRUCTURE_HAS_FACT_SET]->(fs)
WHERE f.numeric_value IS NOT NULL
RETURN DISTINCT el.qname, f.numeric_value AS value, p.end_date
ORDER BY p.end_date DESC
LIMIT 40`,
    },
    {
      name: 'Apple balance sheet snapshot',
      // Balance-sheet items are instantaneous — filter Period {period_type:'instant'}.
      query: `MATCH (e:Entity {ticker: 'AAPL'})<-[:FACT_HAS_ENTITY]-(f:Fact {has_dimensions: false})-[:FACT_HAS_ELEMENT]->(el:Element),
      (f)-[:FACT_HAS_PERIOD]->(p:Period {period_type: 'instant'})
WHERE el.canonical_concept IN ['total_assets', 'total_liabilities', 'stockholders_equity']
  AND f.numeric_value IS NOT NULL
RETURN el.canonical_concept AS line_item, f.numeric_value AS value, p.end_date
ORDER BY p.end_date DESC, line_item
LIMIT 15`,
    },
    {
      name: 'Compare net income across mega-cap tech',
      query: `MATCH (e:Entity)<-[:FACT_HAS_ENTITY]-(f:Fact {has_dimensions: false})-[:FACT_HAS_ELEMENT]->(el:Element),
      (f)-[:FACT_HAS_PERIOD]->(p:Period {duration_type: 'annual'})
WHERE e.ticker IN ['AAPL', 'MSFT', 'GOOGL', 'NVDA', 'META']
  AND el.canonical_concept = 'net_income'
  AND f.numeric_value IS NOT NULL
RETURN e.ticker, p.end_date, f.numeric_value AS net_income
ORDER BY p.end_date DESC, net_income DESC
LIMIT 25`,
    },
    {
      name: 'NVIDIA gross margin trend',
      // Pivot two concepts per period, then compute the ratio in Cypher.
      query: `MATCH (e:Entity {ticker: 'NVDA'})<-[:FACT_HAS_ENTITY]-(f:Fact {has_dimensions: false})-[:FACT_HAS_ELEMENT]->(el:Element),
      (f)-[:FACT_HAS_PERIOD]->(p:Period {duration_type: 'annual'})
WHERE el.canonical_concept IN ['revenue', 'gross_profit'] AND f.numeric_value IS NOT NULL
WITH p.end_date AS period,
     max(CASE WHEN el.canonical_concept = 'revenue' THEN f.numeric_value END) AS revenue,
     max(CASE WHEN el.canonical_concept = 'gross_profit' THEN f.numeric_value END) AS gross_profit
WHERE revenue IS NOT NULL AND gross_profit IS NOT NULL
RETURN period, gross_profit, revenue, gross_profit / revenue AS gross_margin
ORDER BY period DESC
LIMIT 10`,
    },
    {
      name: 'NVIDIA revenue by segment (dimensional)',
      // has_dimensions:true exposes the segment/geography breakdowns.
      query: `MATCH (e:Entity {ticker: 'NVDA'})<-[:FACT_HAS_ENTITY]-(f:Fact {has_dimensions: true})-[:FACT_HAS_ELEMENT]->(el:Element),
      (f)-[:FACT_HAS_DIMENSION]->(d:Dimension),
      (f)-[:FACT_HAS_PERIOD]->(p:Period {duration_type: 'annual'})
WHERE el.canonical_concept = 'revenue' AND f.numeric_value IS NOT NULL
RETURN d.member AS segment, f.numeric_value AS value, p.end_date
ORDER BY p.end_date DESC, value DESC
LIMIT 20`,
    },
  ],
  mcpExampleQuestions: [
    'Compare operating margin for NVIDIA, AMD, and Intel over five years',
    'Summarize the key risk factors in Apple’s latest 10-K',
    'Show Microsoft’s diluted EPS and free cash flow trend',
  ],
}

// ── RoboLedger entity graph (double-entry ledger + reporting) ────────────────
// Data: the general-ledger spine Transaction -> Entry -> LineItem (each
// LineItem posts to an Element/account), plus the XBRL reports generated from
// it. The one rule to remember: count/sum only LIVE rows via the materialized
// `is_live` boolean (Entry/LineItem/Transaction), or cancelled/replaced rows
// double-count.

const ROBOLEDGER_EXAMPLE_SET: GraphExampleSet = {
  subtitle: 'AI analyst for your accounting ledger',
  description:
    'Ask in plain English and an AI analyst queries your ledger — transactions, journal entries, the trial balance, and the financial statements built from them. Every answer comes back with the data and the Cypher behind it.',
  naturalLanguageExamples: [
    'Show me the trial balance',
    'What are my largest expenses by category?',
    'List the most recent journal entries',
    'How much did I spend last month?',
  ],
  directQueryExamples: [
    'MATCH (e:Entity)-[:ENTITY_HAS_TRANSACTION]->(t:Transaction) WHERE t.is_live RETURN t.date, t.number, t.description, t.amount ORDER BY t.date DESC LIMIT 15',
    'MATCH (en:Entry) WHERE en.is_live RETURN en.number, en.memo, en.posting_date, en.type ORDER BY en.posting_date DESC LIMIT 15',
    'MATCH (e:Entity) RETURN e.name, e.entity_type, e.industry',
  ],
  sampleQueries: [
    {
      name: 'Trial balance',
      // Sum only live line items; each posts to an Element (account) via
      // LINE_ITEM_RELATES_TO_ELEMENT.
      query: `MATCH (en:Entry)-[:ENTRY_HAS_LINE_ITEM]->(li:LineItem)-[:LINE_ITEM_RELATES_TO_ELEMENT]->(el:Element)
WHERE li.is_live
RETURN el.qname AS account, el.name,
       sum(li.debit_amount) AS total_debits,
       sum(li.credit_amount) AS total_credits
ORDER BY total_debits DESC
LIMIT 25`,
    },
    {
      name: 'Recent transactions',
      query: `MATCH (e:Entity)-[:ENTITY_HAS_TRANSACTION]->(t:Transaction)
WHERE t.is_live
RETURN t.date, t.number, t.description, t.type, t.amount
ORDER BY t.date DESC
LIMIT 25`,
    },
    {
      name: 'Recent journal entries',
      query: `MATCH (t:Transaction)-[:TRANSACTION_HAS_ENTRY]->(en:Entry)
WHERE en.is_live
RETURN t.number AS txn, t.description, en.number AS entry, en.memo, en.posting_date, en.type
ORDER BY en.posting_date DESC
LIMIT 25`,
    },
    {
      name: 'Expenses by category',
      query: `MATCH (e:Entity)-[:ENTITY_HAS_TRANSACTION]->(t:Transaction)
WHERE t.is_live AND t.category IS NOT NULL
RETURN t.category, count(t) AS transactions, sum(t.amount) AS total
ORDER BY total DESC
LIMIT 20`,
    },
    {
      name: 'Entry lines by account',
      query: `MATCH (t:Transaction)-[:TRANSACTION_HAS_ENTRY]->(en:Entry)-[:ENTRY_HAS_LINE_ITEM]->(li:LineItem)-[:LINE_ITEM_RELATES_TO_ELEMENT]->(el:Element)
WHERE li.is_live
RETURN el.name AS account, count(li) AS line_items,
       sum(li.debit_amount) AS debits, sum(li.credit_amount) AS credits
ORDER BY line_items DESC
LIMIT 15`,
    },
    {
      name: 'Line items with dimensional breakdowns',
      query: `MATCH (li:LineItem {has_dimensions: true})-[:LINE_ITEM_HAS_DIMENSION]->(d:Dimension)
WHERE li.is_live
RETURN d.axis, d.member, count(li) AS line_item_count
ORDER BY line_item_count DESC
LIMIT 15`,
    },
    {
      name: 'Reports generated',
      query: `MATCH (e:Entity)-[:ENTITY_HAS_REPORT]->(r:Report)
RETURN e.name, r.form, r.fiscal_year_focus, r.filing_date
ORDER BY r.filing_date DESC
LIMIT 20`,
    },
  ],
  mcpExampleQuestions: [
    'Show me the trial balance for this entity',
    'What are my largest expenses this quarter?',
    'Summarize the most recent journal entries',
  ],
}

// ── RoboInvestor entity graph (portfolios / positions / securities) ──────────
// Data: Entity -> Portfolio -> Position -> Security, and Entity -> Security
// (issuance). Position carries cost_basis and current_value, so gains and
// allocation are computed in Cypher. Trade/Benchmark/MarketData exist in the
// schema but aren't populated yet — keep examples off them.

const ROBOINVESTOR_EXAMPLE_SET: GraphExampleSet = {
  subtitle: 'AI analyst for your investment portfolios',
  description:
    'Ask in plain English and an AI analyst queries your portfolios, positions, and securities — holdings, cost basis vs. current value, allocation, and unrealized gains. Every answer comes back with the data and the Cypher behind it.',
  naturalLanguageExamples: [
    'What is the current value of my portfolio?',
    'Show my largest positions by market value',
    'Which holdings have the biggest unrealized gains?',
    'Break down my holdings by security type',
  ],
  directQueryExamples: [
    'MATCH (p:Portfolio) RETURN p.name, p.strategy, p.base_currency',
    'MATCH (p:Portfolio)-[:PORTFOLIO_HAS_POSITION]->(pos:Position) RETURN p.name, count(pos) AS positions ORDER BY positions DESC',
    'MATCH (s:Security) RETURN s.ticker, s.name, s.security_type LIMIT 20',
  ],
  sampleQueries: [
    {
      name: 'Portfolio value',
      query: `MATCH (p:Portfolio)-[:PORTFOLIO_HAS_POSITION]->(pos:Position)
RETURN p.name,
       count(pos) AS positions,
       sum(pos.cost_basis) AS total_cost,
       sum(pos.current_value) AS total_value
ORDER BY total_value DESC`,
    },
    {
      name: 'Holdings by current value',
      query: `MATCH (p:Portfolio)-[:PORTFOLIO_HAS_POSITION]->(pos:Position)-[:POSITION_IN_SECURITY]->(s:Security)
RETURN p.name, s.ticker, s.name, pos.quantity, pos.cost_basis, pos.current_value
ORDER BY pos.current_value DESC
LIMIT 25`,
    },
    {
      name: 'Unrealized gains',
      query: `MATCH (p:Portfolio)-[:PORTFOLIO_HAS_POSITION]->(pos:Position)-[:POSITION_IN_SECURITY]->(s:Security)
WHERE pos.cost_basis IS NOT NULL AND pos.current_value IS NOT NULL
RETURN s.ticker, s.name, pos.cost_basis, pos.current_value,
       pos.current_value - pos.cost_basis AS unrealized_gain
ORDER BY unrealized_gain DESC
LIMIT 20`,
    },
    {
      name: 'Allocation by security type',
      query: `MATCH (pos:Position)-[:POSITION_IN_SECURITY]->(s:Security)
RETURN s.security_type,
       count(pos) AS positions,
       sum(pos.current_value) AS total_value
ORDER BY total_value DESC`,
    },
    {
      name: 'Securities issued by entity',
      query: `MATCH (e:Entity)-[:ENTITY_ISSUES_SECURITY]->(s:Security)
RETURN e.name, s.ticker, s.name, s.security_type
ORDER BY s.ticker
LIMIT 25`,
    },
  ],
  mcpExampleQuestions: [
    'What is the current value of my portfolio and its total cost basis?',
    'Show my largest positions by market value',
    'Which holdings have the biggest unrealized gains?',
  ],
}

// ── Generic custom graph (no known schema extensions) ────────────────────────
// No SEC/ledger/portfolio assumptions — the operator gets only the live schema
// and read-only Cypher, so the examples are structure-discovery oriented.

const GENERIC_EXAMPLE_SET: GraphExampleSet = {
  subtitle: 'AI analyst for your graph database',
  description:
    'Ask in plain English and an AI analyst explores your graph — discovering the node types, relationships, and patterns in your data, and returning the results with the Cypher behind every answer.',
  naturalLanguageExamples: [
    'What types of nodes are in the graph?',
    'How are the nodes connected?',
    'Show me a sample of the data',
    'Which nodes have the most connections?',
  ],
  directQueryExamples: [
    'MATCH (n) RETURN labels(n), count(n) ORDER BY count(n) DESC',
    'MATCH ()-[r]->() RETURN type(r), count(r) ORDER BY count(r) DESC',
    'MATCH (n) RETURN n LIMIT 10',
  ],
  sampleQueries: [
    {
      name: 'Node types',
      query: `MATCH (n)
RETURN labels(n) AS label, count(n) AS count
ORDER BY count DESC`,
    },
    {
      name: 'Relationship types',
      query: `MATCH ()-[r]->()
RETURN type(r) AS relationship, count(r) AS count
ORDER BY count DESC`,
    },
    {
      name: 'Sample nodes',
      query: `MATCH (n)
RETURN n
LIMIT 25`,
    },
    {
      name: 'Node connections',
      query: `MATCH (a)-[r]->(b)
RETURN labels(a) AS from_type, type(r) AS relationship, labels(b) AS to_type, count(*) AS count
ORDER BY count DESC
LIMIT 15`,
    },
  ],
  mcpExampleQuestions: [
    'What data is in my graph?',
    'Show me the most connected nodes',
    'Summarize the graph structure',
  ],
}

export const EXAMPLE_SETS: Record<GraphExampleKind, GraphExampleSet> = {
  sec: SEC_EXAMPLE_SET,
  roboledger: ROBOLEDGER_EXAMPLE_SET,
  roboinvestor: ROBOINVESTOR_EXAMPLE_SET,
  generic: GENERIC_EXAMPLE_SET,
}

/**
 * Classify the selected graph so the console can pick the right example set.
 *
 * @param preferredKind Tiebreak used only when a graph carries more than one
 *   entity extension (e.g. both roboledger and roboinvestor). Pass the app's
 *   own lens (a RoboLedger app passes 'roboledger') so a dual-extension graph
 *   shows the examples that fit the app the user is in.
 */
export function getGraphExampleKind(
  graph: GraphInfo | undefined,
  preferredKind?: GraphExampleKind
): GraphExampleKind {
  if (!graph) return preferredKind ?? 'generic'
  if (graph.isRepository && graph.repositoryType === 'sec') return 'sec'

  const extensions = graph.schemaExtensions ?? []
  const hasInvestor = extensions.includes('roboinvestor')
  const hasLedger = extensions.includes('roboledger')

  if (hasInvestor && hasLedger) {
    return preferredKind === 'roboledger' || preferredKind === 'roboinvestor'
      ? preferredKind
      : 'roboinvestor'
  }
  if (hasInvestor) return 'roboinvestor'
  if (hasLedger) return 'roboledger'
  return 'generic'
}

/** App-specific branding merged with the graph-derived example set. */
export interface ConsoleBranding {
  /** Page heading, e.g. "Console" or "RoboInvestor Console". */
  title: string
  /** Console name in the welcome banner, e.g. "RoboSystems Console". */
  consoleName: string
  gradientFrom: string
  gradientTo: string
  /** Final welcome line, e.g. "How can I help you today?". */
  closingMessage: string
  mcp: {
    serverName: string
    packageName: string
    contextIdFallback: string
  }
  /** Defaults to "Example Cypher Queries:". */
  examplesLabel?: string
  /** Defaults to "No graph selected. Please select a graph first.". */
  noSelectionError?: string
  /** Tiebreak for graphs carrying multiple entity extensions — see
   *  {@link getGraphExampleKind}. */
  preferredKind?: GraphExampleKind
}

/** Merge an app's branding with the example set for the given graph. */
export function buildGraphAwareConsoleConfig(
  graph: GraphInfo | undefined,
  branding: ConsoleBranding
): ConsoleConfig {
  const kind = getGraphExampleKind(graph, branding.preferredKind)
  const set = EXAMPLE_SETS[kind]
  const isRepository = graph?.isRepository ?? false
  const graphName = graph?.graphName

  // Personalize the description with the graph's name where the set opts in.
  const description =
    graphName && set.description.includes('your graph')
      ? set.description.replace('your graph', `"${graphName}"`)
      : set.description

  return {
    header: {
      title: branding.title,
      subtitle: set.subtitle,
      gradientFrom: branding.gradientFrom,
      gradientTo: branding.gradientTo,
    },
    welcome: {
      consoleName: branding.consoleName,
      description,
      contextLabel: isRepository ? 'Repository' : 'Graph',
      naturalLanguageExamples: set.naturalLanguageExamples,
      directQueryExamples: set.directQueryExamples,
      closingMessage: branding.closingMessage,
    },
    mcp: {
      serverName: branding.mcp.serverName,
      packageName: branding.mcp.packageName,
      exampleQuestions: set.mcpExampleQuestions,
      contextIdFallback: branding.mcp.contextIdFallback,
    },
    sampleQueries: set.sampleQueries,
    examplesLabel: branding.examplesLabel ?? 'Example Cypher Queries:',
    noSelectionError:
      branding.noSelectionError ??
      'No graph selected. Please select a graph first.',
  }
}

/**
 * React hook: build a console config that tracks the currently selected graph,
 * swapping example sets when the user changes graphs.
 */
export function useGraphAwareConsoleConfig(
  branding: ConsoleBranding
): ConsoleConfig {
  const { currentGraph } = useIsRepository()

  return useMemo(
    () => buildGraphAwareConsoleConfig(currentGraph, branding),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      currentGraph?.graphId,
      currentGraph?.isRepository,
      currentGraph?.repositoryType,
      currentGraph?.schemaExtensions,
      currentGraph?.graphName,
      branding,
    ]
  )
}
