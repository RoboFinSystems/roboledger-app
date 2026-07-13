import FloatingElementsVariant from './FloatingElementsVariant'

const traditional = [
  {
    title: 'Build mapping tables',
    body: 'VLOOKUP hell: manual account-to-line-item mapping in Excel that breaks every time the chart of accounts changes.',
  },
  {
    title: 'Extract & transform',
    body: 'Export the trial balance, copy/paste into templates, and pray the formulas still work.',
  },
  {
    title: 'Manual reconciliation',
    body: 'Hunt for #REF! errors, fix broken formulas, reconcile totals, adjust for every new account.',
  },
  {
    title: 'Publish & pray',
    body: 'Lock cells, save as PDF, and hope nothing changed since you started.',
  },
]

const aiNative = [
  {
    title: 'Events flow in',
    body: 'QuickBooks syncs and manual entries arrive as typed business events — no spreadsheet plumbing.',
  },
  {
    title: 'AI triages',
    body: 'Claude pre-classifies each event in the inbox — approve in one click, reject, or enable autopilot for trusted sources.',
  },
  {
    title: 'Guided close',
    body: 'Schedules post depreciation & prepaid entries to draft; the rule engine validates before you lock.',
  },
  {
    title: 'Publish & file',
    body: 'Generate statements, export XBRL, and share to stakeholder publish lists.',
  },
]

export default function ContrastSection() {
  return (
    <section
      id="why"
      className="relative bg-linear-to-b from-zinc-900 to-black py-16 sm:py-24"
    >
      <FloatingElementsVariant variant="features" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <div className="bg-primary-500/20 text-primary-400 mb-4 inline-block rounded-full px-4 py-1 text-sm font-semibold">
            A new way to close the books
          </div>
          <h2 className="font-heading mb-6 text-3xl font-bold text-white sm:text-4xl md:text-5xl">
            The end of spreadsheet hell
          </h2>
          <p className="mx-auto max-w-3xl text-base text-gray-300 sm:text-lg md:text-xl">
            Move from manual, error-prone bookkeeping to an event-driven,
            AI-assisted close — the same job, a fraction of the time.
          </p>
        </div>

        <div className="mb-12 grid gap-8 lg:grid-cols-2">
          {/* Traditional */}
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
                Traditional close
              </h3>
            </div>
            <div className="space-y-4">
              {traditional.map((s, i) => (
                <div key={s.title} className="flex items-start gap-3">
                  <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-500/20 text-sm font-semibold text-red-400">
                    {i + 1}
                  </div>
                  <div>
                    <div className="font-semibold text-white">{s.title}</div>
                    <p className="text-sm text-gray-400">{s.body}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-lg bg-red-950/50 p-4">
              <div className="text-sm font-semibold text-red-400">
                Result: 5–10 days
              </div>
              <p className="mt-1 text-xs text-gray-400">
                Manual work, error-prone, time-consuming
              </p>
            </div>
          </div>

          {/* AI-native */}
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
                AI-native RoboLedger
              </h3>
            </div>
            <div className="space-y-4">
              {aiNative.map((s, i) => (
                <div key={s.title} className="flex items-start gap-3">
                  <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500/20 text-sm font-semibold text-green-400">
                    {i + 1}
                  </div>
                  <div>
                    <div className="font-semibold text-white">{s.title}</div>
                    <p className="text-sm text-gray-400">{s.body}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-lg bg-green-950/50 p-4">
              <div className="text-sm font-semibold text-green-400">
                Result: hours, not days
              </div>
              <p className="mt-1 text-xs text-gray-400">
                Automated intelligence, validated accuracy, continuous close
              </p>
            </div>
          </div>
        </div>

        <div className="text-center">
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
            10x faster close — validated every step of the way
          </div>
        </div>
      </div>
    </section>
  )
}
