'use client'

import { PageHeader } from '@/components/PageHeader'
import {
  customTheme,
  GraphFilters,
  PageLayout,
  useGraphContext,
} from '@/lib/core'
import { Button, Card } from 'flowbite-react'
import { useRouter } from 'next/navigation'
import type { FC } from 'react'
import { useMemo } from 'react'
import {
  HiChartBar,
  HiCollection,
  HiDocumentReport,
  HiHome,
  HiLink,
  HiPlus,
} from 'react-icons/hi'
import { TbReceipt } from 'react-icons/tb'

const quickActions = [
  {
    title: 'Transactions',
    description: 'View and manage journal entries',
    icon: TbReceipt,
    href: '/ledger/transactions',
    gradient: 'from-green-500 to-teal-600',
  },
  {
    title: 'Chart of Accounts',
    description: 'Manage your account structure',
    icon: HiCollection,
    href: '/ledger/chart-of-accounts',
    gradient: 'from-blue-500 to-cyan-600',
  },
  {
    title: 'Reports',
    description: 'Financial statements and analysis',
    icon: HiDocumentReport,
    href: '/reports',
    gradient: 'from-orange-500 to-red-600',
  },
  {
    title: 'Connections',
    description: 'Manage data sources and integrations',
    icon: HiLink,
    href: '/connections',
    gradient: 'from-cyan-500 to-blue-600',
  },
]

const HomePageContent: FC = function () {
  const { state: graphState } = useGraphContext()
  const router = useRouter()

  const hasQualifyingGraph = useMemo(
    () => graphState.graphs.filter(GraphFilters.roboledger).length > 0,
    [graphState.graphs]
  )

  return (
    <PageLayout>
      <PageHeader
        icon={HiHome}
        title="Welcome to RoboLedger"
        description="Your AI-powered financial reporting platform"
      />

      {hasQualifyingGraph ? (
        <>
          {/* Quick Actions */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action) => (
              <a key={action.title} href={action.href} className="block">
                <Card
                  theme={customTheme.card}
                  className="h-full transition-shadow hover:shadow-lg"
                >
                  <div className="flex h-full flex-col justify-center gap-4 p-6">
                    <div className="flex items-center gap-3">
                      <div
                        className={`rounded-lg bg-gradient-to-br ${action.gradient} p-3`}
                      >
                        <action.icon className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="font-heading text-lg font-bold text-gray-900 dark:text-white">
                        {action.title}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {action.description}
                    </p>
                  </div>
                </Card>
              </a>
            ))}
          </div>

          {/* Stats Overview */}
          <div className="grid gap-6 md:grid-cols-3">
            <Card theme={customTheme.card}>
              <div className="space-y-2 p-6">
                <div className="flex items-center gap-2">
                  <HiChartBar className="h-5 w-5 text-gray-400" />
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Total Transactions
                  </span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  --
                </div>
              </div>
            </Card>
            <Card theme={customTheme.card}>
              <div className="space-y-2 p-6">
                <div className="flex items-center gap-2">
                  <HiCollection className="h-5 w-5 text-gray-400" />
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Active Accounts
                  </span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  --
                </div>
              </div>
            </Card>
            <Card theme={customTheme.card}>
              <div className="space-y-2 p-6">
                <div className="flex items-center gap-2">
                  <HiDocumentReport className="h-5 w-5 text-gray-400" />
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Reports Generated
                  </span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  --
                </div>
              </div>
            </Card>
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
                onClick={() => router.push('/graphs/new')}
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
