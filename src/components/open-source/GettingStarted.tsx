import FloatingElementsVariant from '@/components/landing/FloatingElementsVariant'

export default function GettingStarted() {
  return (
    <section className="relative overflow-hidden bg-linear-to-b from-black to-zinc-900 py-16 sm:py-20">
      <FloatingElementsVariant variant="os-getting-started" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="font-heading mb-4 text-3xl font-bold text-white sm:text-4xl">
            Get Started with RoboSystems
          </h2>
          <p className="mx-auto max-w-3xl text-gray-400">
            Clone the repository and run the complete stack locally or deploy to
            AWS
          </p>
        </div>

        {/* Quick Start */}
        <div className="group mb-12 overflow-hidden rounded-2xl border border-gray-800 bg-linear-to-br from-zinc-900 to-cyan-950/20 transition-all hover:border-cyan-500/50">
          <div className="p-8">
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-600 to-blue-600">
                <svg
                  className="h-10 w-10 text-white"
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
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">
                  Quick Start - Docker Development Environment
                </h3>
                <p className="text-gray-400">
                  Complete stack with all services configured
                </p>
              </div>
            </div>

            <p className="mb-6 text-gray-300">
              The recommended way to run RoboSystems. Includes PostgreSQL with
              automatic migrations, graph database, Valkey message broker, and
              all development services pre-configured.
            </p>

            <div className="rounded-xl bg-black/50 p-4">
              <pre className="overflow-x-auto text-sm text-gray-300">
                <code>{`# Clone the repository
git clone https://github.com/RoboFinSystems/robosystems.git
cd robosystems

# Install uv (Python package and version manager)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Install just (command runner)
uv tool install rust-just
uv tool update-shell  # Adds ~/.local/bin to PATH (restart terminal after)

# Start all services via Docker Compose
just start

# Services available at:
# API: http://localhost:8000
# Docs: http://localhost:8000/docs`}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
