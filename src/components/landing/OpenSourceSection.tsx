export default function OpenSourceSection() {
  return (
    <section id="opensource" className="relative bg-zinc-950 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2 className="font-heading mb-6 text-3xl font-bold text-white sm:text-4xl md:text-5xl">
            Open Source & Self-Hosted
          </h2>
          <p className="mx-auto max-w-3xl text-base text-gray-300 sm:text-lg md:text-xl">
            RoboLedger is completely open source. Clone and run locally for
            development, or deploy to your own infrastructure. Connects to the
            RoboSystems platform.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Local Development */}
          <div className="rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-900/20 to-purple-900/20 p-6 md:p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-purple-600">
                <svg
                  className="h-6 w-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                  />
                </svg>
              </div>
              <h3 className="font-heading text-2xl font-bold text-white">
                Local Development
              </h3>
            </div>

            <p className="mb-6 text-gray-300">
              Clone the repository and run locally with npm. Requires a running
              RoboSystems instance (cloud or self-hosted).
            </p>

            <div className="space-y-4">
              <div className="rounded-lg bg-zinc-900 p-4">
                <h4 className="mb-3 text-sm font-semibold text-violet-300">
                  Quick Start
                </h4>
                <pre className="overflow-x-auto text-xs text-gray-300">
                  <code>{`# Clone and install
git clone https://github.com/RoboFinSystems/roboledger-app
cd roboledger-app
npm install

# Run development server
npm run dev

# Access at http://localhost:3001`}</code>
                </pre>
              </div>

              <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-4">
                <div className="flex items-start gap-2">
                  <svg
                    className="mt-0.5 h-5 w-5 shrink-0 text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div className="text-sm text-green-300">
                    <div className="mb-1 font-semibold">
                      Requires RoboSystems
                    </div>
                    <p className="text-green-400/80">
                      RoboLedger is a frontend that connects to the RoboSystems
                      API. You'll need a RoboSystems instance running (cloud or
                      local).
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <a
                  href="https://github.com/RoboFinSystems/roboledger-app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-violet-700"
                >
                  <svg
                    className="h-4 w-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                  View on GitHub
                </a>
                <a
                  href="https://hub.docker.com/r/robofinsystems/roboledger-app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-violet-600 px-4 py-2 text-sm font-medium text-violet-400 transition-all hover:bg-violet-600/10"
                >
                  <svg
                    className="h-4 w-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M13.983 11.078h2.119a.186.186 0 00.186-.185V9.006a.186.186 0 00-.186-.186h-2.119a.185.185 0 00-.185.185v1.888c0 .102.083.185.185.185m-2.954-5.43h2.118a.186.186 0 00.186-.186V3.574a.186.186 0 00-.186-.185h-2.118a.185.185 0 00-.185.185v1.888c0 .102.082.185.185.186m0 2.716h2.118a.187.187 0 00.186-.186V6.29a.186.186 0 00-.186-.185h-2.118a.185.185 0 00-.185.185v1.887c0 .102.082.185.185.186m-2.93 0h2.12a.186.186 0 00.184-.186V6.29a.185.185 0 00-.185-.185H8.1a.185.185 0 00-.185.185v1.887c0 .102.083.185.185.186m-2.964 0h2.119a.186.186 0 00.185-.186V6.29a.185.185 0 00-.185-.185H5.136a.186.186 0 00-.186.185v1.887c0 .102.084.185.186.186m5.893 2.715h2.118a.186.186 0 00.186-.185V9.006a.186.186 0 00-.186-.186h-2.118a.185.185 0 00-.185.185v1.888c0 .102.082.185.185.185m-2.93 0h2.12a.185.185 0 00.184-.185V9.006a.185.185 0 00-.184-.186h-2.12a.185.185 0 00-.184.185v1.888c0 .102.083.185.185.185m-2.964 0h2.119a.185.185 0 00.185-.185V9.006a.185.185 0 00-.185-.186h-2.119a.185.185 0 00-.186.185v1.888c0 .102.084.185.186.185m-2.92 0h2.12a.185.185 0 00.184-.185V9.006a.185.185 0 00-.184-.186h-2.12a.186.186 0 00-.186.185v1.888c0 .102.084.185.186.185M23.763 9.89c-.065-.051-.672-.51-1.954-.51-.338.001-.676.03-1.01.087-.248-1.7-1.653-2.53-1.716-2.566l-.344-.199-.226.327c-.284.438-.49.922-.612 1.43-.23.97-.09 1.882.403 2.661-.595.332-1.55.413-1.744.42H.751a.751.751 0 00-.75.748 11.376 11.376 0 00.692 4.062c.545 1.428 1.355 2.48 2.41 3.124 1.18.723 3.1 1.137 5.275 1.137.983.003 1.963-.086 2.93-.266a12.248 12.248 0 003.823-1.389c.98-.567 1.86-1.288 2.61-2.136 1.252-1.418 1.998-2.997 2.553-4.4h.221c1.372 0 2.215-.549 2.68-1.009.309-.293.55-.65.707-1.046l.098-.288z" />
                  </svg>
                  View on Docker Hub
                </a>
              </div>
            </div>
          </div>

          {/* Why Open Source */}
          <div className="rounded-2xl border border-gray-800 bg-gradient-to-br from-zinc-900 to-green-950/20 p-6 md:p-8">
            <h3 className="font-heading mb-6 text-2xl font-bold text-white">
              Why Open Source?
            </h3>
            <ul className="space-y-4 text-gray-300">
              <li className="flex items-start gap-3">
                <svg
                  className="h-6 w-6 shrink-0 text-green-400"
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
                  <strong className="text-white">Data Privacy</strong>
                  <p className="mt-1 text-sm text-gray-400">
                    Self-host both RoboLedger and RoboSystems on your own
                    infrastructure. Your financial data never leaves your
                    control.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <svg
                  className="h-6 w-6 shrink-0 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                <div>
                  <strong className="text-white">
                    Transparency & Security
                  </strong>
                  <p className="mt-1 text-sm text-gray-400">
                    Inspect every line of code. Know exactly how your accounting
                    data is processed and stored.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <svg
                  className="h-6 w-6 shrink-0 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"
                  />
                </svg>
                <div>
                  <strong className="text-white">Customization</strong>
                  <p className="mt-1 text-sm text-gray-400">
                    Fork and modify to fit your exact needs. Add custom reports,
                    integrations, or features.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <svg
                  className="h-6 w-6 shrink-0 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <div>
                  <strong className="text-white">Community Driven</strong>
                  <p className="mt-1 text-sm text-gray-400">
                    Contribute features, report issues, and help shape the
                    future of AI-native accounting.
                  </p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Development Info */}
        <div className="mt-8 rounded-2xl border border-gray-800 bg-gradient-to-r from-zinc-900 to-purple-950/20 p-6 md:p-8">
          <div className="mx-auto max-w-4xl">
            <h3 className="font-heading mb-4 text-center text-xl font-semibold text-white sm:text-2xl">
              Built with Modern Web Technologies
            </h3>
            <p className="mb-6 text-center text-gray-300">
              RoboLedger is a Next.js application that connects to the
              RoboSystems Knowledge Graph platform
            </p>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border border-gray-800 bg-zinc-900 p-4 text-center">
                <div className="text-2xl font-bold text-violet-400">
                  Next.js
                </div>
                <div className="text-sm text-gray-400">React Framework</div>
              </div>
              <div className="rounded-lg border border-gray-800 bg-zinc-900 p-4 text-center">
                <div className="text-2xl font-bold text-purple-400">
                  TypeScript
                </div>
                <div className="text-sm text-gray-400">Type Safety</div>
              </div>
              <div className="rounded-lg border border-gray-800 bg-zinc-900 p-4 text-center">
                <div className="text-2xl font-bold text-purple-400">
                  Tailwind
                </div>
                <div className="text-sm text-gray-400">Styling</div>
              </div>
              <div className="rounded-lg border border-gray-800 bg-zinc-900 p-4 text-center">
                <div className="text-2xl font-bold text-green-400">
                  Flowbite
                </div>
                <div className="text-sm text-gray-400">Design System</div>
              </div>
            </div>

            <div className="mt-6 flex justify-center gap-4">
              <a
                href="https://github.com/RoboFinSystems/roboledger-app/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-zinc-700 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-zinc-600"
              >
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
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Report Issues
              </a>
              <a
                href="https://github.com/RoboFinSystems/roboledger-app/fork"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-gray-700 px-4 py-2 text-sm font-medium text-gray-300 transition-all hover:bg-zinc-800"
              >
                Fork & Contribute
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
