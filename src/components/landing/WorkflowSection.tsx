import FloatingElementsVariant from './FloatingElementsVariant'

const steps = [
  {
    number: '01',
    title: 'Connect Your Data',
    description:
      'Sync QuickBooks, link bank accounts via Plaid, and connect SEC EDGAR for XBRL taxonomy data. One-click OAuth flows get you up and running in minutes.',
    tags: ['QuickBooks', 'Plaid', 'SEC EDGAR'],
    color: 'violet',
  },
  {
    number: '02',
    title: 'Map to US-GAAP',
    description:
      'AI auto-maps your chart of accounts to US-GAAP taxonomy elements with confidence scores. Review coverage, override mappings inline, and track progress toward full compliance.',
    tags: ['AI Auto-Map', 'GAAP Taxonomy', 'Confidence Scores'],
    color: 'purple',
  },
  {
    number: '03',
    title: 'Review Your Ledger',
    description:
      'Explore transactions with rich filters, drill into journal entry line items, and validate your trial balance. Full debit/credit detail at every level.',
    tags: ['Transactions', 'Journal Entries', 'Trial Balance'],
    color: 'fuchsia',
  },
  {
    number: '04',
    title: 'Close the Books',
    description:
      'Step through a guided period close: manage your fiscal calendar, generate Balance Sheet, Income Statement, and Cash Flow statements, and verify XBRL compliance before locking.',
    tags: ['Fiscal Calendar', 'Financial Statements', 'XBRL Compliance'],
    color: 'pink',
  },
  {
    number: '05',
    title: 'Generate Reports',
    description:
      'Build reports with the visual Report Creator using pre-built templates or custom configurations. Export to Excel or formatted statements, then publish to stakeholder lists.',
    tags: ['Report Builder', 'Excel Export', 'Publish Lists'],
    color: 'green',
  },
  {
    number: '06',
    title: 'Query with AI',
    description:
      'Open the AI Console and ask Claude anything about your financials. "Show me the trial balance", "What accounts have the most activity this quarter?" — instant answers from your actual data.',
    tags: ['Claude AI', 'Natural Language', 'MCP Integration'],
    color: 'orange',
  },
]

const colorClasses: Record<
  string,
  { border: string; bg: string; number: string; tag: string; dot: string }
> = {
  violet: {
    border: 'border-violet-500/30',
    bg: 'from-violet-500/10',
    number: 'text-violet-400',
    tag: 'bg-violet-950/50 text-violet-300',
    dot: 'bg-violet-500',
  },
  purple: {
    border: 'border-purple-500/30',
    bg: 'from-purple-500/10',
    number: 'text-purple-400',
    tag: 'bg-purple-950/50 text-purple-300',
    dot: 'bg-purple-500',
  },
  fuchsia: {
    border: 'border-fuchsia-500/30',
    bg: 'from-fuchsia-500/10',
    number: 'text-fuchsia-400',
    tag: 'bg-fuchsia-950/50 text-fuchsia-300',
    dot: 'bg-fuchsia-500',
  },
  pink: {
    border: 'border-pink-500/30',
    bg: 'from-pink-500/10',
    number: 'text-pink-400',
    tag: 'bg-pink-950/50 text-pink-300',
    dot: 'bg-pink-500',
  },
  green: {
    border: 'border-green-500/30',
    bg: 'from-green-500/10',
    number: 'text-green-400',
    tag: 'bg-green-950/50 text-green-300',
    dot: 'bg-green-500',
  },
  orange: {
    border: 'border-orange-500/30',
    bg: 'from-orange-500/10',
    number: 'text-orange-400',
    tag: 'bg-orange-950/50 text-orange-300',
    dot: 'bg-orange-500',
  },
}

export default function WorkflowSection() {
  return (
    <section
      id="workflow"
      className="relative bg-linear-to-b from-zinc-900 to-black py-16 sm:py-24"
    >
      <FloatingElementsVariant variant="features" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <div className="mb-4 inline-block rounded-full bg-violet-500/20 px-4 py-1 text-sm font-semibold text-violet-400">
            End-to-End Workflow
          </div>
          <h2 className="font-heading mb-6 text-3xl font-bold text-white sm:text-4xl md:text-5xl">
            From Raw Data to Published Reports
          </h2>
          <p className="mx-auto max-w-3xl text-base text-gray-300 sm:text-lg md:text-xl">
            RoboLedger covers the complete accounting close cycle — connect your
            sources, map to GAAP standards, close the books, and publish
            statements, all in one place.
          </p>
        </div>

        <div className="relative">
          {/* Vertical connector line (desktop) */}
          <div className="absolute top-0 bottom-0 left-1/2 hidden w-px -translate-x-1/2 bg-linear-to-b from-violet-500/30 via-purple-500/20 to-transparent lg:block"></div>

          <div className="space-y-6">
            {steps.map((step, idx) => {
              const c = colorClasses[step.color]
              const isLeft = idx % 2 === 0
              return (
                <div
                  key={idx}
                  className={`relative flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-0 ${isLeft ? 'lg:flex-row' : 'lg:flex-row-reverse'}`}
                >
                  {/* Card */}
                  <div
                    className={`w-full rounded-2xl border ${c.border} bg-linear-to-br ${c.bg} hover:border-opacity-60 to-zinc-900 p-6 transition-all duration-300 lg:w-[45%]`}
                  >
                    <div
                      className={`mb-1 text-4xl font-extrabold ${c.number} opacity-40`}
                    >
                      {step.number}
                    </div>
                    <h3 className="mb-2 text-xl font-bold text-white">
                      {step.title}
                    </h3>
                    <p className="mb-4 text-sm leading-relaxed text-gray-400">
                      {step.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {step.tags.map((tag) => (
                        <span
                          key={tag}
                          className={`rounded-full px-3 py-1 text-xs font-medium ${c.tag}`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Center dot (desktop) */}
                  <div className="hidden lg:flex lg:w-[10%] lg:justify-center">
                    <div
                      className={`h-4 w-4 rounded-full ring-4 ring-black ${c.dot}`}
                    ></div>
                  </div>

                  {/* Spacer for alternating layout */}
                  <div className="hidden lg:block lg:w-[45%]"></div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
