import FloatingElementsVariant from './FloatingElementsVariant'

// Three steps in the order of the arc: read the books first, the close last. The
// spotlights below carry the detail, so this stays short.
const steps = [
  {
    number: '01',
    title: 'Connect your books',
    description:
      'Link QuickBooks with one-click OAuth, then add one MCP address to Claude, ChatGPT, or any MCP client and sign in. Add the SEC filings connector beside it to compare against public companies.',
    tags: ['QuickBooks', 'MCP', 'SEC filings'],
    color: 'violet',
  },
  {
    number: '02',
    title: 'Ask, share, plan',
    description:
      'Ask why a number moved and open it down to the facts behind it. Send the board a statement that ties, roll a plan forward from your actuals, and see where you stand against peers.',
    tags: ['Live Statements', 'Explorer', 'Plan'],
    color: 'purple',
  },
  {
    number: '03',
    title: 'Approve the close',
    description:
      'When you trust it, the entries arrive drafted and the rule engine checks the period. You review and approve; nothing writes back to QuickBooks until you post an entry.',
    tags: ['Inbox', 'Closing Book', 'Rule Engine'],
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
