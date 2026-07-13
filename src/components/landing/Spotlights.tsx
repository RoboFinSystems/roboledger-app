import type { ReactNode } from 'react'
import FloatingElementsVariant from './FloatingElementsVariant'
import ProductShot from './ProductShot'

interface Spotlight {
  id: string
  label: string
  title: string
  description: string
  bullets: string[]
  caption: string
  /** Real screenshot path — swap in when captured; falls back to `preview`. */
  screenshot?: string
  preview: ReactNode
}

const spotlights: Spotlight[] = [
  {
    id: 'inbox',
    label: 'Event-driven ledger',
    title: 'An inbox for your books',
    description:
      'Every transaction lands as a typed business event — captured, classified, then committed. Claude proposes the entry; you stay in control.',
    bullets: [
      'AI pre-classifies invoices, bills, payments, and receipts',
      'Preview exactly what would post — matched handler, planned journal entries, validation errors — before it hits the GL',
      'Approve or reject in one click, or let trusted sources commit on autopilot',
    ],
    caption: 'Ledger › Inbox',
    preview: <InboxPreview />,
  },
  {
    id: 'close',
    label: 'Period close',
    title: 'Close the period with guard rails',
    description:
      'A guided, sequential close backed by a fiscal calendar and a rule engine — so you never lock an unbalanced or out-of-order period.',
    bullets: [
      'Fiscal-calendar bootstrap with human-readable blockers (period incomplete, sync stale, out of sequence)',
      'Schedules post depreciation & prepaid entries to draft; balanced-draft gating before you lock',
      'Optional write-back to QuickBooks on close, and reopen-with-audit-reason',
    ],
    caption: 'Ledger › Closing Book',
    preview: <ClosePreview />,
  },
  {
    id: 'reporting',
    label: 'Reporting & XBRL',
    title: 'Live statements, filing-ready output',
    description:
      'Render Balance Sheet, Income Statement, Cash Flow & Equity straight from the ledger — no close required — then generate validated report packages.',
    bullets: [
      'Multi-period and comparative reports with a Draft → Under Review → Filed lifecycle',
      'Export XBRL 2.1 and JSON-LD bundles; verification view checks US-GAAP concept relations',
      'Distribute snapshots to stakeholders with publish lists',
    ],
    caption: 'Ledger › Statements',
    preview: <StatementsPreview />,
  },
  {
    id: 'console',
    label: 'Natural language',
    title: 'Ask Claude about your books',
    description:
      'Query your ledger in plain English in the AI Console, or connect Claude Desktop over MCP to help drive your month-end close from your own agent.',
    bullets: [
      'Natural language → Cypher, with the generated query shown and results one copy away',
      'Grounded in your actual ledger — transactions, trial balance, statements',
      'Install @robosystems/mcp to run RoboLedger tools from Claude Desktop',
    ],
    caption: 'Console',
    preview: <ConsolePreview />,
  },
]

export default function Spotlights() {
  return (
    <section id="features" className="relative bg-black py-16 sm:py-24">
      <FloatingElementsVariant variant="ai-reporting" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <div className="bg-primary-500/20 text-primary-400 mb-4 inline-block rounded-full px-4 py-1 text-sm font-semibold">
            Built for the close
          </div>
          <h2 className="font-heading mb-6 text-3xl font-bold text-white sm:text-4xl md:text-5xl">
            AI on both sides of the ledger
          </h2>
          <p className="mx-auto max-w-3xl text-base text-gray-300 sm:text-lg md:text-xl">
            Four capabilities that make RoboLedger different from a spreadsheet
            and a bookkeeping app alike.
          </p>
        </div>

        <div className="space-y-16 lg:space-y-24">
          {spotlights.map((s, idx) => (
            <div
              key={s.id}
              className={`grid items-center gap-8 lg:grid-cols-2 lg:gap-14 ${
                idx % 2 === 1 ? 'lg:[&>figure]:order-first' : ''
              }`}
            >
              <div>
                <div className="bg-secondary-500/15 text-secondary-300 mb-4 inline-block rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase">
                  {s.label}
                </div>
                <h3 className="font-heading mb-4 text-2xl font-bold text-white sm:text-3xl">
                  {s.title}
                </h3>
                <p className="mb-6 text-base leading-relaxed text-gray-300">
                  {s.description}
                </p>
                <ul className="space-y-3">
                  {s.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-3">
                      <svg
                        className="text-primary-400 mt-0.5 h-5 w-5 shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className="text-sm text-gray-300">{b}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <ProductShot
                src={s.screenshot}
                alt={`RoboLedger — ${s.title}`}
                caption={s.caption}
              >
                {s.preview}
              </ProductShot>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---- in-frame previews (placeholders until real screenshots land) ---- */

function PreviewShell({ children }: { children: ReactNode }) {
  return (
    <div className="h-full w-full bg-zinc-950 p-4 text-left sm:p-5">
      {children}
    </div>
  )
}

function InboxPreview() {
  return (
    <PreviewShell>
      <div className="mb-3 text-xs font-semibold text-gray-400">
        Preview — what would post
      </div>
      <div className="rounded-lg border border-gray-800 bg-zinc-900/60 p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium text-white">
            Bill received · Cloudflare, Inc.
          </span>
          <span className="rounded bg-green-500/15 px-2 py-0.5 text-[10px] text-green-300">
            balanced
          </span>
        </div>
        <div className="space-y-1.5 font-mono text-[11px]">
          <div className="flex justify-between text-gray-300">
            <span>Software Subscriptions (exp)</span>
            <span>Dr 2,400.00</span>
          </div>
          <div className="flex justify-between text-gray-300">
            <span>Accounts Payable</span>
            <span>Cr 2,400.00</span>
          </div>
        </div>
        <div className="mt-2 flex justify-between border-t border-gray-800 pt-2 text-[11px] font-semibold text-gray-400">
          <span>Totals</span>
          <span>2,400.00 / 2,400.00</span>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <span className="flex-1 rounded-md bg-green-500/15 py-1.5 text-center text-[11px] font-medium text-green-300">
          Approve
        </span>
        <span className="flex-1 rounded-md border border-gray-700 py-1.5 text-center text-[11px] font-medium text-gray-400">
          Reject
        </span>
      </div>
    </PreviewShell>
  )
}

function ClosePreview() {
  return (
    <PreviewShell>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold text-white">
          Period Close · May 2026
        </span>
        <span className="bg-primary-500/20 text-primary-300 rounded-full px-2 py-0.5 text-[10px]">
          next to close
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          ['Closed thru', 'Apr 2026'],
          ['Pending', '1 period'],
          ['Blockers', '0'],
        ].map(([k, v]) => (
          <div
            key={k}
            className="rounded-lg border border-gray-800 bg-zinc-900/60 p-2"
          >
            <div className="text-[10px] text-gray-500">{k}</div>
            <div className="text-xs font-semibold text-white">{v}</div>
          </div>
        ))}
      </div>
      <div className="mt-3 space-y-1.5">
        {['Depreciation — fixed assets', 'Prepaid insurance amortization'].map(
          (s) => (
            <div
              key={s}
              className="flex items-center justify-between rounded-md border border-gray-800 bg-zinc-900/60 px-2.5 py-1.5"
            >
              <span className="text-[11px] text-gray-300">{s}</span>
              <span className="rounded bg-green-500/15 px-1.5 py-0.5 text-[10px] text-green-300">
                draft · balanced
              </span>
            </div>
          )
        )}
      </div>
      <div className="from-primary-500 to-secondary-500 mt-3 rounded-md bg-linear-to-r py-1.5 text-center text-[11px] font-semibold text-white">
        Close period →
      </div>
    </PreviewShell>
  )
}

function StatementsPreview() {
  const rows: [string, string, boolean][] = [
    ['Revenue', '312,480', false],
    ['Cost of revenue', '(118,900)', false],
    ['Gross profit', '193,580', true],
    ['Operating expenses', '(141,220)', false],
    ['Operating income', '52,360', true],
  ]
  return (
    <PreviewShell>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold text-white">
          Income Statement · YTD
        </span>
        <span className="rounded border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-300">
          live · not filed
        </span>
      </div>
      <div className="rounded-lg border border-gray-800 bg-zinc-900/60 p-3">
        {rows.map(([label, val, total]) => (
          <div
            key={label}
            className={`flex justify-between py-1 text-[11px] ${
              total
                ? 'border-t border-gray-800 font-semibold text-white'
                : 'text-gray-300'
            }`}
          >
            <span>{label}</span>
            <span className="font-mono">{val}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-2 text-[10px]">
        <span className="rounded border border-gray-700 px-2 py-1 text-gray-400">
          XBRL 2.1
        </span>
        <span className="rounded border border-gray-700 px-2 py-1 text-gray-400">
          JSON-LD
        </span>
        <span className="text-primary-300 border-primary-500/30 rounded border px-2 py-1">
          Publish list →
        </span>
      </div>
    </PreviewShell>
  )
}

function ConsolePreview() {
  return (
    <PreviewShell>
      <div className="space-y-2">
        <div className="bg-primary-600/30 ml-auto w-fit max-w-[85%] rounded-lg rounded-br-sm px-3 py-2 text-[11px] text-white">
          Which accounts had the most activity this quarter?
        </div>
        <div className="rounded-lg border border-gray-800 bg-zinc-900/60 p-2.5">
          <div className="text-secondary-300 mb-1 text-[10px] font-semibold">
            Generated Cypher
          </div>
          <pre className="overflow-x-auto font-mono text-[10px] leading-relaxed text-gray-400">
            {`MATCH (li:LineItem)-[:RELATES_TO]->(e:Element)
WHERE li.date >= $qStart
RETURN e.name, sum(li.amount) AS total
ORDER BY total DESC LIMIT 5`}
          </pre>
        </div>
        <div className="rounded-lg bg-black/40 px-3 py-2 text-[11px] text-gray-300">
          Top 5: Consulting Revenue, Payroll, AWS, Rent, Software — grounded in
          your ledger.
        </div>
      </div>
      <div className="mt-3 rounded-md border border-gray-800 bg-zinc-900/60 px-3 py-1.5 text-[11px] text-gray-500">
        Type a question, /query &lt;cypher&gt;, or /help…
      </div>
    </PreviewShell>
  )
}
