import FloatingElementsVariant from './FloatingElementsVariant'

const steps = [
  {
    number: '01',
    title: 'Connect your sources',
    description:
      'Link QuickBooks with one-click OAuth and connect SEC EDGAR by CIK. Customers, vendors, and employees resolve into counterparties automatically.',
    tags: ['QuickBooks', 'SEC EDGAR', 'Auto-resolve'],
    color: 'violet',
  },
  {
    number: '02',
    title: 'Triage the inbox',
    description:
      'Every transaction arrives as a typed business event, pre-classified by Claude. Approve in one click, reject, or preview exactly what would post to the GL first.',
    tags: ['Event Inbox', 'AI Classify', 'Preview Post'],
    color: 'purple',
  },
  {
    number: '03',
    title: 'Map to US-GAAP',
    description:
      'AI Auto-Map suggests US-GAAP taxonomy targets for your chart of accounts, tracked by a live coverage bar. Review, override inline, and close the gaps.',
    tags: ['AI Auto-Map', 'GAAP Taxonomy', 'Coverage'],
    color: 'fuchsia',
  },
  {
    number: '04',
    title: 'Review your ledger',
    description:
      'Drill into journal-entry line items, validate the trial balance in CoA or US-GAAP view, and watch Balance Sheet, Income Statement, Cash Flow & Equity take shape as you go — no close required.',
    tags: ['Transactions', 'Trial Balance', 'Live Statements'],
    color: 'pink',
  },
  {
    number: '05',
    title: 'Close the period',
    description:
      'Step through a guided close: bootstrap the fiscal calendar, post depreciation & prepaid schedules to draft, clear rule-engine blockers, then lock — with optional write-back to QuickBooks.',
    tags: ['Schedules', 'Rule Engine', 'QB Write-back'],
    color: 'green',
  },
  {
    number: '06',
    title: 'Generate & file reports',
    description:
      'Build multi-period, comparative statements with the Report Creator, walk the Draft → Filed lifecycle, export XBRL 2.1 and JSON-LD bundles, and share to stakeholder publish lists.',
    tags: ['Report Creator', 'XBRL 2.1', 'Publish Lists'],
    color: 'orange',
  },
]

const colorClasses: Record<
  string,
  { border: string; bg: string; number: string; tag: string; dot: string }
> = {
  violet: {
    border: 'border-primary-500/30',
    bg: 'from-primary-500/10',
    number: 'text-primary-400',
    tag: 'bg-primary-950/50 text-primary-300',
    dot: 'bg-primary-500',
  },
  purple: {
    border: 'border-secondary-500/30',
    bg: 'from-secondary-500/10',
    number: 'text-secondary-400',
    tag: 'bg-secondary-950/50 text-secondary-300',
    dot: 'bg-secondary-500',
  },
  fuchsia: {
    border: 'border-accent-500/30',
    bg: 'from-accent-500/10',
    number: 'text-accent-400',
    tag: 'bg-accent-950/50 text-accent-300',
    dot: 'bg-accent-500',
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

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="relative bg-linear-to-b from-black to-zinc-900 py-16 sm:py-24"
    >
      <FloatingElementsVariant variant="features" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <div className="bg-primary-500/20 text-primary-400 mb-4 inline-block rounded-full px-4 py-1 text-sm font-semibold">
            End-to-end workflow
          </div>
          <h2 className="font-heading mb-6 text-3xl font-bold text-white sm:text-4xl md:text-5xl">
            From raw data to published reports
          </h2>
          <p className="mx-auto max-w-3xl text-base text-gray-300 sm:text-lg md:text-xl">
            RoboLedger covers the whole close cycle — connect your sources,
            triage events, map to GAAP, close the period, and publish
            statements, all in one place.
          </p>
        </div>

        <div className="relative">
          {/* Vertical connector line (desktop) */}
          <div className="from-primary-500/30 via-secondary-500/20 absolute top-0 bottom-0 left-1/2 hidden w-px -translate-x-1/2 bg-linear-to-b to-transparent lg:block"></div>

          <div className="space-y-6">
            {steps.map((step, idx) => {
              const c = colorClasses[step.color]
              const isLeft = idx % 2 === 0
              return (
                <div
                  key={step.number}
                  className={`relative flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-0 ${isLeft ? 'lg:flex-row' : 'lg:flex-row-reverse'}`}
                >
                  <div
                    className={`w-full rounded-2xl border ${c.border} bg-linear-to-br ${c.bg} to-zinc-900 p-6 transition-all duration-300 lg:w-[45%]`}
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

                  <div className="hidden lg:flex lg:w-[10%] lg:justify-center">
                    <div
                      className={`h-4 w-4 rounded-full ring-4 ring-black ${c.dot}`}
                    ></div>
                  </div>

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
