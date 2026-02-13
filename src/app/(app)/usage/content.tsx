'use client'

import { customTheme, useGraphContext, useIsRepository } from '@/lib/core'
import type { GraphInfo } from '@robosystems/client'
import {
  getCreditSummary,
  getGraphLimits,
  getGraphs,
  getStorageUsage,
  listCreditTransactions,
} from '@robosystems/client'
import { Alert, Badge, Button, Card, Progress, Spinner } from 'flowbite-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  HiChartBar,
  HiClock,
  HiCurrencyDollar,
  HiDatabase,
  HiExclamationCircle,
  HiRefresh,
  HiServer,
  HiTerminal,
  HiTrendingUp,
} from 'react-icons/hi'

interface CreditSummary {
  current_balance: number
  monthly_allocation: number
  consumed_this_month: number
  usage_percentage: number
  transaction_count: number
  graph_tier: string
}

interface StorageUsage {
  current_usage_gb: number
  max_storage_gb: number
  storage_cost_per_day?: number
}

interface GraphLimits {
  subscription_tier: string
  graph_tier: string
  is_shared_repository: boolean
  storage: {
    current_usage_gb: number
    max_storage_gb: number
    approaching_limit: boolean
  }
  queries: {
    concurrent_queries: number
    max_rows_per_query: number
    max_timeout_seconds: number
    chunk_size: number
  }
  rate_limits: {
    requests_per_minute: number
    requests_per_hour: number
    burst_capacity: number
  }
  credits?: {
    current_balance: number
    monthly_ai_credits: number
    storage_billing_enabled: boolean
    storage_rate_per_gb_per_day: number
  }
}

interface CreditTransaction {
  id: string
  amount: number
  transaction_type: string
  description: string
  created_at: string
}

interface UsageData {
  graphInfo: GraphInfo
  creditSummary?: CreditSummary
  storageUsage?: StorageUsage
  graphLimits?: GraphLimits
  recentTransactions?: CreditTransaction[]
}

export function UsageContent() {
  const router = useRouter()
  const { state: graphState } = useGraphContext()
  const graphId = graphState.currentGraphId
  const { isRepository } = useIsRepository()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<UsageData | null>(null)

  useEffect(() => {
    if (graphId) {
      fetchUsageData()
    } else {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graphId])

  const fetchUsageData = async () => {
    setLoading(true)
    setError(null)

    try {
      // Get basic graph info
      const graphsResponse = await getGraphs()
      const graphInfo = graphsResponse.data?.graphs?.find(
        (g: GraphInfo) => g.graphId === graphId
      )

      if (!graphInfo) {
        setError('Graph or repository not found')
        setLoading(false)
        return
      }

      const usageData: UsageData = { graphInfo }

      // Determine if this is a repository
      const isRepo = graphInfo.isRepository

      // Fetch all usage data in parallel (skip storage for repositories)
      const apiCalls = [
        getGraphLimits({ path: { graph_id: graphId } }),
        getCreditSummary({ path: { graph_id: graphId } }),
        listCreditTransactions({
          path: { graph_id: graphId },
          query: { limit: 10 },
        }),
      ]

      // Only fetch storage for user graphs, not repositories
      if (!isRepo) {
        apiCalls.splice(
          2,
          0,
          getStorageUsage({ path: { graph_id: graphId } }) as any
        )
      }

      const results = await Promise.allSettled(apiCalls)

      const [limitsRes, creditRes, storageRes, transactionsRes] = isRepo
        ? [results[0], results[1], { status: 'rejected' as const }, results[2]]
        : [results[0], results[1], results[2], results[3]]

      // Process limits
      if (limitsRes.status === 'fulfilled' && limitsRes.value.data) {
        usageData.graphLimits = limitsRes.value.data as unknown as GraphLimits
      }

      // Process credits (available for both graphs and repositories)
      if (creditRes.status === 'fulfilled' && creditRes.value.data) {
        usageData.creditSummary = creditRes.value
          .data as unknown as CreditSummary
      }

      // Process storage
      if (storageRes.status === 'fulfilled' && storageRes.value.data) {
        usageData.storageUsage = storageRes.value
          .data as unknown as StorageUsage
      }

      // Process transactions
      if (
        transactionsRes.status === 'fulfilled' &&
        transactionsRes.value.data
      ) {
        const txData = transactionsRes.value.data as any
        usageData.recentTransactions = txData.transactions || []
      }

      setData(usageData)
    } catch (err) {
      console.error('Failed to fetch usage data:', err)
      setError('Failed to load usage data')
    } finally {
      setLoading(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <Spinner size="xl" />
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              Loading usage data...
            </p>
          </div>
        </div>
      </div>
    )
  }

  // No graph selected
  if (!graphId) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold text-gray-900 dark:text-white">
              Usage
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              View usage and analytics
            </p>
          </div>
        </div>

        <Card theme={customTheme.card}>
          <div className="py-12 text-center">
            <HiChartBar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              No graph selected
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Please select a graph or repository to view usage data.
            </p>
            <div className="mt-6">
              <Button onClick={() => router.push('/home')}>Select Graph</Button>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  // Error state
  if (error || !data) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold text-gray-900 dark:text-white">
              Usage
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              View usage and analytics
            </p>
          </div>
        </div>

        <Alert color="failure" icon={HiExclamationCircle}>
          <span className="font-medium">Error loading usage data</span>
          <p className="mt-1 text-sm">{error || 'No data available'}</p>
        </Alert>

        <div className="flex gap-4">
          <Button onClick={fetchUsageData}>
            <HiRefresh className="mr-2 h-4 w-4" />
            Retry
          </Button>
          <Button color="gray" onClick={() => router.push('/home')}>
            Go to Home
          </Button>
        </div>
      </div>
    )
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0,
    }).format(num)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'red'
    if (percentage >= 75) return 'yellow'
    return 'blue'
  }

  const formatTransactionType = (type: string) => {
    // Convert from API format (e.g., "CONSUMPTION", "ALLOCATION", "PURCHASE")
    // to display format (e.g., "Consumption", "Allocation", "Purchase")
    if (!type) return 'Unknown'
    return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()
  }

  const getTransactionTypeColor = (type: string) => {
    if (!type) return 'gray'
    const normalizedType = type.toUpperCase()
    if (normalizedType === 'PURCHASE' || normalizedType === 'ALLOCATION') {
      return 'success'
    }
    if (normalizedType === 'CONSUMPTION') {
      return 'gray'
    }
    return 'info'
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 p-3">
            <HiChartBar className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="font-heading text-3xl font-bold text-gray-900 dark:text-white">
              Usage & Credits
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Monitor credit consumption and activity
            </p>
          </div>
        </div>
        {isRepository && (
          <div className="flex flex-wrap gap-2">
            <Badge color="info">Shared Repository</Badge>
          </div>
        )}
      </div>

      {/* Credit Balance - For both graphs and repositories */}
      {data.creditSummary && (
        <Card theme={customTheme.card}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading text-lg font-semibold text-gray-900 dark:text-white">
                {isRepository ? 'Repository Credits' : 'Credit Balance'}
              </h3>
              {!isRepository && (
                <Button
                  size="sm"
                  color="gray"
                  onClick={() => router.push('/billing')}
                >
                  <HiCurrencyDollar className="mr-2 h-4 w-4" />
                  Buy Credits
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Current Balance */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <HiCurrencyDollar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Current Balance
                  </span>
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {formatNumber(data.creditSummary.current_balance)}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  credits available
                </p>
              </div>

              {/* Monthly Allocation */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <HiTrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Monthly Usage
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      {formatNumber(data.creditSummary.consumed_this_month)} of{' '}
                      {formatNumber(data.creditSummary.monthly_allocation)} used
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {data.creditSummary.usage_percentage.toFixed(1)}%
                    </span>
                  </div>
                  <Progress
                    progress={data.creditSummary.usage_percentage}
                    size="lg"
                    color={getProgressColor(
                      data.creditSummary.usage_percentage
                    )}
                  />
                </div>
              </div>
            </div>

            {data.creditSummary.usage_percentage >= 75 && (
              <Alert
                color={
                  data.creditSummary.usage_percentage >= 90
                    ? 'failure'
                    : 'warning'
                }
              >
                <span className="font-medium">
                  {data.creditSummary.usage_percentage >= 90
                    ? 'Credit allocation nearly exhausted'
                    : 'High credit usage this month'}
                </span>
                <p className="mt-1 text-sm">
                  You've used {data.creditSummary.usage_percentage.toFixed(1)}%
                  of your monthly allocation. Consider purchasing additional
                  credits or upgrading your plan.
                </p>
              </Alert>
            )}
          </div>
        </Card>
      )}

      {/* Storage Usage - Only for user graphs, not repositories */}
      {!isRepository && data.graphLimits && (
        <Card theme={customTheme.card}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading text-lg font-semibold text-gray-900 dark:text-white">
                Storage Usage
              </h3>
              <Badge color="gray">Included in plan</Badge>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  {data.graphLimits.storage.current_usage_gb.toFixed(2)} GB of{' '}
                  {formatNumber(data.graphLimits.storage.max_storage_gb)} GB
                  used
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {(
                    (data.graphLimits.storage.current_usage_gb /
                      data.graphLimits.storage.max_storage_gb) *
                    100
                  ).toFixed(1)}
                  %
                </span>
              </div>
              <Progress
                progress={
                  (data.graphLimits.storage.current_usage_gb /
                    data.graphLimits.storage.max_storage_gb) *
                  100
                }
                size="lg"
                color={
                  data.graphLimits.storage.approaching_limit ? 'yellow' : 'blue'
                }
              />
            </div>

            <div className="rounded-lg bg-gray-50 p-4 dark:bg-zinc-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Storage
                  </p>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                    Included in your subscription — no credit cost
                  </p>
                </div>
                <HiDatabase className="h-8 w-8 text-gray-400" />
              </div>
            </div>

            {data.graphLimits.storage.approaching_limit && (
              <Alert color="warning" icon={HiExclamationCircle}>
                <span className="font-medium">Approaching storage limit</span>
                <p className="mt-1 text-sm">
                  You're nearing your storage capacity. Consider cleaning up old
                  data or upgrading to a higher tier.
                </p>
              </Alert>
            )}
          </div>
        </Card>
      )}

      {/* Graph Limits & Quotas */}
      {data.graphLimits && (
        <Card theme={customTheme.card}>
          <h3 className="font-heading mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            {isRepository ? 'Repository' : 'Graph'} Limits & Quotas
          </h3>
          <div
            className={`grid grid-cols-1 gap-6 ${isRepository ? 'md:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-3'}`}
          >
            {/* Query Limits */}
            <div className="rounded-lg bg-gray-50 p-4 dark:bg-zinc-800">
              <div className="mb-3 flex items-center gap-2">
                <HiServer className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <h4 className="font-medium text-gray-900 dark:text-white">
                  Query Limits
                </h4>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Max Rows
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatNumber(data.graphLimits.queries.max_rows_per_query)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Timeout
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {data.graphLimits.queries.max_timeout_seconds}s
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Concurrent
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {data.graphLimits.queries.concurrent_queries}
                  </span>
                </div>
              </div>
            </div>

            {/* Rate Limits */}
            <div className="rounded-lg bg-gray-50 p-4 dark:bg-zinc-800">
              <div className="mb-3 flex items-center gap-2">
                <HiClock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <h4 className="font-medium text-gray-900 dark:text-white">
                  Rate Limits
                </h4>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Per Minute
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {data.graphLimits.rate_limits.requests_per_minute}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Per Hour
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatNumber(
                      data.graphLimits.rate_limits.requests_per_hour
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">
                    Burst
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {data.graphLimits.rate_limits.burst_capacity}
                  </span>
                </div>
              </div>
            </div>

            {/* Tier Information - only show for user graphs, not shared repositories */}
            {!isRepository && (
              <div className="rounded-lg bg-gray-50 p-4 dark:bg-zinc-800">
                <div className="mb-3 flex items-center gap-2">
                  <HiTrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    Subscription
                  </h4>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Tier
                    </span>
                    <Badge color="purple">
                      {data.graphLimits.subscription_tier}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Graph Type
                    </span>
                    <Badge color="gray">{data.graphLimits.graph_tier}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Access
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      Full
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Recent Transactions */}
      {data.recentTransactions && data.recentTransactions.length > 0 && (
        <Card theme={customTheme.card}>
          <div className="mb-4">
            <h3 className="font-heading text-lg font-semibold text-gray-900 dark:text-white">
              Recent Credit Transactions
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200 dark:border-gray-700">
                <tr className="text-left">
                  <th className="pb-3 font-medium text-gray-700 dark:text-gray-300">
                    Date
                  </th>
                  <th className="pb-3 font-medium text-gray-700 dark:text-gray-300">
                    Description
                  </th>
                  <th className="pb-3 text-right font-medium text-gray-700 dark:text-gray-300">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {data.recentTransactions.slice(0, 5).map((tx) => (
                  <tr key={tx.id}>
                    <td className="py-3 text-gray-600 dark:text-gray-400">
                      {formatDate(tx.created_at)}
                    </td>
                    <td className="py-3 text-gray-900 dark:text-white">
                      {tx.description}
                    </td>
                    <td
                      className={`py-3 text-right font-medium ${
                        tx.amount > 0
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {tx.amount > 0 ? '+' : ''}
                      {formatNumber(tx.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card
          theme={customTheme.card}
          className="cursor-pointer transition-shadow hover:shadow-lg"
          onClick={() => router.push('/console')}
        >
          <div className="flex items-center gap-4 p-2">
            <div className="rounded-lg bg-blue-100 p-3 dark:bg-blue-900">
              <HiTerminal className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Query Console
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Execute queries and explore data
              </p>
            </div>
          </div>
        </Card>

        {!isRepository && (
          <Card
            theme={customTheme.card}
            className="cursor-pointer transition-shadow hover:shadow-lg"
            onClick={() => router.push('/billing')}
          >
            <div className="flex items-center gap-4 p-2">
              <div className="rounded-lg bg-green-100 p-3 dark:bg-green-900">
                <HiCurrencyDollar className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Billing & Credits
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Manage your credit balance
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
