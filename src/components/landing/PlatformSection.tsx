import FloatingElementsVariant from './FloatingElementsVariant'

export default function PlatformSection() {
  return (
    <section id="platform" className="relative bg-black py-16 sm:py-24">
      <FloatingElementsVariant variant="platform" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2 className="font-heading mb-6 text-3xl font-bold text-white sm:text-4xl md:text-5xl">
            Powered by RoboSystems
          </h2>
          <p className="mx-auto max-w-3xl text-base text-gray-300 sm:text-lg md:text-xl">
            Your numbers live in a financial knowledge graph — a unified
            three-block model of taxonomy, events, and information — so every
            figure is traceable to its source, queryable in plain English, and
            validated before it's filed
          </p>
        </div>

        <div className="mb-12 rounded-2xl border border-gray-800 bg-gradient-to-b from-zinc-900 to-black p-8">
          <div className="grid gap-8 lg:grid-cols-3">
            <div>
              <h3 className="mb-6 text-center text-sm font-semibold tracking-wider text-gray-500 uppercase">
                Data Sources
              </h3>
              <div className="space-y-4">
                <div className="border-primary-500/30 from-primary-500/10 to-secondary-500/10 rounded-lg border bg-gradient-to-br p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-600">
                      <span className="text-xs font-bold text-white">QB</span>
                    </div>
                    <div>
                      <div className="font-semibold text-white">QuickBooks</div>
                      <div className="text-xs text-gray-400">Accounting</div>
                    </div>
                  </div>
                  <ul className="space-y-1 text-xs text-gray-400">
                    <li>• Chart of accounts</li>
                    <li>• Journal entries</li>
                    <li>• Transaction data</li>
                  </ul>
                </div>

                <div className="border-secondary-500/30 from-secondary-500/10 rounded-lg border bg-gradient-to-br to-pink-500/10 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <div className="bg-secondary-600 flex h-8 w-8 items-center justify-center rounded-lg">
                      <span className="text-xs font-bold text-white">SEC</span>
                    </div>
                    <div>
                      <div className="font-semibold text-white">SEC EDGAR</div>
                      <div className="text-xs text-gray-400">Regulatory</div>
                    </div>
                  </div>
                  <ul className="space-y-1 text-xs text-gray-400">
                    <li>• 10-K/10-Q filings</li>
                    <li>• XBRL standards</li>
                    <li>• Taxonomy data</li>
                  </ul>
                </div>

                <div className="rounded-lg border border-gray-700/60 bg-gradient-to-br from-zinc-800/40 to-zinc-900/40 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-700">
                      <span className="text-xs font-bold text-white">$</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="font-semibold text-white">Plaid</div>
                        <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
                          Coming soon
                        </span>
                      </div>
                      <div className="text-xs text-gray-400">Bank feeds</div>
                    </div>
                  </div>
                  <ul className="space-y-1 text-xs text-gray-500">
                    <li>• Direct bank & card transactions</li>
                    <li>• Account balances</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="relative">
              <h3 className="mb-6 text-center text-sm font-semibold tracking-wider text-gray-500 uppercase">
                Three-Block Model
              </h3>
              <div className="relative mx-auto mt-8 h-72 w-72">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-full w-full rounded-full border-2 border-green-500/30 bg-gradient-to-br from-green-600/10 to-emerald-600/10">
                    <div className="flex h-full items-center justify-center">
                      <div className="text-center">
                        <div className="mb-1 text-sm font-semibold text-white">
                          <div>RoboLedger Schema</div>
                          <div>Knowledge Graph</div>
                        </div>
                        <div className="text-xs text-gray-400">
                          Financial data + XBRL semantics
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 space-y-3">
                <div className="border-secondary-500/30 bg-secondary-950/20 rounded-lg border p-3">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-secondary-300 font-semibold">
                      Taxonomy Block
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">
                    Concepts, structures, and rules
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {['Element', 'Structure', 'Rule'].map((comp, cidx) => (
                      <span
                        key={cidx}
                        className="bg-secondary-900/50 text-secondary-300 rounded px-2 py-0.5 text-xs"
                      >
                        {comp}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg border border-green-500/30 bg-green-950/20 p-3">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="font-semibold text-green-300">
                      Event Block
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">
                    Business events, agents, journal entries
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {['Event', 'Transaction', 'Entry'].map((comp, cidx) => (
                      <span
                        key={cidx}
                        className="rounded bg-green-900/50 px-2 py-0.5 text-xs text-green-300"
                      >
                        {comp}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="border-primary-500/30 bg-primary-950/20 rounded-lg border p-3">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-primary-300 font-semibold">
                      Information Block
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">
                    Facts, statements, and rendering
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {['Fact', 'Statement', 'Report'].map((comp, cidx) => (
                      <span
                        key={cidx}
                        className="bg-primary-900/50 text-primary-300 rounded px-2 py-0.5 text-xs"
                      >
                        {comp}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="mb-6 text-center text-sm font-semibold tracking-wider text-gray-500 uppercase">
                Applications
              </h3>
              <div className="space-y-4">
                <div className="to-primary-950/20 rounded-lg border border-gray-800 bg-gradient-to-br from-zinc-900 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <div className="bg-primary-600 flex h-8 w-8 items-center justify-center rounded-lg">
                      <svg
                        className="h-4 w-4 text-white"
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
                    </div>
                    <div className="font-semibold text-white">
                      RoboLedger App
                    </div>
                  </div>
                  <p className="text-xs text-gray-400">
                    Accounting and financial reporting
                  </p>
                </div>

                <div className="to-secondary-950/20 rounded-lg border border-gray-800 bg-gradient-to-br from-zinc-900 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <div className="bg-secondary-600 flex h-8 w-8 items-center justify-center rounded-lg">
                      <svg
                        className="h-4 w-4 text-white"
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
                    </div>
                    <div className="font-semibold text-white">MCP Tools</div>
                  </div>
                  <p className="text-xs text-gray-400">
                    Month-end close in Claude Desktop via @robosystems/mcp
                  </p>
                </div>

                <div className="to-accent-950/20 rounded-lg border border-gray-800 bg-gradient-to-br from-zinc-900 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <div className="bg-accent-600 flex h-8 w-8 items-center justify-center rounded-lg">
                      <svg
                        className="h-4 w-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                        />
                      </svg>
                    </div>
                    <div className="font-semibold text-white">API Access</div>
                  </div>
                  <p className="text-xs text-gray-400">
                    Python, TypeScript, and REST clients
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="group from-primary-500/10 hover:border-primary-500/50 rounded-xl border border-gray-800 bg-gradient-to-br to-zinc-900 p-6 transition-all">
            <div className="from-primary-500 to-secondary-500 mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br">
              <svg
                className="h-6 w-6 text-white"
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
            </div>
            <h3 className="mb-2 text-lg font-semibold text-white">
              Automated Sync
            </h3>
            <p className="text-sm text-gray-400">
              Keep connected sources in step with your ledger — sync on demand
              or on a schedule
            </p>
          </div>

          <div className="group from-secondary-500/10 hover:border-secondary-500/50 rounded-xl border border-gray-800 bg-gradient-to-br to-zinc-900 p-6 transition-all">
            <div className="from-secondary-500 mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br to-pink-500">
              <svg
                className="h-6 w-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
                />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-white">
              Unified Data Model
            </h3>
            <p className="text-sm text-gray-400">
              Single source of truth connecting accounting, reporting, and
              regulatory data
            </p>
          </div>

          <div className="group rounded-xl border border-gray-800 bg-gradient-to-br from-green-500/10 to-zinc-900 p-6 transition-all hover:border-green-500/50">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-emerald-500">
              <svg
                className="h-6 w-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
                />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-white">
              Graph Database Performance
            </h3>
            <p className="text-sm text-gray-400">
              Fast, interactive queries on complex accounting relationships
              powered by knowledge graph technology
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
