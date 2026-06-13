import FloatingElementsVariant from './FloatingElementsVariant'

export default function OutputFormats() {
  const formats = [
    {
      icon: (
        <svg
          className="h-8 w-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
      ),
      title: 'Formatted Statement',
      description:
        'Traditional financial statement layout with proper formatting',
      color: 'from-primary-500 to-secondary-500',
      badge: 'Current',
    },
    {
      icon: (
        <svg
          className="h-8 w-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
      title: 'Interactive Dashboard',
      description:
        'Visual charts, graphs, and KPI widgets for executive review',
      color: 'from-secondary-500 to-pink-500',
      badge: 'Coming Soon',
    },
    {
      icon: (
        <svg
          className="h-8 w-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
      title: 'JSON-LD Bundle',
      description:
        'Structured linked-data export of every fact, dimension, and period',
      color: 'from-green-500 to-emerald-500',
      badge: 'Current',
    },
    {
      icon: (
        <svg
          className="h-8 w-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
          />
        </svg>
      ),
      title: 'Variance Analysis',
      description: 'Period-over-period comparisons with waterfall charts',
      color: 'from-orange-500 to-red-500',
      badge: 'Coming Soon',
    },
    {
      icon: (
        <svg
          className="h-8 w-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
          />
        </svg>
      ),
      title: 'AI Narrative',
      description: 'Executive summary with natural language explanations',
      color: 'from-secondary-500 to-primary-500',
      badge: 'Coming Soon',
    },
    {
      icon: (
        <svg
          className="h-8 w-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
      title: 'XBRL 2.1 Package',
      description: 'SEC-ready instance with Arelle-validated taxonomy tagging',
      color: 'from-indigo-500 to-secondary-500',
      badge: 'Current',
    },
  ]

  return (
    <section className="relative bg-zinc-950 py-16 sm:py-24">
      <FloatingElementsVariant variant="output-formats" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2 className="font-heading mb-6 text-3xl font-bold text-white sm:text-4xl md:text-5xl">
            One Report, Infinite Views
          </h2>
          <p className="mx-auto max-w-3xl text-base text-gray-300 sm:text-lg md:text-xl">
            Build your fact grid once, then generate any presentation format you
            need. The same validated data, presented differently for each
            audience.
          </p>
        </div>

        {/* Central Fact Grid */}
        <div className="relative mb-16">
          <div className="border-primary-500/50 from-primary-900/30 to-secondary-900/30 mx-auto max-w-2xl rounded-2xl border-2 bg-gradient-to-br p-8">
            <div className="mb-4 text-center">
              <div className="bg-primary-500/20 text-primary-300 inline-flex items-center gap-2 rounded-full px-4 py-1 text-sm font-semibold">
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
                    d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
                  />
                </svg>
                Fact Grid Foundation
              </div>
            </div>
            <h3 className="mb-4 text-center text-2xl font-bold text-white">
              Your Financial Data
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg bg-black/30 px-4 py-3">
                <span className="text-sm text-gray-300">
                  127 Financial Facts
                </span>
                <span className="text-primary-400 font-mono text-xs">
                  validated
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-black/30 px-4 py-3">
                <span className="text-sm text-gray-300">4 Dimensions</span>
                <span className="text-primary-400 font-mono text-xs">
                  configured
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-black/30 px-4 py-3">
                <span className="text-sm text-gray-300">XBRL US-GAAP</span>
                <span className="text-primary-400 font-mono text-xs">
                  compliant
                </span>
              </div>
            </div>
          </div>

          {/* Connecting Lines */}
          <div className="from-primary-500/50 absolute top-full left-1/2 h-12 w-0.5 -translate-x-1/2 bg-gradient-to-b to-transparent"></div>
        </div>

        {/* Output Formats Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {formats.map((format, idx) => (
            <div
              key={idx}
              className="group relative overflow-hidden rounded-2xl border border-gray-800 bg-gradient-to-br from-zinc-900 to-black p-6 transition-all hover:border-gray-700"
            >
              {format.badge && format.badge == 'Coming Soon' && (
                <div className="absolute top-4 right-4">
                  <span className="rounded-full bg-amber-500/20 px-2 py-1 text-xs font-semibold text-amber-400">
                    {format.badge}
                  </span>
                </div>
              )}

              <div
                className={`mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br ${format.color} p-0.5`}
              >
                <div className="flex h-full w-full items-center justify-center rounded-xl bg-black text-white">
                  {format.icon}
                </div>
              </div>

              <h3 className="mb-2 text-lg font-semibold text-white">
                {format.title}
              </h3>
              <p className="text-sm text-gray-400">{format.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-gray-700 bg-zinc-900 px-6 py-3 text-sm text-gray-300">
            <svg
              className="text-primary-400 h-5 w-5"
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
            Build once in the Report Creator, export to any format your audience
            needs
          </div>
        </div>
      </div>
    </section>
  )
}
