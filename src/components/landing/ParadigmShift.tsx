export default function ParadigmShift() {
  return (
    <section className="relative bg-gradient-to-b from-black to-zinc-900 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="font-heading mb-6 text-3xl font-bold text-white sm:text-4xl md:text-5xl">
            A New Way to Create Financial Reports
          </h2>
          <p className="mx-auto max-w-3xl text-base text-gray-300 sm:text-lg md:text-xl">
            Moving from manual configuration to intelligent automation
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Traditional Way */}
          <div className="rounded-2xl border border-red-500/30 bg-gradient-to-br from-red-900/20 to-zinc-900 p-8">
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
          <div className="rounded-2xl border border-green-500/30 bg-gradient-to-br from-green-900/20 to-zinc-900 p-8">
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

        <div className="mt-12 text-center">
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
            10x faster close, 99.9% accuracy, zero manual reconciliation
          </div>
        </div>
      </div>
    </section>
  )
}
