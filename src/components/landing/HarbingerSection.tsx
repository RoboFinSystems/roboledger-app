import { HARBINGER_URL } from './constants'
import FloatingElementsVariant from './FloatingElementsVariant'

// Harbinger FinLab implements RoboLedger and trains the people who will operate it, human
// in the loop from the AI chat they already use. Setup is a screenshare with them at the
// keyboard; it never signs in to or runs a customer's books (its MSA, 2.2 and 4.1).
// The doors and their wording follow harbinger.finance, which carries the argument
// (vault: specs/distribution/harbinger-enablement-positioning.md).
// The old managed-service wording is listed in __tests__/retired-phrases.test.ts, which
// fails if it comes back.
const points = [
  {
    title: 'Practices: fractional CFOs, bookkeepers & firms',
    body: 'Run RoboLedger across your whole client book. We walk you through the first client on a screenshare and train your staff; your clients stay yours.',
  },
  {
    title: 'Finance teams',
    body: 'Your people set up RoboLedger with us on a screenshare, then we train them to run it. No controller yet? We’ll point you to a practice that runs RoboLedger.',
  },
  {
    title: 'Investors',
    body: 'Each company keeps its own books on RoboLedger, run by its own accountant, and its filed reports land in your graph as data, not PDFs. The investor side is early, and we say so.',
  },
  {
    title: 'Never the pen',
    body: 'Nobody from Harbinger posts, approves or closes a period on your books, or signs in to them. Sign-off is yours, by name.',
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
                Implementation & training
              </div>
              <h2 className="font-heading mb-4 text-3xl font-bold text-white sm:text-4xl">
                Your people run it. Harbinger trains them.
              </h2>
              <p className="mb-6 text-base leading-relaxed text-gray-300">
                <strong className="text-white">Harbinger FinLab</strong>{' '}
                implements RoboLedger and trains the people who’ll work in it
                every day: your own accountant, or the fractional CFO or
                bookkeeper you work with, and their staff. They work from the AI
                chat they already use. AI drafts, they approve, and they do
                every step. It starts with a live demo, at no cost.
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
