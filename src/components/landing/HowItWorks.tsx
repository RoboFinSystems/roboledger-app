import FloatingElementsVariant from './FloatingElementsVariant'

// Three steps in the order of the arc: set the group up, read the books, the close last.
// Only the group parent's QuickBooks company connects (gtm/plan.md §5): the other companies
// come in through a bank feed, an opening balance sheet, the API or a file. The spotlights
// below carry the detail, so this stays short.
const steps = [
  {
    number: '01',
    title: 'Set up the group',
    description:
      "Add each company with the share the parent holds. Connect the parent's QuickBooks, give the others a bank feed and their opening balance sheet, then add one MCP address to Claude, ChatGPT, or any MCP client.",
    tags: ['QuickBooks', 'Bank feeds', 'MCP'],
    color: 'violet',
  },
  {
    number: '02',
    title: 'Ask, share, plan',
    description:
      'Ask why a number moved and open it down to the account register. Send the board a statement that ties, roll a plan forward from your actuals, and add the SEC filings beside your books to see where you stand against public companies.',
    tags: ['Live Statements', 'Explorer', 'Plan'],
    color: 'purple',
  },
  {
    number: '03',
    title: 'Close each company, then the group',
    description:
      'Bank lines arrive with a suggested account, schedules draft their entries, and the close waits on the reconciliations you choose. Then your AI drafts the consolidating entries and the group close posts them. Nothing writes back to QuickBooks until you post an entry.',
    tags: ['Inbox', 'Reconciliations', 'Group close'],
    color: 'pink',
  },
]

const colorClasses: Record<
  string,
  { border: string; bg: string; number: string; tag: string }
> = {
  violet: {
    border: 'border-primary-500/30',
    bg: 'from-primary-500/10',
    number: 'text-primary-400',
    tag: 'bg-primary-950/50 text-primary-300',
  },
  purple: {
    border: 'border-secondary-500/30',
    bg: 'from-secondary-500/10',
    number: 'text-secondary-400',
    tag: 'bg-secondary-950/50 text-secondary-300',
  },
  pink: {
    border: 'border-pink-500/30',
    bg: 'from-pink-500/10',
    number: 'text-pink-400',
    tag: 'bg-pink-950/50 text-pink-300',
  },
}

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="relative bg-linear-to-b from-black to-zinc-900 py-16 sm:py-24"
    >
      <FloatingElementsVariant variant="features" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <div className="bg-primary-500/20 text-primary-400 mb-4 inline-block rounded-full px-4 py-1 text-sm font-semibold">
            How it works
          </div>
          <h2 className="font-heading mb-6 text-3xl font-bold text-white sm:text-4xl md:text-5xl">
            Start with the answers. The close comes last.
          </h2>
          <p className="mx-auto max-w-3xl text-base text-gray-300 sm:text-lg md:text-xl">
            Reading your books writes nothing back, so you can put RoboLedger to
            work on questions today and hand it the close once you trust it.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {steps.map((step) => {
            const c = colorClasses[step.color]
            return (
              <div
                key={step.number}
                className={`rounded-2xl border ${c.border} bg-linear-to-br ${c.bg} to-zinc-900 p-6`}
              >
                <div
                  className={`mb-1 text-4xl font-extrabold ${c.number} opacity-40`}
                >
                  {step.number}
                </div>
                <h3 className="mb-2 text-xl font-bold text-white">
                  {step.title}
                </h3>
                <p className="mb-4 text-sm leading-relaxed text-gray-400">
                  {step.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {step.tags.map((tag) => (
                    <span
                      key={tag}
                      className={`rounded-full px-3 py-1 text-xs font-medium ${c.tag}`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
