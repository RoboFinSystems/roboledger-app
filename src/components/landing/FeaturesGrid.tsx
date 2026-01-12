import FloatingElementsVariant from './FloatingElementsVariant'

export default function FeaturesGrid() {
  return (
    <section
      id="features"
      className="relative overflow-hidden bg-black py-16 sm:py-24"
    >
      <FloatingElementsVariant variant="features" intensity={10} />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2 className="font-heading mb-6 text-3xl font-bold text-white sm:text-4xl md:text-5xl">
            How We Deliver It
          </h2>
          <p className="mx-auto max-w-3xl text-base text-gray-300 sm:text-lg md:text-xl">
            A modern stack purpose-built for financial context graphs and
            AI-native applications.
          </p>
        </div>

        <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
          {/* LadybugDB Engine */}
          <div className="group relative overflow-hidden rounded-2xl border border-gray-800 bg-linear-to-br from-zinc-900 to-orange-950/20 p-5 transition-all duration-300 hover:border-orange-500/50 sm:p-6 md:p-8">
            <div className="absolute inset-0 bg-linear-to-br from-orange-500/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
            <div className="relative">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/20 sm:mb-6 sm:h-14 sm:w-14">
                <svg
                  className="h-7 w-7 text-orange-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
                  />
                </svg>
              </div>
              <h3 className="font-heading mb-3 text-center text-lg font-semibold text-white sm:text-xl">
                LadybugDB Engine
              </h3>
              <p className="mb-4 text-sm text-gray-300 sm:text-base">
                Purpose-built graph database optimized for analytical workloads
                and AI-native applications.
              </p>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-start">
                  <span className="mr-2 text-orange-400">•</span>
                  Columnar storage for fast aggregations
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-orange-400">•</span>
                  Vectorized query execution
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-orange-400">•</span>
                  DuckDB staging for data validation
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-orange-400">•</span>
                  Up to 30GB RAM for premium tiers
                </li>
              </ul>
            </div>
          </div>

          {/* Dagster Orchestration */}
          <div className="group relative overflow-hidden rounded-2xl border border-gray-800 bg-linear-to-br from-zinc-900 to-green-950/20 p-5 transition-all duration-300 hover:border-green-500/50 sm:p-6 md:p-8">
            <div className="absolute inset-0 bg-linear-to-br from-green-500/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
            <div className="relative">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/20 sm:mb-6 sm:h-14 sm:w-14">
                <svg
                  className="h-7 w-7 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </div>
              <h3 className="font-heading mb-3 text-center text-lg font-semibold text-white sm:text-xl">
                Dagster Orchestration
              </h3>
              <p className="mb-4 text-sm text-gray-300 sm:text-base">
                Production-grade data pipelines with scheduling, monitoring, and
                event-driven triggers.
              </p>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-start">
                  <span className="mr-2 text-green-400">•</span>
                  Scheduled and event-driven jobs
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-green-400">•</span>
                  Software-defined assets
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-green-400">•</span>
                  Built-in observability and alerting
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-green-400">•</span>
                  Extensible pipeline architecture
                </li>
              </ul>
            </div>
          </div>

          {/* MCP Protocol */}
          <div className="group relative overflow-hidden rounded-2xl border border-gray-800 bg-linear-to-br from-zinc-900 to-indigo-950/20 p-5 transition-all duration-300 hover:border-indigo-500/50 sm:p-6 md:p-8">
            <div className="absolute inset-0 bg-linear-to-br from-indigo-500/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
            <div className="relative">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/20 sm:mb-6 sm:h-14 sm:w-14">
                <svg
                  className="h-7 w-7 text-indigo-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="font-heading mb-3 text-center text-lg font-semibold text-white sm:text-xl">
                MCP Protocol
              </h3>
              <p className="mb-4 text-sm text-gray-300 sm:text-base">
                Native integration with AI agents through the Model Context
                Protocol standard.
              </p>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-start">
                  <span className="mr-2 text-indigo-400">•</span>
                  Works with Claude, Cursor, Windsurf
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-indigo-400">•</span>
                  Schema discovery and fact exploration
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-indigo-400">•</span>
                  Cypher queries from natural language
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-indigo-400">•</span>
                  Secure API key authentication
                </li>
              </ul>
            </div>
          </div>

          {/* API & SDKs */}
          <div className="group relative overflow-hidden rounded-2xl border border-gray-800 bg-linear-to-br from-zinc-900 to-purple-950/20 p-5 transition-all duration-300 hover:border-purple-500/50 sm:p-6 md:p-8">
            <div className="absolute inset-0 bg-linear-to-br from-purple-500/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
            <div className="relative">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/20 sm:mb-6 sm:h-14 sm:w-14">
                <svg
                  className="h-7 w-7 text-purple-400"
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
              <h3 className="font-heading mb-3 text-center text-lg font-semibold text-white sm:text-xl">
                API & SDKs
              </h3>
              <p className="mb-4 text-sm text-gray-300 sm:text-base">
                Full programmatic access with typed clients for your preferred
                language.
              </p>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-start">
                  <span className="mr-2 text-purple-400">•</span>
                  RESTful API with OpenAPI spec
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-purple-400">•</span>
                  TypeScript SDK with full types
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-purple-400">•</span>
                  Python SDK with async support
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-purple-400">•</span>
                  Streaming responses for large results
                </li>
              </ul>
            </div>
          </div>

          {/* Isolated & Scalable */}
          <div className="group relative overflow-hidden rounded-2xl border border-gray-800 bg-linear-to-br from-zinc-900 to-cyan-950/20 p-5 transition-all duration-300 hover:border-cyan-500/50 sm:p-6 md:p-8">
            <div className="absolute inset-0 bg-linear-to-br from-cyan-500/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
            <div className="relative">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/20 sm:mb-6 sm:h-14 sm:w-14">
                <svg
                  className="h-7 w-7 text-cyan-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
              <h3 className="font-heading mb-3 text-center text-lg font-semibold text-white sm:text-xl">
                Isolated & Scalable
              </h3>
              <p className="mb-4 text-sm text-gray-300 sm:text-base">
                Your data lives in its own graph. Scale from startup to
                enterprise without migration.
              </p>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-start">
                  <span className="mr-2 text-cyan-400">•</span>
                  Dedicated graph per organization
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-cyan-400">•</span>
                  Subgraphs for teams and projects
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-cyan-400">•</span>
                  One-click backup and restore
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-cyan-400">•</span>
                  Upgrade tiers without downtime
                </li>
              </ul>
            </div>
          </div>

          {/* Enterprise Security */}
          <div className="group relative overflow-hidden rounded-2xl border border-gray-800 bg-linear-to-br from-zinc-900 to-red-950/20 p-5 transition-all duration-300 hover:border-red-500/50 sm:p-6 md:p-8">
            <div className="absolute inset-0 bg-linear-to-br from-red-500/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
            <div className="relative">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/20 sm:mb-6 sm:h-14 sm:w-14">
                <svg
                  className="h-7 w-7 text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <h3 className="font-heading mb-3 text-center text-lg font-semibold text-white sm:text-xl">
                Enterprise Security
              </h3>
              <p className="mb-4 text-sm text-gray-300 sm:text-base">
                Bank-grade security for your most sensitive financial data.
              </p>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-start">
                  <span className="mr-2 text-red-400">•</span>
                  Encryption at rest and in transit
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-red-400">•</span>
                  VPC network isolation
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-red-400">•</span>
                  Role-based access control
                </li>
                <li className="flex items-start">
                  <span className="mr-2 text-red-400">•</span>
                  Audit logging and compliance
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
