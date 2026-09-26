import FloatingElementsVariant from './FloatingElementsVariant'
import LiveDemo from './LiveDemo'

// The contrast is a snapshot against a live ledger: an export keeps the numbers and loses
// the accounting behind them, so every board pack is out of date the day it ships. The demo
// (public/demos/contrast.js) plays a month passing on both sides.

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
            Your board pack is out of date the day you send it
          </h2>
          <p className="mx-auto max-w-3xl text-base text-gray-300 sm:text-lg md:text-xl">
            An export keeps the numbers and loses everything behind them. Keep
            the books on a ledger your AI can query, and the answer is current
            and you can ask why.
          </p>
        </div>

        <div className="mb-12">
          <LiveDemo
            name="contrast"
            aspect={1600 / 720}
            label="A board pack exported on August 3 goes stale over a month while the same numbers stay live in RoboLedger, which then explains why receivables rose."
          />
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
