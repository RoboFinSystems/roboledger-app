'use client'

import { PageHeader } from '@/components/PageHeader'
import { customTheme, PageLayout } from '@/lib/core'
import { Card } from 'flowbite-react'
import type { FC } from 'react'
import {
  HiChartBar,
  HiCollection,
  HiDocumentReport,
  HiHome,
  HiLink,
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
  return (
    <PageLayout>
      <PageHeader
        icon={HiHome}
        title="Welcome to RoboLedger"
        description="Your AI-powered financial reporting platform"
      />

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
    </PageLayout>
  )
}

export default HomePageContent
