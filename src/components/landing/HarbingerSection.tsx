import { HARBINGER_URL } from './constants'
import FloatingElementsVariant from './FloatingElementsVariant'

const points = [
  {
    title: 'Co-sourced close & controllership',
    body: 'AI drafts, a human controller signs off — an accounting team embedded in your close.',
  },
  {
    title: 'Deploy in your own cloud (BYOC)',
    body: 'Your VPC, your data, your control — the same open platform, run where you want it.',
  },
  {
    title: 'Custom integrations & frameworks',
    body: 'Bespoke adapters, reporting frameworks, and managed operations tailored to your business.',
  },
  {
    title: 'Outcome-based retainers',
    body: 'Priced to results — never billable hours.',
  },
]

export default function HarbingerSection() {
  return (
    <section
      id="harbinger"
      className="relative overflow-hidden bg-black py-16 sm:py-24"
    >
      <div className="from-secondary-900/20 via-primary-900/10 absolute inset-0 bg-linear-to-br to-black"></div>
      <FloatingElementsVariant variant="platform" />
      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-gray-800 bg-linear-to-br from-zinc-900 to-black p-8 sm:p-12">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="bg-secondary-500/15 text-secondary-300 mb-4 inline-block rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase">
                Done for you
              </div>
              <h2 className="font-heading mb-4 text-3xl font-bold text-white sm:text-4xl">
                Rather have experts run it for you?
              </h2>
              <p className="mb-6 text-base leading-relaxed text-gray-300">
                RoboLedger is the self-serve product — connect your books and
                close with AI yourself. If you'd rather a team of accountants
                embed and run your close for you, on the same open platform,
                that's <strong className="text-white">Harbinger FinLab</strong>.
              </p>
              <a
                href={HARBINGER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="from-secondary-500 to-primary-500 shadow-secondary-500/25 hover:shadow-secondary-500/40 inline-flex items-center gap-2 rounded-lg bg-linear-to-r px-6 py-3 text-base font-medium text-white shadow-xl transition-all duration-300"
              >
                Meet Harbinger FinLab
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </a>
            </div>

            <div className="space-y-3">
              {points.map((p) => (
                <div
                  key={p.title}
                  className="rounded-xl border border-gray-800 bg-zinc-900/50 p-4"
                >
                  <div className="flex items-start gap-3">
                    <svg
                      className="text-secondary-400 mt-0.5 h-5 w-5 shrink-0"
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
                    <div>
                      <div className="text-sm font-semibold text-white">
                        {p.title}
                      </div>
                      <p className="mt-0.5 text-sm text-gray-400">{p.body}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
