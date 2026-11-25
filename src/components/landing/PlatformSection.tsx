import { MERCURY_DISCLOSURE } from '@/app/(app)/connections/components/MercuryDisclosure'
import { Dust, GraphGalaxies } from '@robosystems/core/graph-stage'
import { MERCURY_PARTNER_URL } from './constants'

// The section reads left to right as one flow: what comes in, what it becomes,
// what gets done to it, and where it is reached from. The second column is the
// ledger's own schema, drawn as the graph it is.

const SOURCES = [
  {
    name: 'QuickBooks',
    kind: 'Accounting',
    lines: ['Chart of accounts', 'Journal entries and transactions'],
  },
  {
    name: 'Bank feeds',
    kind: 'Plaid and Mercury',
    lines: ['Bank and card transactions', 'Balances to reconcile against'],
  },
  {
    name: 'Documents',
    kind: 'Uploads',
    lines: [
      'Statements, contracts and policies',
      'Searchable beside the books',
    ],
  },
  {
    name: 'Your other systems',
    kind: 'Integrations',
    lines: ['Metrics and KPIs, a fact per period', 'Through the public API'],
  },
  {
    name: 'Native entries',
    kind: 'Written in RoboLedger',
    lines: [
      'Business events and journal entries',
      'Schedules that post each month',
    ],
  },
]

// Tools carry the names they have in the app and in an MCP client.
const JOBS = [
  {
    job: 'Capture',
    does: 'Bank lines arrive with a suggested account; nothing posts until one is chosen.',
    tools: [
      'Link Bank Account',
      'Create Event Block',
      'Learn Classification Defaults',
    ],
  },
  {
    job: 'Taxonomy',
    does: 'Your chart and its mapping to standard reporting concepts, kept as one taxonomy block.',
    tools: ['Create Taxonomy Block', 'Auto-Map Elements via AI'],
  },
  {
    job: 'Measure',
    does: 'Metrics and forecasts as information blocks, checked by their rules.',
    tools: ['Create Information Block', 'Assert Metrics', 'Compute Metrics'],
  },
  {
    job: 'Close',
    does: 'Schedules post, accounts reconcile, and the rules run before the period locks.',
    tools: [
      'Refresh Reconciliations',
      'Sign Off Reconciliation',
      'Close Fiscal Period',
    ],
  },
  {
    job: 'Consolidate',
    does: 'Consolidating entries are drafted for a person to review and post.',
    tools: ['Propose Consolidation Entries', 'Consolidation Worksheet'],
  },
  {
    job: 'Report',
    does: 'Statements read live from the books, then freeze into a report you can share.',
    tools: ['Live Financial Statement', 'Create Report', 'Share Report'],
  },
]

const ACCESS: {
  name: string
  line: string
  formats?: string[]
  link?: { label: string; href: string }
}[] = [
  {
    name: 'RoboLedger app',
    line: 'The books, the close and the reports, in a browser',
  },
  {
    name: 'Your AI',
    line: 'The same tools from Claude, ChatGPT or any MCP client',
  },
  {
    name: 'AI Operators',
    line: 'The AI behind the AI Console and the background work, Claude through AWS Bedrock, paid in credits. MCP and the API use none',
  },
  {
    name: 'API',
    line: 'GraphQL and REST, with Python and TypeScript clients',
  },
  {
    name: 'Report files',
    line: 'Each report downloads as a file you keep and can open without us',
    formats: ['Holon (RDF)', 'DataBook', 'Tavi JSON', 'XBRL 2.1'],
    link: {
      label: 'Open one in the xbrlkit viewer',
      href: 'https://xbrlkit.com',
    },
  },
  {
    name: 'Graph backup',
    line: 'The whole graph, backed up nightly, downloads as a LadybugDB file to open in G.V() or query from Python',
    formats: ['LadybugDB (.lbdb)'],
  },
]

type Tone = 1 | 2 | 3
const tone = (n: Tone, alpha = 1) => `rgb(var(--graph-${n}) / ${alpha})`

// The ledger's graph as the schema has it (robosystems/schemas/extensions/roboledger.py and
// base.py: Event, Agent, Entry, LineItem, Element, Fact, Report), named for a reader; the
// account and the reporting concept are both elements, joined by the mapping. On a 420 x
// 520 canvas.
const NODES: {
  id: string
  label: string
  sub: string
  x: number
  y: number
  tone: Tone
}[] = [
  { id: 'event', label: 'Event', sub: 'what happened', x: 95, y: 84, tone: 1 },
  {
    id: 'agent',
    label: 'Agent',
    sub: 'the counterparty',
    x: 305,
    y: 84,
    tone: 1,
  },
  { id: 'entry', label: 'Entry', sub: 'one posting', x: 95, y: 190, tone: 2 },
  {
    id: 'line',
    label: 'Line item',
    sub: 'one debit or credit',
    x: 305,
    y: 190,
    tone: 2,
  },
  {
    id: 'account',
    label: 'Account',
    sub: 'your chart',
    x: 305,
    y: 296,
    tone: 2,
  },
  {
    id: 'concept',
    label: 'Reporting concept',
    sub: 'the standard term',
    x: 95,
    y: 296,
    tone: 3,
  },
  {
    id: 'fact',
    label: 'Fact',
    sub: 'one value, one period',
    x: 95,
    y: 402,
    tone: 3,
  },
  {
    id: 'report',
    label: 'Report',
    sub: 'frozen and shared',
    x: 305,
    y: 402,
    tone: 3,
  },
]

const EDGES: {
  from: string
  to: string
  label: string
  dx?: number
  dy?: number
}[] = [
  { from: 'event', to: 'agent', label: 'involves', dy: -8 },
  { from: 'event', to: 'entry', label: 'posts as', dx: 34, dy: 4 },
  { from: 'entry', to: 'line', label: 'has', dy: -8 },
  { from: 'line', to: 'account', label: 'hits', dx: -22, dy: 4 },
  { from: 'account', to: 'concept', label: 'maps to', dy: -8 },
  { from: 'fact', to: 'concept', label: 'measures', dx: 38, dy: 4 },
  { from: 'report', to: 'fact', label: 'holds', dy: -8 },
]

const NODE_W = 150
const NODE_H = 54
// The frame around one company's books, and how far each company behind it peeks out.
const FRAME = { x: 6, y: 34, w: 388, h: 420 }
const PEEK = 9

function SchemaGraph() {
  const at = (id: string) => NODES.find((n) => n.id === id)!
  return (
    <svg
      viewBox="0 0 420 520"
      role="img"
      aria-label="The ledger's graph, one per company, with the node types it really has: an event involves an agent, the counterparty, and posts as an entry; the entry has line items, each a debit or credit that hits an account; the account maps to a reporting concept; a fact measures that concept for one period; a report holds the facts. A group holds one of these per company and consolidates them."
      className="mx-auto h-auto w-full max-w-md"
    >
      <defs>
        <marker
          id="platform-arrow"
          viewBox="0 0 8 8"
          refX="7"
          refY="4"
          markerWidth="7"
          markerHeight="7"
          orient="auto"
        >
          <path d="M0 0 L8 4 L0 8 z" fill="rgb(156 163 175 / 0.8)" />
        </marker>
      </defs>
      {/* A group: the same books once per company, one behind another. */}
      {[2, 1].map((i) => (
        <rect
          key={i}
          x={FRAME.x + i * PEEK}
          y={FRAME.y - i * PEEK}
          width={FRAME.w}
          height={FRAME.h}
          rx="16"
          fill="rgb(24 24 27)"
          stroke={`rgb(113 113 122 / ${0.5 - i * 0.15})`}
          strokeWidth="1.25"
        />
      ))}
      <rect
        x={FRAME.x}
        y={FRAME.y}
        width={FRAME.w}
        height={FRAME.h}
        rx="16"
        fill="rgb(17 17 20)"
        stroke="rgb(113 113 122 / 0.7)"
        strokeWidth="1.25"
      />
      <text
        x={FRAME.x + FRAME.w / 2}
        y={FRAME.y + FRAME.h + 28}
        textAnchor="middle"
        className="fill-gray-300 text-[13px]"
      >
        One per company. A group consolidates them.
      </text>
      {EDGES.map((edge) => {
        const a = at(edge.from)
        const b = at(edge.to)
        // Leave each node at its edge, not its centre.
        const dx = b.x - a.x
        const dy = b.y - a.y
        const horizontal = Math.abs(dx) / NODE_W > Math.abs(dy) / NODE_H
        const ox = horizontal ? (Math.sign(dx) * NODE_W) / 2 : 0
        const oy = horizontal ? 0 : (Math.sign(dy) * NODE_H) / 2
        const x1 = a.x + ox
        const y1 = a.y + oy
        const x2 = b.x - ox
        const y2 = b.y - oy
        return (
          <g key={`${edge.from}-${edge.to}`}>
            <line
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="rgb(156 163 175 / 0.5)"
              strokeWidth="1.5"
              markerEnd="url(#platform-arrow)"
            />
            <text
              x={(x1 + x2) / 2 + (edge.dx ?? 0)}
              y={(y1 + y2) / 2 + (edge.dy ?? 0)}
              textAnchor="middle"
              className="fill-gray-300 text-[12px]"
            >
              {edge.label}
            </text>
          </g>
        )
      })}
      {NODES.map((node) => (
        <g key={node.id}>
          <rect
            x={node.x - NODE_W / 2}
            y={node.y - NODE_H / 2}
            width={NODE_W}
            height={NODE_H}
            rx="11"
            fill={tone(node.tone, 0.14)}
            stroke={tone(node.tone, 0.6)}
            strokeWidth="1.5"
          />
          <text
            x={node.x}
            y={node.y - 3}
            textAnchor="middle"
            className="fill-white text-[15px] font-semibold"
          >
            {node.label}
          </text>
          <text
            x={node.x}
            y={node.y + 15}
            textAnchor="middle"
            className="fill-gray-400 text-[11.5px]"
          >
            {node.sub}
          </text>
        </g>
      ))}
    </svg>
  )
}

function Step({
  n,
  title,
  children,
}: {
  n: number
  title: string
  children: React.ReactNode
}) {
  return (
    <div>
      <h3 className="mb-5 flex items-center gap-2 text-sm font-semibold tracking-wider text-gray-400 uppercase">
        <span className="flex h-6 w-6 items-center justify-center rounded-full border border-gray-700 text-xs text-gray-300">
          {n}
        </span>
        {title}
      </h3>
      {children}
    </div>
  )
}

export default function PlatformSection() {
  return (
    <section id="platform" className="relative bg-black py-16 sm:py-24">
      <Dust />
      <GraphGalaxies count={3} />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2 className="font-heading mb-6 text-3xl font-bold text-white sm:text-4xl md:text-5xl">
            Built on RoboSystems
          </h2>
          <p className="mx-auto max-w-3xl text-base text-gray-300 sm:text-lg md:text-xl">
            Your books in XBRL&apos;s standard terms, with every number traced
            to its entries, on the same reporting concepts as 8,000+ public
            companies&apos; SEC filings, so your numbers and theirs compare line
            for line. Your AI queries them in plain English, and the rule engine
            checks the books before a period closes, for one company or a whole
            group.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-800 bg-gradient-to-b from-zinc-900 to-black p-6 sm:p-8">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.5fr_1.35fr_1fr] lg:gap-8">
            <Step n={1} title="Comes in">
              <div className="space-y-3">
                {SOURCES.map((source) => (
                  <div
                    key={source.name}
                    className="rounded-lg border border-gray-800 bg-zinc-900/60 p-3"
                  >
                    <div className="font-semibold text-white">
                      {source.name}
                    </div>
                    <div className="text-primary-300 mb-1 text-xs">
                      {source.kind}
                    </div>
                    <ul className="space-y-0.5 text-xs text-gray-400">
                      {source.lines.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                    {source.name === 'Bank feeds' && (
                      <div className="mt-2 flex items-center gap-2 text-xs">
                        <a
                          href={MERCURY_PARTNER_URL}
                          target="_blank"
                          rel="sponsored noopener noreferrer"
                          className="text-primary-300 hover:text-primary-200"
                        >
                          Need a Mercury account? →
                        </a>
                        {/* Mercury's required not-a-bank disclosure, verbatim (the app's
                            MercuryDisclosure). Shown on hover, focus and tap. */}
                        <span className="group/disclosure relative inline-flex">
                          <button
                            type="button"
                            aria-describedby="mercury-disclosure"
                            className="flex h-4 w-4 items-center justify-center rounded-full border border-gray-600 text-[10px] text-gray-400 hover:border-gray-400 hover:text-white focus:border-gray-400 focus:text-white focus:outline-none"
                          >
                            <span aria-hidden="true">i</span>
                            <span className="sr-only">Mercury disclosure</span>
                          </button>
                          <span
                            id="mercury-disclosure"
                            role="tooltip"
                            className="pointer-events-none invisible absolute bottom-full left-1/2 z-20 mb-2 w-60 -translate-x-1/2 rounded-lg border border-gray-700 bg-zinc-900 p-3 text-xs leading-relaxed text-gray-300 opacity-0 shadow-xl transition-opacity duration-150 group-focus-within/disclosure:visible group-focus-within/disclosure:opacity-100 group-hover/disclosure:visible group-hover/disclosure:opacity-100"
                          >
                            {MERCURY_DISCLOSURE}
                          </span>
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Step>

            <Step n={2} title="Becomes one ledger">
              <SchemaGraph />
              <p className="mt-4 text-center text-xs text-gray-400">
                Open any figure on a statement and walk these links back to the
                entry and the event behind it.
              </p>
            </Step>

            <Step n={3} title="Gets done">
              <div className="space-y-3">
                {JOBS.map((item) => (
                  <div
                    key={item.job}
                    className="rounded-lg border border-gray-800 bg-zinc-900/60 p-3"
                  >
                    <div className="font-semibold text-white">{item.job}</div>
                    <p className="mb-2 text-xs text-gray-400">{item.does}</p>
                    <div className="flex flex-wrap gap-1">
                      {item.tools.map((tool) => (
                        <span
                          key={tool}
                          className="bg-primary-900/40 text-primary-200 rounded px-2 py-0.5 text-xs"
                        >
                          {tool}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Step>

            <Step n={4} title="Reached from">
              <div className="space-y-3">
                {ACCESS.map((way) => (
                  <div
                    key={way.name}
                    className="rounded-lg border border-gray-800 bg-zinc-900/60 p-3"
                  >
                    <div className="font-semibold text-white">{way.name}</div>
                    <p className="text-xs text-gray-400">{way.line}</p>
                    {way.formats && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {way.formats.map((format) => (
                          <span
                            key={format}
                            className="bg-primary-900/40 text-primary-200 rounded px-2 py-0.5 text-xs"
                          >
                            {format}
                          </span>
                        ))}
                      </div>
                    )}
                    {way.link && (
                      <a
                        href={way.link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-300 hover:text-primary-200 mt-2 inline-block text-xs underline underline-offset-2"
                      >
                        {way.link.label}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </Step>
          </div>
        </div>
      </div>
    </section>
  )
}
