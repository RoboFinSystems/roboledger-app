export default function ReportCreator() {
  return (
    <section className="relative bg-black py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2 className="font-heading mb-6 text-3xl font-bold text-white sm:text-4xl md:text-5xl">
            Powerful Report Creator
          </h2>
          <p className="mx-auto max-w-3xl text-base text-gray-300 sm:text-lg md:text-xl">
            Build financial reports with an intuitive interface powered by the
            Fact Grid - your data structured for intelligent reporting
          </p>
        </div>

        <div className="mb-12 grid gap-8 lg:grid-cols-2">
          {/* Fact Grid Visualization */}
          <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-900/20 to-zinc-900 p-8">
            <h3 className="mb-6 text-xl font-bold text-white">
              Fact Grid: Your Data Foundation
            </h3>
            <div className="space-y-4">
              <div className="rounded-lg border border-gray-700 bg-zinc-900/50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-300">
                    DIMENSIONS
                  </span>
                  <span className="text-xs text-gray-500">Multi-axis view</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded bg-blue-950/50 px-3 py-2 text-sm text-blue-300">
                    Time Period
                  </div>
                  <div className="rounded bg-purple-950/50 px-3 py-2 text-sm text-purple-300">
                    Account
                  </div>
                  <div className="rounded bg-green-950/50 px-3 py-2 text-sm text-green-300">
                    Entity
                  </div>
                  <div className="rounded bg-orange-950/50 px-3 py-2 text-sm text-orange-300">
                    Segment
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-gray-700 bg-zinc-900/50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-300">
                    FACTS
                  </span>
                  <span className="text-xs text-gray-500">
                    Validated values
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between rounded bg-gray-800/50 px-3 py-2">
                    <span className="text-xs text-gray-400">Cash</span>
                    <span className="font-mono text-sm text-white">
                      $1,245,890
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded bg-gray-800/50 px-3 py-2">
                    <span className="text-xs text-gray-400">
                      Accounts Receivable
                    </span>
                    <span className="font-mono text-sm text-white">
                      $892,450
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded bg-gray-800/50 px-3 py-2">
                    <span className="text-xs text-gray-400">Inventory</span>
                    <span className="font-mono text-sm text-white">
                      $456,120
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-green-500/30 bg-green-950/20 p-4">
                <div className="flex items-center gap-2">
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
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-sm font-semibold text-green-300">
                    XBRL-Compliant Structure
                  </span>
                </div>
                <p className="mt-2 text-xs text-gray-400">
                  Facts organized by US-GAAP taxonomy for automated compliance
                  and SEC filing readiness
                </p>
              </div>
            </div>
          </div>

          {/* Report Builder Interface */}
          <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-900/20 to-zinc-900 p-8">
            <h3 className="mb-6 text-xl font-bold text-white">
              Visual Report Builder
            </h3>
            <div className="space-y-4">
              <div className="rounded-lg border border-gray-700 bg-zinc-900/50 p-4">
                <div className="mb-3 text-sm font-semibold text-gray-300">
                  SELECT TEMPLATE
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="cursor-pointer rounded border-2 border-purple-500 bg-purple-950/30 p-3 text-center">
                    <div className="text-xs font-semibold text-purple-300">
                      Balance Sheet
                    </div>
                  </div>
                  <div className="cursor-pointer rounded border border-gray-700 bg-gray-800/30 p-3 text-center opacity-50">
                    <div className="text-xs font-semibold text-gray-400">
                      Income Statement
                    </div>
                  </div>
                  <div className="cursor-pointer rounded border border-gray-700 bg-gray-800/30 p-3 text-center opacity-50">
                    <div className="text-xs font-semibold text-gray-400">
                      Cash Flow
                    </div>
                  </div>
                  <div className="cursor-pointer rounded border border-gray-700 bg-gray-800/30 p-3 text-center opacity-50">
                    <div className="text-xs font-semibold text-gray-400">
                      Custom
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-gray-700 bg-zinc-900/50 p-4">
                <div className="mb-3 text-sm font-semibold text-gray-300">
                  CONFIGURE PERIODS
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 rounded border border-blue-500/50 bg-blue-950/30 px-3 py-2 text-center">
                    <div className="text-xs text-blue-300">Q4 2024</div>
                  </div>
                  <div className="flex-1 rounded border border-gray-600 bg-gray-800/30 px-3 py-2 text-center">
                    <div className="text-xs text-gray-400">Q3 2024</div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-gray-700 bg-zinc-900/50 p-4">
                <div className="mb-3 text-sm font-semibold text-gray-300">
                  ADD DIMENSIONS
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">By Segment</span>
                    <div className="h-5 w-9 rounded-full bg-green-500"></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">By Geography</span>
                    <div className="h-5 w-9 rounded-full bg-gray-600"></div>
                  </div>
                </div>
              </div>

              <button className="w-full rounded-lg bg-linear-to-r from-purple-500 to-pink-500 px-4 py-3 text-sm font-semibold text-white transition-all hover:from-purple-600 hover:to-pink-600">
                Generate Report →
              </button>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-gray-800 bg-gradient-to-br from-zinc-900 to-zinc-950 p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/20">
              <svg
                className="h-6 w-6 text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z"
                />
              </svg>
            </div>
            <h4 className="mb-2 font-semibold text-white">
              Drag & Drop Builder
            </h4>
            <p className="text-sm text-gray-400">
              Visual interface for report design and fact selection
            </p>
          </div>

          <div className="rounded-xl border border-gray-800 bg-gradient-to-br from-zinc-900 to-zinc-950 p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/20">
              <svg
                className="h-6 w-6 text-purple-400"
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
            </div>
            <h4 className="mb-2 font-semibold text-white">Template Library</h4>
            <p className="text-sm text-gray-400">
              Pre-built templates for common financial statements
            </p>
          </div>

          <div className="rounded-xl border border-gray-800 bg-gradient-to-br from-zinc-900 to-zinc-950 p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/20">
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
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <h4 className="mb-2 font-semibold text-white">
              Real-Time Validation
            </h4>
            <p className="text-sm text-gray-400">
              Instant feedback on accounting equation and XBRL compliance
            </p>
          </div>

          <div className="rounded-xl border border-gray-800 bg-gradient-to-br from-zinc-900 to-zinc-950 p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-orange-500/20">
              <svg
                className="h-6 w-6 text-orange-400"
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
            </div>
            <h4 className="mb-2 font-semibold text-white">
              Multi-Format Export
            </h4>
            <p className="text-sm text-gray-400">
              Export to Excel, PDF, XBRL, or interactive dashboards
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
