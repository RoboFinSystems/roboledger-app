import Image from 'next/image'
import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-gray-800 bg-zinc-950">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-5 lg:gap-6">
          <div className="md:col-span-2">
            <div className="mb-4 flex items-center gap-2">
              <Image
                src="/images/logos/roboledger.png"
                alt="RoboLedger"
                width={32}
                height={32}
                className="rounded-lg"
              />
              <span className="font-heading text-xl font-semibold text-white">
                RoboLedger
              </span>
            </div>
            <p className="mb-4 max-w-md text-sm text-gray-400">
              AI-native financial reporting powered by the RoboSystems knowledge
              graph platform. Transform natural language into validated
              financial statements.
            </p>
            <div className="flex gap-4">
              <Link
                href="https://github.com/RoboFinSystems"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 transition-colors hover:text-white"
              >
                <svg
                  className="h-6 w-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              </Link>
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold tracking-wider text-gray-400 uppercase">
              Product
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="#features"
                  className="text-gray-400 transition-colors hover:text-white"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link
                  href="#ai-reporting"
                  className="text-gray-400 transition-colors hover:text-white"
                >
                  AI Reporting
                </Link>
              </li>
              <li>
                <Link
                  href="#platform"
                  className="text-gray-400 transition-colors hover:text-white"
                >
                  Platform
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold tracking-wider text-gray-400 uppercase">
              Applications
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="https://robosystems.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 transition-colors hover:text-white"
                >
                  RoboSystems
                </Link>
              </li>
              <li>
                <Link
                  href="https://roboledger.ai"
                  className="text-gray-400 transition-colors hover:text-white"
                >
                  RoboLedger
                </Link>
              </li>
              <li>
                <Link
                  href="https://roboinvestor.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 transition-colors hover:text-white"
                >
                  RoboInvestor
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold tracking-wider text-gray-400 uppercase">
              Company
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="https://robosystems.ai/blog"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 transition-colors hover:text-white"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  href="/pages/privacy"
                  className="text-gray-400 transition-colors hover:text-white"
                >
                  Privacy
                </Link>
              </li>
              <li>
                <Link
                  href="/pages/terms"
                  className="text-gray-400 transition-colors hover:text-white"
                >
                  Terms
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} RFS LLC. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
