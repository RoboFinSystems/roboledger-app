'use client'

import { PageHeader } from '@/components/PageHeader'
import {
  clients,
  customTheme,
  GraphFilters,
  PageLayout,
  useGraphContext,
} from '@/lib/core'
import { useSSO } from '@/lib/core/auth-core/sso'
import { Badge, Button, Card, Spinner } from 'flowbite-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { FC } from 'react'
import { useEffect, useMemo, useState } from 'react'
import {
  HiArrowRight,
  HiCollection,
  HiDocumentReport,
  HiExclamationCircle,
  HiHome,
  HiLink,
  HiPlus,
} from 'react-icons/hi'
import { TbReceipt } from 'react-icons/tb'

const quickActions = [
  {
    title: 'Transactions',
    description: 'Journal entries',
    icon: TbReceipt,
    href: '/ledger/transactions',
    iconBg: 'bg-green-100 dark:bg-green-900',
    iconColor: 'text-green-600 dark:text-green-400',
  },
  {
    title: 'Chart of Accounts',
    description: 'Account structure',
    icon: HiCollection,
    href: '/ledger/chart-of-accounts',
    iconBg: 'bg-blue-100 dark:bg-blue-900',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    title: 'Reports',
    description: 'Financial statements',
    icon: HiDocumentReport,
    href: '/reports',
    iconBg: 'bg-amber-100 dark:bg-amber-900',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  {
    title: 'Connections',
    description: 'Data sources & sync',
    icon: HiLink,
    href: '/connections',
    iconBg: 'bg-cyan-100 dark:bg-cyan-900',
    iconColor: 'text-cyan-600 dark:text-cyan-400',
  },
]

const STATUS_COLORS: Record<string, string> = {
  published: 'success',
  generating: 'warning',
  pending: 'gray',
  failed: 'failure',
}

const TX_TYPE_COLORS: Record<string, string> = {
  Revenue: 'success',
  Expense: 'failure',
  Transfer: 'info',
  Adjustment: 'warning',
  Opening: 'purple',
}

const API_URL =
  process.env.NEXT_PUBLIC_ROBOSYSTEMS_API_URL || 'http://localhost:8000'

// Override the default card theme's `justify-center` so content anchors
// to the top when the card is stretched to match a taller sibling.
const topAlignedCardTheme = {
  ...customTheme.card,
  root: {
    ...customTheme.card.root,
    children: customTheme.card.root.children.replace(
      'justify-center',
      'justify-start'
    ),
  },
}

const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)

const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return '—'
  const date = new Date(dateString + 'T00:00:00')
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

interface RecentTransaction {
  id: string
  number: string | null
  type: string
  amount: number
  date: string
  description: string | null
  merchantName: string | null
}

interface RecentReport {
  id: string
  name: string
  periodStart: string | null
  periodEnd: string | null
  generationStatus: string
}

interface HomeStats {
  transactionCount: number | null
  accountCount: number | null
  reportCount: number | null
  recentTransactions: RecentTransaction[]
  recentReports: RecentReport[]
}

const INITIAL_STATS: HomeStats = {
  transactionCount: null,
  accountCount: null,
  reportCount: null,
  recentTransactions: [],
  recentReports: [],
}

const HomePageContent: FC = function () {
  const { state: graphState } = useGraphContext()
  const router = useRouter()
  const { navigateToApp } = useSSO(API_URL)

  const currentGraph = useMemo(() => {
    const roboledgerGraphs = graphState.graphs.filter(GraphFilters.roboledger)
    return (
      roboledgerGraphs.find((g) => g.graphId === graphState.currentGraphId) ??
      roboledgerGraphs[0] ??
      null
    )
  }, [graphState.graphs, graphState.currentGraphId])

  const hasQualifyingGraph = currentGraph != null

  const [stats, setStats] = useState<HomeStats>(INITIAL_STATS)
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (!currentGraph) {
      setStats(INITIAL_STATS)
      return
    }

    let cancelled = false
    const graphId = currentGraph.graphId

    const load = async () => {
      setIsLoading(true)
      setLoadError(null)

      const [txResult, accountResult, reportResult] = await Promise.allSettled([
        clients.ledger.listTransactions(graphId, { limit: 500 }),
        clients.ledger.getAccountTree(graphId),
        clients.ledger.listReports(graphId),
      ])

      if (cancelled) return

      const next: HomeStats = { ...INITIAL_STATS }
      const errors: string[] = []

      if (txResult.status === 'fulfilled' && txResult.value) {
        const rows = txResult.value.transactions ?? []
        next.transactionCount = rows.length
        next.recentTransactions = [...rows]
          .sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          )
          .slice(0, 5)
          .map((row) => ({
            id: row.id,
            number: row.number ?? null,
            type: row.type,
            amount: row.amount,
            date: row.date,
            description: row.description ?? null,
            merchantName: row.merchantName ?? null,
          }))
      } else if (txResult.status === 'rejected') {
        errors.push('transactions')
      }

      if (accountResult.status === 'fulfilled' && accountResult.value) {
        const roots = accountResult.value.roots ?? []
        const countNodes = (
          nodes: Array<{ children?: unknown }> | undefined
        ): number => {
          if (!nodes?.length) return 0
          let total = 0
          for (const node of nodes) {
            total += 1
            total += countNodes(
              (node.children as Array<{ children?: unknown }>) ?? []
            )
          }
          return total
        }
        next.accountCount = countNodes(roots as Array<{ children?: unknown }>)
      } else if (accountResult.status === 'rejected') {
        errors.push('accounts')
      }

      if (reportResult.status === 'fulfilled' && reportResult.value) {
        const reports = reportResult.value
        next.reportCount = reports.length
        next.recentReports = [...reports]
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
          .slice(0, 3)
          .map((r) => ({
            id: r.id,
            name: r.name,
            periodStart: r.periodStart ?? null,
            periodEnd: r.periodEnd ?? null,
            generationStatus: r.generationStatus,
          }))
      } else if (reportResult.status === 'rejected') {
        errors.push('reports')
      }

      if (errors.length === 3) {
        setLoadError('Failed to load ledger data.')
      }

      setStats(next)
      setIsLoading(false)
    }

    load()

    return () => {
      cancelled = true
    }
  }, [currentGraph])

  const formatCount = (value: number | null): string => {
    if (value == null) return isLoading ? '…' : '—'
    return value.toLocaleString('en-US')
  }

  return (
    <PageLayout>
      <PageHeader
        icon={HiHome}
        title={
          currentGraph
            ? `Welcome back to ${currentGraph.graphName}`
            : 'Welcome to RoboLedger'
        }
        description="Your AI-powered financial reporting platform"
      />

      {hasQualifyingGraph ? (
        <>
          {/* Stats Overview */}
          <div className="flex items-center">
            <h3 className="font-heading text-lg font-semibold text-gray-900 dark:text-white">
              Overview
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-6 lg:grid-cols-3">
            <Card theme={customTheme.card}>
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Total Transactions
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCount(stats.transactionCount)}
                </div>
              </div>
            </Card>
            <Card theme={customTheme.card}>
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Active Accounts
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCount(stats.accountCount)}
                </div>
              </div>
            </Card>
            <Card theme={customTheme.card}>
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Reports Generated
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCount(stats.reportCount)}
                </div>
              </div>
            </Card>
          </div>

          {/* Recent activity */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Recent Transactions */}
            <Card theme={topAlignedCardTheme} className="lg:col-span-2">
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TbReceipt className="h-5 w-5 text-gray-400" />
                    <h3 className="font-heading text-lg font-semibold text-gray-900 dark:text-white">
                      Recent Transactions
                    </h3>
                  </div>
                  <Button
                    theme={customTheme.button}
                    size="xs"
                    color="gray"
                    onClick={() => router.push('/ledger/transactions')}
                  >
                    View all
                    <HiArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </div>

                {isLoading && stats.recentTransactions.length === 0 ? (
                  <div className="flex justify-center py-10">
                    <Spinner size="md" />
                  </div>
                ) : stats.recentTransactions.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-8 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No transactions yet.
                    </p>
                    <Button
                      theme={customTheme.button}
                      color="primary"
                      size="xs"
                      onClick={() => router.push('/connections')}
                    >
                      Connect a data source
                    </Button>
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                    {stats.recentTransactions.map((tx) => (
                      <li
                        key={tx.id}
                        className="flex items-center justify-between gap-4 py-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <Badge
                              color={TX_TYPE_COLORS[tx.type] || 'gray'}
                              size="sm"
                            >
                              {tx.type}
                            </Badge>
                            <span className="truncate text-sm font-medium text-gray-900 dark:text-white">
                              {tx.merchantName ||
                                tx.description ||
                                tx.number ||
                                'Transaction'}
                            </span>
                          </div>
                          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {formatDate(tx.date)}
                          </div>
                        </div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(tx.amount)}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Card>

            {/* Recent Reports */}
            <Card theme={topAlignedCardTheme}>
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HiDocumentReport className="h-5 w-5 text-gray-400" />
                    <h3 className="font-heading text-lg font-semibold text-gray-900 dark:text-white">
                      Latest Reports
                    </h3>
                  </div>
                  <Button
                    theme={customTheme.button}
                    size="xs"
                    color="gray"
                    onClick={() => router.push('/reports')}
                  >
                    View all
                    <HiArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </div>

                {isLoading && stats.recentReports.length === 0 ? (
                  <div className="flex justify-center py-10">
                    <Spinner size="md" />
                  </div>
                ) : stats.recentReports.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-8 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No reports yet.
                    </p>
                    <Button
                      theme={customTheme.button}
                      color="primary"
                      size="xs"
                      onClick={() => router.push('/reports')}
                    >
                      Generate a report
                    </Button>
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                    {stats.recentReports.map((report) => (
                      <li key={report.id} className="py-3">
                        <div className="flex items-start justify-between gap-2">
                          <span className="truncate text-sm font-medium text-gray-900 dark:text-white">
                            {report.name}
                          </span>
                          <Badge
                            color={
                              STATUS_COLORS[report.generationStatus] || 'gray'
                            }
                            size="sm"
                          >
                            {report.generationStatus}
                          </Badge>
                        </div>
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(report.periodStart)} —{' '}
                          {formatDate(report.periodEnd)}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Card>
          </div>

          {loadError && (
            <div className="flex items-center gap-2 text-sm text-red-500">
              <HiExclamationCircle className="h-4 w-4" />
              {loadError}
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex items-center">
            <h3 className="font-heading text-lg font-semibold text-gray-900 dark:text-white">
              Quick Actions
            </h3>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {quickActions.map((action) => (
              <Link
                key={action.title}
                href={action.href}
                className="flex items-center gap-4 rounded-lg border border-zinc-200 bg-white/80 p-6 text-left shadow-lg backdrop-blur-sm transition-all hover:scale-[1.02] hover:border-zinc-300 hover:shadow-xl dark:border-zinc-700 dark:bg-zinc-950 dark:hover:border-zinc-500"
              >
                <div className={`rounded-lg ${action.iconBg} p-3`}>
                  <action.icon className={`h-6 w-6 ${action.iconColor}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {action.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {action.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </>
      ) : (
        <div className="space-y-6">
          <Card
            theme={customTheme.card}
            className="transition-shadow hover:shadow-lg"
          >
            <div className="space-y-4 p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-100 p-3 dark:bg-blue-900">
                  <HiLink className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-heading text-xl font-bold text-gray-900 dark:text-white">
                  Connect QuickBooks to Get Started
                </h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                RoboLedger connects to your QuickBooks account to import your
                chart of accounts, journal entries, and financial data. Create a
                graph to get started.
              </p>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-green-500">&#10003;</span>
                  <span>
                    Sync your QuickBooks chart of accounts and journal entries
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500">&#10003;</span>
                  <span>
                    Generate financial reports like balance sheets and income
                    statements
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500">&#10003;</span>
                  <span>
                    Map accounts to US-GAAP taxonomy elements for XBRL reporting
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500">&#10003;</span>
                  <span>
                    AI-powered analysis of your financial data via Console
                  </span>
                </li>
              </ul>
              <Button
                theme={customTheme.button}
                color="primary"
                onClick={() => navigateToApp('robosystems', '/graphs/new')}
                className="w-full"
                size="lg"
              >
                <HiPlus className="mr-2 h-5 w-5" />
                Create Graph
              </Button>
            </div>
          </Card>
        </div>
      )}
    </PageLayout>
  )
}

export default HomePageContent
