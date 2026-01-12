import FloatingElementsVariant from '@/components/landing/FloatingElementsVariant'
import Footer from '@/components/landing/Footer'
import Header from '@/components/landing/Header'
import AiIntegrationMcp from '@/components/open-source/AiIntegrationMcp'
import AwsInfrastructure from '@/components/open-source/AwsInfrastructure'
import BootstrapGuide from '@/components/open-source/BootstrapGuide'
import ClientLibraries from '@/components/open-source/ClientLibraries'
import GettingStarted from '@/components/open-source/GettingStarted'
import SecXbrlPipeline from '@/components/open-source/SecXbrlPipeline'

export default function OpenSourceContent() {
  return (
    <div className="min-h-screen bg-black">
      <Header />

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-black pt-32 pb-16 sm:pt-40 sm:pb-24">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-linear-to-br from-cyan-900/20 via-blue-900/20 to-purple-900/20"></div>
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-20"></div>
          </div>

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="font-heading mb-6 text-4xl font-bold text-white sm:text-5xl md:text-6xl">
                Open Source RoboSystems
              </h1>
              <p className="mx-auto max-w-3xl text-lg text-gray-300 sm:text-xl">
                Build powerful financial analysis tools with SEC filings, graph
                databases, and AI integration. Deploy locally or to AWS with
                complete infrastructure automation.
              </p>
            </div>
          </div>
        </section>

        <GettingStarted />

        {/* Use Cases Section */}
        <section className="relative overflow-hidden bg-black py-16 sm:py-20">
          <FloatingElementsVariant variant="os-use-cases" />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 text-center">
              <h2 className="font-heading mb-4 text-3xl font-bold text-white sm:text-4xl">
                Powerful Use Cases
              </h2>
              <p className="mx-auto max-w-3xl text-gray-400">
                From SEC financial analysis to AI-powered insights, build
                sophisticated financial applications with RoboSystems
              </p>
            </div>

            <SecXbrlPipeline />
            <AiIntegrationMcp />
          </div>
        </section>

        <ClientLibraries />
        <AwsInfrastructure />
        <BootstrapGuide />

        {/* CTA Section */}
        <section className="relative overflow-hidden bg-linear-to-b from-black via-zinc-950 to-black py-16">
          <FloatingElementsVariant variant="final" intensity={15} />
          <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="font-heading mb-4 text-3xl font-bold text-white">
              Ready to Create Your Own Financial Knowledge Graph?
            </h2>
            <p className="mb-8 text-lg text-gray-400">
              Get started building your own financial knowledge graph today with
              our open source platform - on your laptop or in the cloud.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <a
                href="https://github.com/RoboFinSystems/robosystems"
                className="flex items-center gap-2 rounded-lg bg-linear-to-r from-cyan-500 to-blue-500 px-8 py-3 font-medium text-white transition-all hover:shadow-lg hover:shadow-cyan-500/25"
              >
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    fillRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    clipRule="evenodd"
                  />
                </svg>
                Clone Repo
              </a>
              <a
                href="https://github.com/RoboFinSystems/robosystems/wiki"
                className="flex items-center gap-2 rounded-lg border border-gray-700 bg-zinc-800 px-8 py-3 font-medium text-white transition-all hover:bg-zinc-700"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
                Wiki
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
