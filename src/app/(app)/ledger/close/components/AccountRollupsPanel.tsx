'use client'

import { customTheme, extensions } from '@/lib/core'
import type { AccountRollupsResponse } from '@robosystems/client'
import {
  Badge,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from 'flowbite-react'
import { Fragment, useCallback, useEffect, useState, type FC } from 'react'
import { HiExclamationCircle } from 'react-icons/hi'
import { formatCurrency } from '../utils'
import type { FactRow } from './FactsTable'
import FactsTable from './FactsTable'
import type { ViewMode } from './ViewModeToggle'

interface AccountRollupsPanelProps {
  graphId: string
  mappingId: string
  viewMode: ViewMode
}

const AccountRollupsPanel: FC<AccountRollupsPanelProps> = ({
  graphId,
  mappingId,
  viewMode,
}) => {
  const [data, setData] = useState<AccountRollupsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await extensions.ledger.getAccountRollups(graphId, {
        mappingId,
      })
      setData(response)
    } catch (err) {
      console.error('Error loading account rollups:', err)
      setError('Failed to load account rollups.')
    } finally {
      setIsLoading(false)
    }
  }, [graphId, mappingId])

  useEffect(() => {
    loadData()
  }, [loadData])

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 py-8 text-red-500">
        <HiExclamationCircle className="h-5 w-5" />
        <span>{error}</span>
      </div>
    )
  }

  if (!data || data.groups.length === 0) {
    return (
      <div className="py-12 text-center text-gray-500 dark:text-gray-400">
        <p className="mb-2">No account rollups available.</p>
        <p className="text-xs">
          Map your Chart of Accounts to US GAAP elements to see rollups here.
        </p>
      </div>
    )
  }

  // Facts view — flat table of all mapped balances
  if (viewMode === 'facts') {
    const facts: FactRow[] = []
    for (const group of data.groups) {
      for (const account of group.accounts) {
        facts.push({
          elementName: account.account_name,
          elementQname: `→ ${group.reporting_qname}`,
          periodStart: 'Current',
          periodEnd: null,
          value: account.net_balance,
          unit: 'USD',
        })
      }
    }
    return <FactsTable facts={facts} />
  }

  // Rendered view — rollup hierarchy
  return (
    <div>
      <div className="border-b border-gray-200 py-4 text-center dark:border-gray-700">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Account Rollups
        </p>
        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
          {data.mapping_name} — {data.total_mapped} mapped
          {data.total_unmapped > 0 && `, ${data.total_unmapped} unmapped`}
        </p>
      </div>

      <div className="overflow-x-auto">
        <Table theme={customTheme.table}>
          <TableHead>
            <TableHeadCell className="w-2/3">Account</TableHeadCell>
            <TableHeadCell className="text-right">Balance</TableHeadCell>
          </TableHead>
          <TableBody>
            {data.groups.map((group) => (
              <Fragment key={group.reporting_element_id}>
                {/* Reporting element header */}
                <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                  <TableCell
                    style={{ paddingLeft: '16px' }}
                    className="font-semibold text-gray-900 dark:text-white"
                  >
                    {group.reporting_name}
                    <Badge color="gray" size="xs" className="ml-2 inline-block">
                      {group.classification}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(group.total)}
                  </TableCell>
                </TableRow>

                {/* CoA account detail rows */}
                {group.accounts.map((account) => (
                  <TableRow key={account.element_id}>
                    <TableCell
                      style={{ paddingLeft: '40px' }}
                      className="text-gray-600 dark:text-gray-300"
                    >
                      {account.account_code && (
                        <span className="mr-2 font-mono text-xs text-gray-400">
                          {account.account_code}
                        </span>
                      )}
                      {account.account_name}
                    </TableCell>
                    <TableCell
                      className={`text-right font-mono text-gray-700 dark:text-gray-300 ${
                        account.net_balance === 0
                          ? 'text-gray-400 dark:text-gray-500'
                          : ''
                      }`}
                    >
                      {formatCurrency(account.net_balance)}
                    </TableCell>
                  </TableRow>
                ))}
              </Fragment>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default AccountRollupsPanel
