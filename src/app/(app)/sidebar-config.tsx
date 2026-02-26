'use client'

import type { SidebarItemData } from '@/lib/core'
import { HiHome, HiOutlineOfficeBuilding, HiTerminal } from 'react-icons/hi'
import { MdOutlineAccountBalanceWallet } from 'react-icons/md'
import { TbReportAnalytics } from 'react-icons/tb'

/**
 * Get navigation items based on whether a qualifying roboledger graph exists.
 * Graph-dependent items are hidden when no qualifying graph is available.
 */
export const getNavigationItems = (
  hasQualifyingGraph: boolean
): SidebarItemData[] => {
  const baseItems: SidebarItemData[] = [
    {
      icon: HiHome,
      label: 'Home',
      href: '/home',
    },
  ]

  const graphDependentItems: SidebarItemData[] = hasQualifyingGraph
    ? [
        {
          icon: HiOutlineOfficeBuilding,
          label: 'Entity',
          items: [
            { href: '/entity', label: 'Entity Info' },
            { href: '/entities', label: 'All Entities' },
            { href: '/connections', label: 'Connections' },
          ],
        },
        {
          icon: MdOutlineAccountBalanceWallet,
          label: 'Ledger',
          items: [
            { href: '/ledger/chart-of-accounts', label: 'Chart of Accounts' },
            { href: '/ledger/account-mappings', label: 'Account Mappings' },
            { href: '/ledger/transactions', label: 'Transactions' },
            { href: '/ledger/trial-balance', label: 'Trial Balance' },
          ],
        },
        {
          icon: TbReportAnalytics,
          label: 'Reports',
          items: [
            { href: '/reports', label: 'View Reports' },
            { href: '/reports/new', label: 'Create Report' },
          ],
        },
        {
          icon: HiTerminal,
          label: 'Console',
          href: '/console',
        },
      ]
    : []

  return [...baseItems, ...graphDependentItems]
}

// Default export for backward compatibility
export const roboLedgerNavigationItems = getNavigationItems(true)
