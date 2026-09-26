import FloatingElementsVariant from './FloatingElementsVariant'
import LiveDemo from './LiveDemo'
import ProductShot from './ProductShot'

interface Spotlight {
  id: string
  label: string
  title: string
  description: string
  bullets: string[]
  caption: string
  /** Animated demo module under /public/demos. */
  demo: string
  /** What the demo shows, for screen readers. */
  demoLabel: string
}

const spotlights: Spotlight[] = [
  {
    id: 'inbox',
    label: 'Event-driven ledger',
    title: 'An inbox for your books',
    description:
      'Every transaction lands as a typed business event — captured, classified, then committed. AI proposes the entry; you stay in control.',
    bullets: [
      'AI pre-classifies invoices, bills, payments, and receipts',
      'Preview exactly what would post — matched handler, planned journal entries, validation errors — before it hits the GL',
      'Approve or reject in one click — or enable autopilot for trusted sources',
    ],
    caption: 'Ledger › Inbox',
    demo: 'inbox',
    demoLabel:
      'A customer payment arriving in the inbox, classified by AI, previewed as a balanced entry, and committed by a person.',
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
    demo: 'close',
    demoLabel:
      'Schedule entries drafting, every close check passing, and the period closing after a person approves.',
  },
  {
    id: 'reporting',
    label: 'Reporting & XBRL',
    title: 'Live statements & validated reports',
    description:
      'Render Balance Sheet and Income Statement straight from the ledger — no close required — with Cash Flow and Equity as your transactions are classified, then generate validated report packages.',
    bullets: [
      'Multi-period and comparative reports with a Draft → Under Review → Filed lifecycle',
      'Export Tavi and XBRL 2.1 reports; verification view checks US-GAAP concept relations',
      'Distribute snapshots to stakeholders with publish lists',
    ],
    caption: 'Ledger › Statements',
    demo: 'statements',
    demoLabel:
      'A balance sheet and income statement rendered live from the ledger, then a report package moving from draft to filed.',
  },
  {
    id: 'plan',
    label: 'Planning & forecast',
    title: 'Plan forward from the books you just closed',
    description:
      'Your closed months and your forecast in one monthly grid. The Plan surface reads statements in series across the actuals/forecast seam, with the scenario’s own assumptions sitting right beneath them.',
    bullets: [
      'Income Statement, Balance Sheet, and Cash Flow month by month — actuals and forward columns in the same row',
      'Switch scenarios in place; the assumption levers driving the forecast render in the same grid',
      'Trailing-window control, CSV export, and shareable scenario links',
    ],
    caption: 'Plan',
    demo: 'plan',
    demoLabel:
      'The plan grid rolling forward from actuals as one payment-terms assumption changes.',
  },
  {
    id: 'explorer',
    label: 'Block Explorer',
    title: 'Open up any number and see how it was built',
    description:
      'Every statement, schedule, metric, and disclosure is an Information Block. The Explorer renders any of them through the same set of view projections — so the rendered figure and the facts behind it are one toggle apart.',
    bullets: [
      'Six views per block: rendered, chart, facts, elements, validation, and business rules',
      'Compute a metric for a new period on the spot and watch its time series extend',
      'Deep-linkable state (?block= / ?view= / ?scenario=) and CSV export on every view',
    ],
    caption: 'Explorer',
    demo: 'explorer',
    demoLabel:
      'The Gross Margin block opened through its rendered, chart, facts and validation views.',
  },
  {
    id: 'console',
    label: 'Natural language',
    title: 'Ask about your books in plain English',
    description:
      'Query your ledger in the AI Console, or connect Claude, ChatGPT, or any MCP client to help drive your month-end close from the chat you already use.',
    bullets: [
      'Natural language → Cypher, with the generated query shown and results one copy away',
      'Grounded in your actual ledger — transactions, trial balance, statements',
      'Add one MCP address to your AI client and sign in to run RoboLedger tools — no install',
    ],
    caption: 'Console',
    demo: 'console',
    demoLabel:
      'The AI Console answering which customers owe the most, with the generated query and the result.',
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
            Six capabilities that make RoboLedger different from a spreadsheet
            and a bookkeeping app alike — from the first transaction through the
            close, the report, and the forecast that follows it.
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
              <div className="min-w-0">
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

              <ProductShot alt={`RoboLedger — ${s.title}`} caption={s.caption}>
                <LiveDemo
                  name={s.demo}
                  aspect={1200 / 750}
                  label={s.demoLabel}
                />
              </ProductShot>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
