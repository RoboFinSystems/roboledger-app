import FloatingElementsVariant from './FloatingElementsVariant'

export default function AIReportingSection() {
  return (
    <section id="ai-reporting" className="relative bg-black py-20">
      <div className="absolute inset-0 bg-linear-to-br from-violet-900/30 via-purple-900/20 to-black"></div>
      <FloatingElementsVariant variant="ai-reporting" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <div className="mb-4 inline-block rounded-full bg-violet-500/20 px-4 py-1 text-sm font-semibold text-violet-400">
            Intelligent Automation
          </div>
          <h2 className="font-heading mb-6 text-4xl font-bold text-white md:text-5xl">
            AI in Every Step
          </h2>
          <p className="mx-auto max-w-3xl text-xl text-gray-300">
            From inbox triage to chart-of-accounts mapping to the close itself,
            Claude works across your books — and you can drive the entire
            month-end close from Claude Desktop over MCP.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="rounded-xl border border-purple-500/30 bg-purple-900/20 p-8">
            <h3 className="mb-6 text-2xl font-bold text-white">
              AI On Both Sides of the Ledger
            </h3>
            <div className="space-y-4 text-gray-300">
              <div className="space-y-2">
                <div className="rounded-lg bg-black/30 p-3">
                  <div className="mb-1 text-xs text-purple-300">
                    Event Inbox
                  </div>
                  <p className="text-sm italic">
                    A $2,400 vendor bill arrives — Claude proposes the entry
                  </p>
                </div>
                <div className="rounded-lg bg-black/30 p-3">
                  <div className="mb-1 text-xs text-fuchsia-300">
                    AI Console
                  </div>
                  <p className="text-sm italic">
                    "Which accounts had the most activity this quarter?"
                  </p>
                </div>
              </div>
              <div className="flex justify-center">
                <svg
                  className="h-8 w-8 text-violet-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 14l-7 7m0 0l-7-7m7 7V3"
                  />
                </svg>
              </div>
              <div className="rounded-lg bg-black/30 p-4">
                <div className="mb-2 text-sm text-green-300">
                  Claude delivers:
                </div>
                <ul className="space-y-1 text-sm">
                  <li>✓ Pre-classified events ready to approve</li>
                  <li>✓ US-GAAP mappings with confidence scores</li>
                  <li>✓ Transaction analysis &amp; trend summaries</li>
                  <li>✓ Answers grounded in your actual ledger</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-lg border border-purple-500/30 bg-purple-900/20 p-6">
              <h4 className="mb-3 flex items-center text-lg font-semibold text-white">
                <span className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-purple-500 text-sm">
                  1
                </span>
                AI Event Triage
              </h4>
              <p className="text-sm text-gray-300">
                Claude pre-classifies every incoming business event in the inbox
                — approve in one click, reclassify, or run on autopilot
              </p>
            </div>

            <div className="rounded-lg border border-green-500/30 bg-green-900/20 p-6">
              <h4 className="mb-3 flex items-center text-lg font-semibold text-white">
                <span className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-sm">
                  2
                </span>
                AI Chart-of-Accounts Mapping
              </h4>
              <p className="text-sm text-gray-300">
                The mapping operator suggests US-GAAP taxonomy targets for each
                account, gated by confidence scores for review
              </p>
            </div>

            <div className="rounded-lg border border-purple-500/30 bg-purple-900/20 p-6">
              <h4 className="mb-3 flex items-center text-lg font-semibold text-white">
                <span className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-purple-500 text-sm">
                  3
                </span>
                Close Guard Rails
              </h4>
              <p className="text-sm text-gray-300">
                A rule engine validates every entry — accounting-equation
                balance, period rollforward, and XBRL compliance — before you
                lock
              </p>
            </div>

            <div className="rounded-lg border border-violet-500/30 bg-violet-900/20 p-6">
              <h4 className="mb-3 flex items-center text-lg font-semibold text-white">
                <span className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-violet-500 text-sm">
                  4
                </span>
                AI Console &amp; MCP
              </h4>
              <p className="text-sm text-gray-300">
                Ask Claude anything about your books in the AI Console, or
                connect Claude Desktop over MCP to drive the entire month-end
                close from your own agent
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="mb-4 text-gray-300">
            Powered by{' '}
            <span className="font-semibold text-violet-400">Claude AI</span> and{' '}
            <a
              href="https://robosystems.ai/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-violet-400 hover:text-violet-300"
            >
              RoboSystems'
            </a>{' '}
            knowledge graph platform
          </p>
          <div className="inline-flex items-center gap-2 rounded-full bg-violet-900/40 px-6 py-3 text-sm text-gray-300">
            <svg
              className="h-5 w-5 text-purple-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Experience autonomous financial reporting today
          </div>
        </div>
      </div>
    </section>
  )
}
