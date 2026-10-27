// The first band under the hero: the trust line that lets a stranger start with no risk,
// then the group (gtm/plan.md §1), then the lineage that makes a figure checkable. Each
// line is true at HEAD and can be shown on the Driftline demo; the close is further down
// the page, where the story puts it.
const stats = [
  {
    stat: 'Nothing writes back',
    label:
      'Nothing reaches QuickBooks until you post an entry. Read, analyze and plan first.',
  },
  {
    stat: 'Consolidated, not combined',
    label:
      "Eliminations, an outside owner's share and equity-method companies, drafted from each company's own books.",
  },
  {
    stat: 'Every figure opens',
    label:
      'Click a number on a statement or report and see the accounts it was summed from, down to the register.',
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
