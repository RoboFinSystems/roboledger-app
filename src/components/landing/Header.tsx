import Image from 'next/image'
import Link from 'next/link'

export default function Header() {
  return (
    <header className="fixed top-0 z-50 w-full border-b border-gray-800 bg-black/80 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Image
              src="/images/logos/roboledger.png"
              alt="RoboLedger"
              width={40}
              height={40}
              className="rounded-lg"
            />
            <span className="font-heading text-xl font-semibold text-white sm:text-2xl">
              RoboLedger
            </span>
          </div>

          <nav className="hidden items-center gap-6 md:flex">
            <Link
              href="#features"
              className="text-sm font-medium text-gray-300 transition-colors hover:text-white"
            >
              Features
            </Link>
            <Link
              href="#ai-reporting"
              className="text-sm font-medium text-gray-300 transition-colors hover:text-white"
            >
              AI Reporting
            </Link>
            <Link
              href="#platform"
              className="text-sm font-medium text-gray-300 transition-colors hover:text-white"
            >
              Platform
            </Link>
            <Link
              href="/login"
              className="text-sm font-medium text-gray-300 transition-colors hover:text-white"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-cyan-700"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}
