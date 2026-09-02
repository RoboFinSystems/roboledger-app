import FloatingElementsVariant from './FloatingElementsVariant'

// The contrast is the export chain against the ledger (the argument of the first
// roboledger.ai post): every spreadsheet step starts from an export that keeps the numbers
// and throws away the accounting. The right column follows the arc, with the close as one
// step near the end, not the headline.
const traditional = [
  {
    title: 'Export the trial balance',
    body: 'Every question starts with a fresh export. The numbers come across; the accounts, periods and provenance do not.',
  },
  {
    title: 'Build mapping tables',
    body: 'Manual account-to-line-item mapping in Excel that breaks every time the chart of accounts changes.',
  },
  {
    title: 'Reconcile the formulas',
    body: 'Hunt for #REF! errors, fix broken links, reconcile totals, adjust for every new account.',
  },
  {
    title: 'Publish a snapshot',
    body: 'Lock cells, save as PDF, and hope nothing changed since you started. Next month, start over.',
  },
]

const aiNative = [
  {
    title: 'Events flow in',
    body: 'QuickBooks syncs and manual entries arrive as typed business events, on a graph Claude can query. No spreadsheet plumbing.',
  },
  {
    title: 'Ask, share, plan',
    body: 'Ask why gross margin moved, share a statement that ties, roll a plan off your actuals, and compare your numbers to public filers.',
  },
  {
    title: 'Approve, then close',
    body: 'Claude triages each event in the inbox; nothing writes back until you post an entry. When you trust it, schedules and the rule engine carry the close.',
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
            Off the export chain
          </div>
          <h2 className="font-heading mb-6 text-3xl font-bold text-white sm:text-4xl md:text-5xl">
            The end of spreadsheet hell
          </h2>
          <p className="mx-auto max-w-3xl text-base text-gray-300 sm:text-lg md:text-xl">
            Every export keeps the numbers and throws away the accounting. Put
            the books on a ledger Claude can query and the exports stop.
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
                The export chain
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
                Result: a photograph of your books
              </div>
              <p className="mt-1 text-xs text-gray-400">
                Every answer is a snapshot, and the next question starts from a
                new export
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
                Result: a ledger you can ask
              </div>
              <p className="mt-1 text-xs text-gray-400">
                Every statement, plan and comparison runs off the same synced
                events, validated before it ships
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
            Validated every step of the way, and nothing writes back until you
            post an entry
          </div>
        </div>
      </div>
    </section>
  )
}
