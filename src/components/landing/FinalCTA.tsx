import Link from 'next/link'

export default function FinalCTA() {
  return (
    <section className="relative overflow-hidden bg-black py-24">
      <div className="absolute inset-0 bg-linear-to-br from-cyan-900/20 via-blue-900/20 to-purple-900/20"></div>
      <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="font-heading mb-6 text-4xl font-bold text-white md:text-5xl">
          Ready for AI-Native Financial Reporting?
        </h2>
        <p className="mb-12 text-xl text-gray-300">
          Experience autonomous report generation powered by Claude AI and
          RoboSystems.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/register"
            className="group relative overflow-hidden rounded-lg bg-linear-to-r from-cyan-500 to-blue-500 px-8 py-4 text-lg font-medium text-white shadow-2xl shadow-cyan-500/25 transition-all duration-300 hover:shadow-cyan-500/40"
          >
            <span className="relative z-10">Get Started Free</span>
            <div className="absolute inset-0 -translate-y-full bg-white/20 transition-transform duration-500 group-hover:translate-y-0"></div>
          </Link>
          <Link
            href="https://github.com/RoboFinSystems/roboledger-app"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-gray-700 bg-zinc-900 px-8 py-4 text-lg font-medium text-white transition-all hover:border-cyan-500/50"
          >
            View on GitHub
          </Link>
        </div>
      </div>
    </section>
  )
}
