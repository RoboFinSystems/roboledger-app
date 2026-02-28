import Image from 'next/image'
import { useState } from 'react'
import {
  HiChevronDown,
  HiDatabase,
  HiMenu,
  HiMoon,
  HiUser,
  HiViewGrid,
} from 'react-icons/hi'

export default function GraphDashboard() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [selectedGraph, setSelectedGraph] = useState({
    name: 'RFS LLC',
    id: 'kg9c3d6',
    isRepository: false,
  })

  const graphs = [
    {
      name: 'RFS LLC',
      id: 'kg9c3d6',
      isRepository: false,
    },
    {
      name: 'SEC EDGAR Filings',
      id: 'sec',
      isRepository: true,
    },
  ]

  return (
    <div className="mb-12 overflow-hidden rounded-2xl border border-gray-800 bg-black shadow-2xl">
      <div className="relative bg-black">
        {/* Top Navigation Bar */}
        <div className="flex h-14 items-center justify-between border-b border-gray-800 bg-black px-4">
          <div className="flex items-center gap-4">
            <button className="text-gray-400 hover:text-white">
              <HiMenu className="h-6 w-6" />
            </button>
            <div className="flex items-center gap-2">
              <Image
                src="/images/logos/robosystems.png"
                alt="RoboSystems"
                width={32}
                height={32}
              />
              <span className="font-heading text-xl font-semibold text-white">
                RoboSystems
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative hidden md:block">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 rounded-lg bg-zinc-800 px-3 py-1.5 text-sm text-white hover:bg-zinc-700"
              >
                <HiDatabase className="h-4 w-4" />
                <span>{selectedGraph.name}</span>
                <HiChevronDown
                  className={`h-4 w-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {isDropdownOpen && (
                <div className="absolute top-full right-0 mt-2 w-64 rounded-lg border border-gray-700 bg-zinc-800 py-1 shadow-xl">
                  {graphs.map((graph) => (
                    <button
                      key={graph.id}
                      onClick={() => {
                        setSelectedGraph(graph)
                        setIsDropdownOpen(false)
                      }}
                      className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-zinc-700"
                    >
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                          graph.isRepository
                            ? 'bg-purple-600/20'
                            : 'bg-blue-600/20'
                        }`}
                      >
                        <HiDatabase
                          className={`h-4 w-4 ${
                            graph.isRepository
                              ? 'text-purple-400'
                              : 'text-blue-400'
                          }`}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-white">
                          {graph.name}
                        </div>
                        <div className="truncate text-xs text-gray-400">
                          {graph.id.slice(0, 10)}
                        </div>
                      </div>
                      {selectedGraph.id === graph.id && (
                        <div className="h-2 w-2 rounded-full bg-green-400" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button className="rounded-lg p-2 text-gray-400 hover:bg-zinc-800 hover:text-white">
              <HiMoon className="h-5 w-5" />
            </button>
            <button className="rounded-lg p-2 text-gray-400 hover:bg-zinc-800 hover:text-white">
              <HiViewGrid className="h-5 w-5" />
            </button>
            <button className="rounded-lg p-2 text-gray-400 hover:bg-zinc-800 hover:text-white">
              <HiUser className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Platform Interface */}
        <div className="flex h-[550px]">
          {/* Sidebar */}
          <div className="w-48 border-r border-gray-800 bg-zinc-950 p-4 lg:w-64">
            <div className="mb-4 rounded-lg bg-zinc-900 px-3 py-2">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <HiDatabase className="h-4 w-4" />
                <span>My Organization</span>
              </div>
            </div>

            {/* Navigation Items */}
            <nav className="space-y-1">
              {[
                {
                  icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
                  label: 'Home',
                  active: true,
                },
                {
                  icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z',
                  label: 'Dashboard',
                },
                {
                  icon: 'M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
                  label: 'Console',
                },
                {
                  icon: 'M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z',
                  label: 'Data Lake',
                },
                {
                  icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4',
                  label: 'Schema',
                },
                {
                  icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
                  label: 'Subgraphs',
                },
                {
                  icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4',
                  label: 'Backups',
                },
                {
                  icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
                  label: 'Usage',
                },
                {
                  icon: 'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9',
                  label: 'Repositories',
                },
                {
                  icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
                  label: 'Billing',
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className={`px-3 py-2 text-sm ${
                    item.active
                      ? 'rounded-lg bg-zinc-800 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
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
                        d={item.icon}
                      />
                    </svg>
                    {item.label}
                  </div>
                </div>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 bg-black p-6">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="font-heading text-2xl font-bold text-white">
                  Graphs & Repositories
                </h2>
                <p className="mt-1 text-xs text-gray-400">
                  Manage your graphs and access shared repositories
                </p>
              </div>
              <div className="hidden gap-2 md:flex">
                <button className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-700">
                  <span className="mr-1.5">🌐</span>
                  Browse Repositories
                </button>
                <button className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700">
                  + Create Graph
                </button>
              </div>
            </div>

            {/* Graph Table */}
            <GraphTable />
          </div>
        </div>
      </div>
    </div>
  )
}

function GraphTable() {
  const items = [
    {
      name: 'RFS LLC',
      id: 'kg9c3d6',
      status: 'Active',
      date: '8/19/2025',
      isRepository: false,
    },
    {
      name: 'SEC EDGAR Filings',
      id: 'sec',
      status: 'Inactive',
      date: '1/15/2025',
      isRepository: true,
    },
  ]

  return (
    <div className="rounded-xl border border-gray-800 bg-zinc-900/50 p-4 md:p-6">
      {/* Desktop headers */}
      <div className="mb-4 hidden gap-4 text-xs font-medium tracking-wider text-gray-500 uppercase lg:grid lg:grid-cols-2 xl:grid-cols-3">
        <div>Graph / Repository</div>
        <div className="hidden xl:block">Status</div>
        <div className="text-right">Actions</div>
      </div>

      <div className="space-y-3">
        {items.map((item, idx) => (
          <div key={idx} className="rounded-lg bg-zinc-800/50 p-3 md:p-4">
            {/* Desktop layout */}
            <div className="hidden items-center gap-4 lg:grid lg:grid-cols-2 xl:grid-cols-3">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                      item.isRepository ? 'bg-purple-600/20' : 'bg-blue-600/20'
                    }`}
                  >
                    <svg
                      className={`h-5 w-5 ${
                        item.isRepository ? 'text-purple-400' : 'text-blue-400'
                      }`}
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
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-white">
                      {item.name}
                    </div>
                    <div className="truncate text-xs text-gray-400">
                      {item.id.slice(0, 10)}
                    </div>
                  </div>
                </div>
                <div className="xl:hidden">
                  <span
                    className={`inline-flex rounded-md px-2.5 py-1 text-xs font-medium ${
                      item.status === 'Active'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-gray-500/20 text-gray-400'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              </div>

              <div className="hidden xl:block">
                <span
                  className={`inline-flex rounded-md px-2.5 py-1 text-xs font-medium ${
                    item.status === 'Active'
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-gray-500/20 text-gray-400'
                  }`}
                >
                  {item.status}
                </span>
              </div>

              <div className="flex justify-end gap-2">
                <button className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700">
                  <svg
                    className="h-3.5 w-3.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                  </svg>
                  Open
                </button>
                <button className="flex items-center gap-1.5 rounded-lg bg-zinc-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-600">
                  <svg
                    className="h-3.5 w-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  Console
                </button>
                <button className="flex items-center gap-1.5 rounded-lg bg-zinc-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-600">
                  <svg
                    className="h-3.5 w-3.5"
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
                  Usage
                </button>
              </div>
            </div>

            {/* Mobile layout */}
            <div className="space-y-3 lg:hidden">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                      item.isRepository ? 'bg-purple-600/20' : 'bg-blue-600/20'
                    }`}
                  >
                    <svg
                      className={`h-5 w-5 ${
                        item.isRepository ? 'text-purple-400' : 'text-blue-400'
                      }`}
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
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-white">
                      {item.name}
                    </div>
                    <div className="truncate text-xs text-gray-400">
                      {item.id.slice(0, 10)}
                    </div>
                  </div>
                </div>
                <span
                  className={`hidden shrink-0 rounded-md px-2.5 py-1 text-xs font-medium xs:block${
                    item.status === 'Active'
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-gray-500/20 text-gray-400'
                  }`}
                >
                  {item.status}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                <button className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700">
                  <svg
                    className="h-3.5 w-3.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                  </svg>
                  Open
                </button>
                <button className="flex items-center gap-1.5 rounded-lg bg-zinc-700 px-3 py-2 text-xs font-medium text-white hover:bg-zinc-600">
                  <svg
                    className="h-3.5 w-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  Console
                </button>
                <button className="flex items-center gap-1.5 rounded-lg bg-zinc-700 px-3 py-2 text-xs font-medium text-white hover:bg-zinc-600">
                  <svg
                    className="h-3.5 w-3.5"
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
                  Usage
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
