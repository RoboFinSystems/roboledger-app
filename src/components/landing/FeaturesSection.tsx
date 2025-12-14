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
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
      title: 'QuickBooks Integration',
      description:
        'Sync your existing accounting data from QuickBooks into your knowledge graph',
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
            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
          />
        </svg>
      ),
      title: 'Plaid Bank Feeds',
      description:
        'Direct bank account integration for real-time transaction data',
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
      title: 'Chart of Accounts',
      description:
        'Full chart of accounts with journal entries and AI-assisted categorization',
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
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
      title: 'Financial Reports',
      description:
        'Create custom report templates and share digital financial statements',
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
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          />
        </svg>
      ),
      title: 'AI-Powered Analysis',
      description:
        'Natural language queries, automated classification, and anomaly detection',
      color: 'orange',
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
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      ),
      title: 'Knowledge Graph',
      description:
        'Semantic relationships between accounts, transactions, and reports',
      color: 'pink',
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
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Paradigm Shift Header */}
        <div className="mb-12 text-center">
          <h2 className="font-heading mb-6 text-3xl font-bold text-white sm:text-4xl md:text-5xl">
            A New Way to Create Financial Reports
          </h2>
          <p className="mx-auto max-w-3xl text-base text-gray-300 sm:text-lg md:text-xl">
            Moving from manual configuration to intelligent automation
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
                Traditional Reporting
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
                  <div className="font-semibold text-white">State Intent</div>
                  <p className="text-sm text-gray-400">
                    "Create Q4 balance sheet" or use Report Creator interface
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500/20 text-sm font-semibold text-green-400">
                  2
                </div>
                <div>
                  <div className="font-semibold text-white">AI Creates</div>
                  <p className="text-sm text-gray-400">
                    Discovers accounts, builds fact grid, applies XBRL taxonomy
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500/20 text-sm font-semibold text-green-400">
                  3
                </div>
                <div>
                  <div className="font-semibold text-white">AI Validates</div>
                  <p className="text-sm text-gray-400">
                    Checks accounting equation, XBRL compliance, semantic rules
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500/20 text-sm font-semibold text-green-400">
                  4
                </div>
                <div>
                  <div className="font-semibold text-white">
                    Approve & Publish
                  </div>
                  <p className="text-sm text-gray-400">
                    Review exceptions only, export to multiple formats
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
            10x faster financial reporting - the end of spreadsheet hell
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
