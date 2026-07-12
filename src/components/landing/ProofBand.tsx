const stats = [
  {
    stat: 'Hours, not days',
    label:
      'Close the period on an event-driven ledger instead of a 5–10 day spreadsheet grind',
  },
  {
    stat: 'Every txn triaged',
    label:
      'Claude pre-classifies each transaction in the inbox — you approve, reject, or run on autopilot',
  },
  {
    stat: 'XBRL 2.1 + JSON-LD',
    label:
      'Validated statements export in filing-ready formats, straight from your ledger',
  },
]

export default function ProofBand() {
  return (
    <section className="relative border-y border-gray-800/80 bg-zinc-950">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-3">
          {stats.map((s) => (
            <div key={s.stat} className="text-center sm:text-left">
              <div className="from-primary-400 via-secondary-400 to-accent-400 font-heading bg-linear-to-r bg-clip-text text-2xl font-bold text-transparent sm:text-3xl">
                {s.stat}
              </div>
              <p className="mt-2 text-sm text-gray-400">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
