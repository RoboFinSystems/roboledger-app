export default function AIReportingSection() {
  return (
    <section
      id="ai-reporting"
      className="relative bg-linear-to-br from-purple-900 to-blue-900 py-20"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <div className="mb-4 inline-block rounded-full bg-cyan-500/20 px-4 py-1 text-sm font-semibold text-cyan-400">
            Intelligent Automation
          </div>
          <h2 className="font-heading mb-6 text-4xl font-bold text-white md:text-5xl">
            AI-Native Financial Reporting
          </h2>
          <p className="mx-auto max-w-3xl text-xl text-purple-100">
            Pioneering autonomous financial report generation - where natural
            language requests become complete, validated financial statements in
            seconds.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="rounded-xl border border-purple-500/30 bg-purple-900/20 p-8">
            <h3 className="mb-6 text-2xl font-bold text-white">
              From Request to Report in Seconds
            </h3>
            <div className="space-y-4 text-purple-100">
              <div className="rounded-lg bg-black/30 p-4">
                <div className="mb-2 text-sm text-purple-300">You say:</div>
                <p className="italic">"Create a balance sheet for Q4 2024"</p>
              </div>
              <div className="flex justify-center">
                <svg
                  className="h-8 w-8 text-cyan-400"
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
                <div className="mb-2 text-sm text-green-300">AI delivers:</div>
                <ul className="space-y-1 text-sm">
                  <li>✓ Complete, validated balance sheet</li>
                  <li>✓ XBRL-compliant formatting</li>
                  <li>✓ Variance explanations</li>
                  <li>✓ Multiple output formats (Excel, PDF, interactive)</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-lg border border-blue-500/30 bg-blue-900/20 p-6">
              <h4 className="mb-3 flex items-center text-lg font-semibold text-white">
                <span className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-sm">
                  1
                </span>
                Natural Language Understanding
              </h4>
              <p className="text-sm text-blue-100">
                Claude AI parses your request and understands report type,
                period, dimensions, and format preferences
              </p>
            </div>

            <div className="rounded-lg border border-green-500/30 bg-green-900/20 p-6">
              <h4 className="mb-3 flex items-center text-lg font-semibold text-white">
                <span className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-sm">
                  2
                </span>
                Intelligent Element Discovery
              </h4>
              <p className="text-sm text-green-100">
                AI discovers relevant taxonomy elements from your chart of
                accounts and XBRL standards
              </p>
            </div>

            <div className="rounded-lg border border-purple-500/30 bg-purple-900/20 p-6">
              <h4 className="mb-3 flex items-center text-lg font-semibold text-white">
                <span className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-purple-500 text-sm">
                  3
                </span>
                AI Guard Rails
              </h4>
              <p className="text-sm text-purple-100">
                Multi-layer validation ensures accounting equation balance, XBRL
                compliance, and semantic accuracy
              </p>
            </div>

            <div className="rounded-lg border border-cyan-500/30 bg-cyan-900/20 p-6">
              <h4 className="mb-3 flex items-center text-lg font-semibold text-white">
                <span className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500 text-sm">
                  4
                </span>
                Continuous Learning
              </h4>
              <p className="text-sm text-cyan-100">
                System learns from your corrections and preferences, improving
                report quality over time
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="mb-4 text-purple-200">
            Powered by{' '}
            <span className="font-semibold text-cyan-400">Claude AI</span> and{' '}
            <a
              href="https://robosystems.ai/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-cyan-400 hover:text-cyan-300"
            >
              RoboSystems'
            </a>{' '}
            knowledge graph platform
          </p>
          <div className="inline-flex items-center gap-2 rounded-full bg-purple-900/40 px-6 py-3 text-sm text-purple-200">
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
