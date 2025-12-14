export default function FeaturesSection() {
  const features = [
    {
      icon: (
        <svg
          className="h-6 w-6"
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
      title: 'QuickBooks Integration',
      description:
        'Sync your existing accounting data from QuickBooks into your knowledge graph',
      color: 'cyan',
    },
    {
      icon: (
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
          />
        </svg>
      ),
      title: 'Plaid Bank Feeds',
      description:
        'Direct bank account integration for real-time transaction data',
      color: 'blue',
    },
    {
      icon: (
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
      ),
      title: 'Chart of Accounts',
      description:
        'Full chart of accounts with journal entries and AI-assisted categorization',
      color: 'purple',
    },
    {
      icon: (
        <svg
          className="h-6 w-6"
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
      title: 'Financial Reports',
      description:
        'Create custom report templates and share digital financial statements',
      color: 'green',
    },
    {
      icon: (
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          />
        </svg>
      ),
      title: 'AI-Powered Analysis',
      description:
        'Natural language queries, automated classification, and anomaly detection',
      color: 'orange',
    },
    {
      icon: (
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      ),
      title: 'Knowledge Graph',
      description:
        'Semantic relationships between accounts, transactions, and reports',
      color: 'pink',
    },
  ]

  const colorClasses = {
    cyan: 'from-cyan-500/20 to-blue-500/20 border-cyan-500/30 hover:border-cyan-500/50 text-cyan-400',
    blue: 'from-blue-500/20 to-purple-500/20 border-blue-500/30 hover:border-blue-500/50 text-blue-400',
    purple:
      'from-purple-500/20 to-pink-500/20 border-purple-500/30 hover:border-purple-500/50 text-purple-400',
    green:
      'from-green-500/20 to-emerald-500/20 border-green-500/30 hover:border-green-500/50 text-green-400',
    orange:
      'from-orange-500/20 to-red-500/20 border-orange-500/30 hover:border-orange-500/50 text-orange-400',
    pink: 'from-pink-500/20 to-purple-500/20 border-pink-500/30 hover:border-pink-500/50 text-pink-400',
  }

  return (
    <section id="features" className="relative bg-zinc-950 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2 className="font-heading mb-6 text-3xl font-bold text-white sm:text-4xl md:text-5xl">
            Complete Accounting Platform
          </h2>
          <p className="mx-auto max-w-3xl text-base text-gray-300 sm:text-lg md:text-xl">
            Everything you need for modern financial management, powered by a
            knowledge graph that AI agents can understand and reason over
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br p-6 transition-all duration-300 ${colorClasses[feature.color as keyof typeof colorClasses]}`}
            >
              <div
                className={`mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-${feature.color}-500/20`}
              >
                {feature.icon}
              </div>
              <h3 className="mb-2 text-lg font-semibold text-white">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
