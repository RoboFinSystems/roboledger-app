import { GITHUB_URL, HARBINGER_URL } from './constants'

const points = [
  {
    title: 'Open source',
    body: 'Apache-2.0. Inspect every line — see exactly how each number is produced.',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
      />
    ),
  },
  {
    title: 'You own your data',
    body: 'Your books, your graph. Nothing locked in a vendor black box.',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
      />
    ),
  },
  {
    title: 'No lock-in',
    body: 'Fork it and take it in-house whenever you want.',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
      />
    ),
  },
]

export default function OpenSourceStrip() {
  return (
    <section className="relative bg-zinc-950 py-16 sm:py-20">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <h2 className="font-heading mb-3 text-2xl font-bold text-white sm:text-3xl">
            Open by default
          </h2>
          <p className="mx-auto max-w-2xl text-sm text-gray-400 sm:text-base">
            RoboLedger is open source and built so you're never trapped.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {points.map((p) => (
            <div
              key={p.title}
              className="rounded-2xl border border-gray-800 bg-linear-to-br from-zinc-900 to-black p-6"
            >
              <div className="bg-primary-500/15 mb-4 flex h-11 w-11 items-center justify-center rounded-lg">
                <svg
                  className="text-primary-400 h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {p.icon}
                </svg>
              </div>
              <h3 className="mb-1.5 font-semibold text-white">{p.title}</h3>
              <p className="text-sm text-gray-400">{p.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col items-center justify-center gap-4 text-sm sm:flex-row sm:gap-8">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary-400 inline-flex items-center gap-2 text-gray-300 transition-colors"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            View on GitHub
          </a>
          <span className="hidden text-gray-700 sm:inline">·</span>
          <span className="text-gray-500">
            Want it hosted, or deployed in your own cloud?{' '}
            <a
              href={HARBINGER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-400 hover:text-primary-300 font-medium"
            >
              Harbinger FinLab →
            </a>
          </span>
        </div>
      </div>
    </section>
  )
}
