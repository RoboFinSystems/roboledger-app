import Link from 'next/link'
import FloatingElementsVariant from './FloatingElementsVariant'

export default function IntegrationsSection() {
  return (
    <section
      id="integrations"
      className="relative overflow-hidden bg-black py-16 sm:py-24"
    >
      <FloatingElementsVariant variant="features" intensity={8} />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2 className="font-heading mb-6 text-3xl font-bold text-white sm:text-4xl md:text-5xl">
            Connect & Extend
          </h2>
          <p className="mx-auto max-w-3xl text-base text-gray-300 sm:text-lg md:text-xl">
            Official integrations to get started fast. Fork and extend with your
            own custom data sources.
          </p>
        </div>

        {/* Official Integrations */}
        <div className="mb-16">
          <h3 className="mb-8 text-center text-lg font-semibold text-gray-300">
            Official Integrations
          </h3>
          <div className="grid gap-6 md:grid-cols-3">
            {/* QuickBooks */}
            <div className="rounded-xl border border-gray-800 bg-zinc-900/50 p-6 transition-all hover:border-green-500/50">
              <div className="mb-4 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-600">
                  <span className="text-lg font-bold text-white">QB</span>
                </div>
                <div>
                  <h4 className="font-semibold text-white">QuickBooks</h4>
                  <p className="text-sm text-gray-400">Accounting</p>
                </div>
              </div>
              <p className="text-sm text-gray-400">
                Sync your chart of accounts, transactions, and trial balance.
                Full OAuth integration with real-time updates.
              </p>
            </div>

            {/* SEC XBRL */}
            <div className="rounded-xl border border-gray-800 bg-zinc-900/50 p-6 transition-all hover:border-purple-500/50">
              <div className="mb-4 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-600">
                  <span className="text-lg font-bold text-white">SEC</span>
                </div>
                <div>
                  <h4 className="font-semibold text-white">SEC XBRL</h4>
                  <p className="text-sm text-gray-400">Public Filings</p>
                </div>
              </div>
              <p className="text-sm text-gray-400">
                Import 10-K and 10-Q filings for any public company. Structured
                XBRL facts become queryable graph nodes.
              </p>
            </div>

            {/* Plaid */}
            <div className="rounded-xl border border-gray-800 bg-zinc-900/50 p-6 opacity-75 transition-all hover:border-blue-500/50">
              <div className="mb-4 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600">
                  <svg
                    className="h-7 w-7 text-white"
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
                </div>
                <div>
                  <h4 className="font-semibold text-white">Plaid</h4>
                  <p className="text-sm text-gray-400">Banking</p>
                </div>
                <span className="rounded-full bg-yellow-500/20 px-2 py-1 text-xs font-medium text-yellow-400">
                  Coming Soon
                </span>
              </div>
              <p className="text-sm text-gray-400">
                Connect bank accounts directly. Transaction feeds flow into your
                context graph with automatic categorization.
              </p>
            </div>
          </div>
        </div>

        {/* Extensibility */}
        <div className="mb-16 rounded-2xl border border-gray-800 bg-gradient-to-br from-zinc-900 to-zinc-800/50 p-6 sm:p-8">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div>
              <h3 className="font-heading mb-4 text-xl font-semibold text-white sm:text-2xl">
                Build Your Own Integrations
              </h3>
              <p className="mb-6 text-gray-300">
                RoboSystems is designed to be forked and extended. Transform any
                data source into graph nodes and relationships using the same
                patterns as our official integrations—complete with Dagster
                pipelines and CI/CD.
              </p>
              <ul className="space-y-3 text-sm text-gray-400">
                <li className="flex items-start">
                  <svg
                    className="mt-0.5 mr-3 h-5 w-5 shrink-0 text-cyan-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>
                    <strong className="text-white">Adapter pattern:</strong>{' '}
                    Connect to APIs, transform data into graph entities and
                    relationships
                  </span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="mt-0.5 mr-3 h-5 w-5 shrink-0 text-cyan-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>
                    <strong className="text-white">Dagster pipelines:</strong>{' '}
                    Scheduled and event-driven data orchestration
                  </span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="mt-0.5 mr-3 h-5 w-5 shrink-0 text-cyan-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>
                    <strong className="text-white">Merge-friendly:</strong> Your
                    custom code lives in isolated namespaces—upstream updates
                    won't conflict
                  </span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="mt-0.5 mr-3 h-5 w-5 shrink-0 text-cyan-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>
                    <strong className="text-white">AI-assisted:</strong> Let
                    Claude Code build integrations using the existing patterns
                  </span>
                </li>
              </ul>
            </div>
            <div className="rounded-xl bg-black/50 p-4">
              <div className="mb-2 flex items-center gap-2 text-xs text-gray-500">
                <span className="h-3 w-3 rounded-full bg-red-500"></span>
                <span className="h-3 w-3 rounded-full bg-yellow-500"></span>
                <span className="h-3 w-3 rounded-full bg-green-500"></span>
                <span className="ml-2">~/robosystems</span>
              </div>
              <pre className="overflow-x-auto text-xs text-gray-400">
                <code>{`adapters/
├── sec/           # Official: SEC EDGAR
├── quickbooks/    # Official: QuickBooks
├── plaid/         # Official: Plaid Banking
│
└── your_erp/      # Your custom integration
    ├── client/
    │   └── api.py
    └── processors/
        └── transform.py`}</code>
              </pre>
            </div>
          </div>
        </div>

        {/* SEC Shared Repository - Flagship Data Product */}
        <div>
          <h3 className="mb-8 text-center text-lg font-semibold text-gray-300">
            Shared Repositories
          </h3>
          <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-950/30 to-zinc-900 p-6 sm:p-8">
            <div className="grid gap-8 lg:grid-cols-5">
              <div className="lg:col-span-3">
                <div className="mb-4 flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-cyan-600">
                    <span className="text-xl font-bold text-white">SEC</span>
                  </div>
                  <div>
                    <h4 className="font-heading text-xl font-semibold text-white">
                      SEC XBRL Repository
                    </h4>
                    <p className="text-sm text-cyan-400">
                      Subscribe and query instantly
                    </p>
                  </div>
                </div>
                <p className="mb-6 text-gray-300">
                  A pre-built context graph containing financial data from every
                  public company's SEC filings. Subscribe once, and your AI
                  agents gain instant access to market intelligence for
                  benchmarking, competitive analysis, and research.
                </p>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-lg bg-black/30 p-3 text-center">
                    <div className="text-2xl font-bold text-cyan-400">
                      4,000+
                    </div>
                    <div className="text-xs text-gray-500">
                      Public Companies
                    </div>
                  </div>
                  <div className="rounded-lg bg-black/30 p-3 text-center">
                    <div className="text-2xl font-bold text-cyan-400">
                      100K+
                    </div>
                    <div className="text-xs text-gray-500">XBRL Filings</div>
                  </div>
                  <div className="rounded-lg bg-black/30 p-3 text-center">
                    <div className="text-2xl font-bold text-cyan-400">
                      Daily
                    </div>
                    <div className="text-xs text-gray-500">Updates</div>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-2">
                <div className="rounded-xl bg-black/30 p-4">
                  <p className="mb-3 text-sm font-medium text-white">
                    Example: Compare R&D spending
                  </p>
                  <div className="rounded-lg bg-zinc-900 p-3">
                    <p className="text-sm text-gray-300 italic">
                      "Compare Microsoft and Google's R&D spending as a
                      percentage of revenue over the last 3 years"
                    </p>
                  </div>
                  <p className="mt-4 text-xs text-gray-400">
                    Your AI traverses the SEC repository to pull standardized
                    XBRL facts, calculate ratios, and return comparative
                    analysis—all from a natural language query.
                  </p>
                </div>
                <div className="mt-4 rounded-xl border border-dashed border-gray-700 bg-black/20 p-4">
                  <p className="mb-2 text-sm font-medium text-white">
                    Coming Soon
                  </p>
                  <p className="text-xs text-gray-400">
                    Market data partnerships, industry benchmarks, and economic
                    indicators—subscribe through the data marketplace or bring
                    your own vendor credentials.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <p className="text-gray-400">
            Ready to connect your data?{' '}
            <Link
              href="https://github.com/RoboFinSystems/robosystems"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:text-cyan-300"
            >
              Explore the repo
            </Link>{' '}
            or{' '}
            <Link
              href="/register"
              className="text-cyan-400 hover:text-cyan-300"
            >
              get started
            </Link>
            .
          </p>
        </div>
      </div>
    </section>
  )
}
