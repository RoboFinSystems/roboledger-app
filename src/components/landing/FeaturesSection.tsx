import FloatingElementsVariant from './FloatingElementsVariant'

export default function FeaturesSection() {
  const features = [
    {
      icon: (
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
          />
        </svg>
      ),
      title: 'Connect Your Sources',
      description:
        'Sync QuickBooks, link bank accounts via Plaid, and pull SEC EDGAR data into one knowledge graph — customers, vendors, and employees resolved automatically',
      color: 'violet',
    },
    {
      icon: (
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
      ),
      title: 'Event Inbox',
      description:
        'Every transaction arrives as a typed business event, pre-classified by AI. Review and approve in one click, or run on autopilot',
      color: 'purple',
    },
    {
      icon: (
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
      ),
      title: 'Ledger & Live Statements',
      description:
        'Full chart of accounts, journal entries, and trial balance with US-GAAP AI auto-mapping — plus Balance Sheet, Income Statement, Cash Flow & Equity rendered live',
      color: 'fuchsia',
    },
    {
      icon: (
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
      title: 'AI-Assisted Close',
      description:
        'Guided fiscal close with depreciation & prepaid schedules, a rule engine, and draft-entry review before you lock the period',
      color: 'green',
    },
    {
      icon: (
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
      title: 'Reports & XBRL',
      description:
        'Generate statements with the Report Creator, export XBRL 2.1 and JSON-LD bundles, and share to stakeholder publish lists',
      color: 'pink',
    },
    {
      icon: (
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
          />
        </svg>
      ),
      title: 'AI Console & MCP',
      description:
        'Ask Claude about your books in natural language in-app, or drive the month-end close from Claude Desktop via the @robosystems/mcp tools',
      color: 'orange',
    },
  ]

  const colorClasses = {
    violet:
      'from-violet-500/20 to-purple-500/20 border-violet-500/30 hover:border-violet-500/50 text-violet-400',
    purple:
      'from-purple-500/20 to-fuchsia-500/20 border-purple-500/30 hover:border-purple-500/50 text-purple-400',
    fuchsia:
      'from-fuchsia-500/20 to-pink-500/20 border-fuchsia-500/30 hover:border-fuchsia-500/50 text-fuchsia-400',
    green:
      'from-green-500/20 to-emerald-500/20 border-green-500/30 hover:border-green-500/50 text-green-400',
    orange:
      'from-orange-500/20 to-red-500/20 border-orange-500/30 hover:border-orange-500/50 text-orange-400',
    pink: 'from-pink-500/20 to-purple-500/20 border-pink-500/30 hover:border-pink-500/50 text-pink-400',
  }

  return (
    <section
      id="features"
      className="relative bg-linear-to-b from-black to-zinc-900 py-16 sm:py-24"
    >
      <FloatingElementsVariant variant="features" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Paradigm Shift Header */}
        <div className="mb-12 text-center">
          <h2 className="font-heading mb-6 text-3xl font-bold text-white sm:text-4xl md:text-5xl">
            A New Way to Close the Books
          </h2>
          <p className="mx-auto max-w-3xl text-base text-gray-300 sm:text-lg md:text-xl">
            Moving from manual bookkeeping to an event-driven, AI-assisted close
          </p>
        </div>

        {/* Traditional vs AI-Native Comparison */}
        <div className="mb-16 grid gap-8 lg:grid-cols-2">
          {/* Traditional Way */}
          <div className="rounded-2xl border border-red-500/30 bg-linear-to-br from-red-900/20 to-zinc-900 p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-500/20">
                <svg
                  className="h-6 w-6 text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white">
                Traditional Close
              </h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-500/20 text-sm font-semibold text-red-400">
                  1
                </div>
                <div>
                  <div className="font-semibold text-white">
                    Build Mapping Tables
                  </div>
                  <p className="text-sm text-gray-400">
                    VLOOKUP hell: manual account-to-line-item mapping in Excel,
                    breaks every time chart of accounts changes
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-500/20 text-sm font-semibold text-red-400">
                  2
                </div>
                <div>
                  <div className="font-semibold text-white">
                    Extract & Transform
                  </div>
                  <p className="text-sm text-gray-400">
                    Export trial balance, copy/paste into Excel templates, pray
                    formulas still work
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-500/20 text-sm font-semibold text-red-400">
                  3
                </div>
                <div>
                  <div className="font-semibold text-white">
                    Manual Reconciliation
                  </div>
                  <p className="text-sm text-gray-400">
                    Hunt for #REF! errors, fix broken formulas, reconcile
                    totals, adjust for new accounts
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-500/20 text-sm font-semibold text-red-400">
                  4
                </div>
                <div>
                  <div className="font-semibold text-white">Publish & Pray</div>
                  <p className="text-sm text-gray-400">
                    Lock cells, save as PDF, hope nothing changed since you
                    started
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-lg bg-red-950/50 p-4">
              <div className="text-sm font-semibold text-red-400">
                Result: 5-10 Days
              </div>
              <p className="mt-1 text-xs text-gray-400">
                Manual work, error-prone, time-consuming close process
              </p>
            </div>
          </div>

          {/* AI-Native Way */}
          <div className="rounded-2xl border border-green-500/30 bg-linear-to-br from-green-900/20 to-zinc-900 p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/20">
                <svg
                  className="h-6 w-6 text-green-400"
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
              </div>
              <h3 className="text-2xl font-bold text-white">
                AI-Native RoboLedger
              </h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500/20 text-sm font-semibold text-green-400">
                  1
                </div>
                <div>
                  <div className="font-semibold text-white">Events Flow In</div>
                  <p className="text-sm text-gray-400">
                    QuickBooks, bank feeds, and manual entries arrive as typed
                    business events
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500/20 text-sm font-semibold text-green-400">
                  2
                </div>
                <div>
                  <div className="font-semibold text-white">AI Triages</div>
                  <p className="text-sm text-gray-400">
                    Claude pre-classifies each event in the inbox — approve in
                    one click or run on autopilot
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500/20 text-sm font-semibold text-green-400">
                  3
                </div>
                <div>
                  <div className="font-semibold text-white">Guided Close</div>
                  <p className="text-sm text-gray-400">
                    Schedules post depreciation & amortization; the rule engine
                    validates every entry
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500/20 text-sm font-semibold text-green-400">
                  4
                </div>
                <div>
                  <div className="font-semibold text-white">Publish & File</div>
                  <p className="text-sm text-gray-400">
                    Generate statements, export XBRL, and share to stakeholder
                    lists
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-lg bg-green-950/50 p-4">
              <div className="text-sm font-semibold text-green-400">
                Result: Minutes to Hours
              </div>
              <p className="mt-1 text-xs text-gray-400">
                Automated intelligence, validated accuracy, continuous close
              </p>
            </div>
          </div>
        </div>

        <div className="mb-16 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-950/50 px-6 py-3 text-sm text-green-200">
            <svg
              className="h-5 w-5 text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            10x faster close — the end of spreadsheet hell
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className={`group relative overflow-hidden rounded-2xl border bg-linear-to-br p-6 transition-all duration-300 ${colorClasses[feature.color as keyof typeof colorClasses]}`}
            >
              <div
                className={`mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-${feature.color}-500/20`}
              >
                {feature.icon}
              </div>
              <h3 className="mb-2 text-lg font-semibold text-white">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
