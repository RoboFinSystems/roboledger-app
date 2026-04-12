'use client'

import { customTheme, SDK } from '@/lib/core'
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
import type { FC } from 'react'
import { useCallback, useEffect, useState } from 'react'

// ── Types ──────────────────────────────────────────────────────────────

interface TrialBalanceRow {
  accountName: string
  classification: string
  totalDebits: number
  totalCredits: number
  netBalance: number
}

// ── Constants ──────────────────────────────────────────────────────────

const CLASSIFICATION_COLORS: Record<string, string> = {
  asset: 'blue',
  liability: 'purple',
  equity: 'indigo',
  revenue: 'green',
  expense: 'red',
}

const CLASSIFICATION_LABELS: Record<string, string> = {
  asset: 'Asset',
  liability: 'Liability',
  equity: 'Equity',
  revenue: 'Revenue',
  expense: 'Expense',
}

function formatCurrency(value: number): string {
  if (value === 0) return '–'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value / 100)
}

// ── Component ──────────────────────────────────────────────────────────

interface TrialBalancePanelProps {
  graphId: string
}

const TrialBalancePanel: FC<TrialBalancePanelProps> = ({ graphId }) => {
  const [rows, setRows] = useState<TrialBalanceRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await SDK.getLedgerTrialBalance({
        path: { graph_id: graphId },
      })

      if (response.data) {
        const data =
          (response.data as { rows?: Array<Record<string, unknown>> }).rows ??
          []
        setRows(
          data.map((row) => ({
            accountName: (row.account_name as string) ?? '',
            classification: (row.classification as string) ?? '',
            totalDebits: (row.total_debits as number) ?? 0,
            totalCredits: (row.total_credits as number) ?? 0,
            netBalance: (row.net_balance as number) ?? 0,
          }))
        )
      }
    } catch (err) {
      console.error('Error loading trial balance:', err)
      setError('Failed to load trial balance.')
    } finally {
      setIsLoading(false)
    }
  }, [graphId])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Classification summary
  const summary = rows.reduce(
    (acc, row) => {
      const cls = row.classification
      if (!acc[cls]) acc[cls] = { debits: 0, credits: 0 }
      acc[cls].debits += row.totalDebits
      acc[cls].credits += row.totalCredits
      return acc
    },
    {} as Record<string, { debits: number; credits: number }>
  )

  const totalDebits = rows.reduce((sum, r) => sum + r.totalDebits, 0)
  const totalCredits = rows.reduce((sum, r) => sum + r.totalCredits, 0)

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner size="xl" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-12 text-center text-red-500">
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-lg font-bold dark:text-white">Trial Balance</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {rows.length} accounts
        </p>
      </div>

      {/* Classification summary cards */}
      <div className="grid grid-cols-5 gap-3">
        {(['asset', 'liability', 'equity', 'revenue', 'expense'] as const).map(
          (cls) => (
            <div
              key={cls}
              className="rounded-lg border border-gray-200 p-2.5 dark:border-gray-700"
            >
              <Badge
                color={CLASSIFICATION_COLORS[cls]}
                size="sm"
                className="mb-1"
              >
                {CLASSIFICATION_LABELS[cls]}
              </Badge>
              <div className="mt-1.5 space-y-0.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Dr:</span>
                  <span className="font-mono text-blue-600 dark:text-blue-400">
                    {formatCurrency(summary[cls]?.debits ?? 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Cr:</span>
                  <span className="font-mono text-green-600 dark:text-green-400">
                    {formatCurrency(summary[cls]?.credits ?? 0)}
                  </span>
                </div>
              </div>
            </div>
          )
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table theme={customTheme.table}>
          <TableHead>
            <TableHeadCell>Account</TableHeadCell>
            <TableHeadCell>Classification</TableHeadCell>
            <TableHeadCell className="text-right">Debits</TableHeadCell>
            <TableHeadCell className="text-right">Credits</TableHeadCell>
            <TableHeadCell className="text-right">Net Balance</TableHeadCell>
          </TableHead>
          <TableBody>
            {rows.map((row, idx) => (
              <TableRow key={idx}>
                <TableCell className="font-medium text-gray-900 dark:text-white">
                  {row.accountName}
                </TableCell>
                <TableCell>
                  <Badge
                    color={CLASSIFICATION_COLORS[row.classification] || 'gray'}
                    size="sm"
                  >
                    {CLASSIFICATION_LABELS[row.classification] ||
                      row.classification}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-mono">
                  <span className="text-blue-600 dark:text-blue-400">
                    {row.totalDebits > 0
                      ? formatCurrency(row.totalDebits)
                      : '–'}
                  </span>
                </TableCell>
                <TableCell className="text-right font-mono">
                  <span className="text-green-600 dark:text-green-400">
                    {row.totalCredits > 0
                      ? formatCurrency(row.totalCredits)
                      : '–'}
                  </span>
                </TableCell>
                <TableCell className="text-right font-mono">
                  <span
                    className={
                      row.netBalance < 0
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-gray-900 dark:text-white'
                    }
                  >
                    {formatCurrency(row.netBalance)}
                  </span>
                </TableCell>
              </TableRow>
            ))}
            {/* Totals row */}
            <TableRow className="border-t-2 border-gray-300 font-bold dark:border-gray-600">
              <TableCell className="text-gray-900 dark:text-white">
                Total
              </TableCell>
              <TableCell />
              <TableCell className="text-right font-mono text-blue-600 dark:text-blue-400">
                {formatCurrency(totalDebits)}
              </TableCell>
              <TableCell className="text-right font-mono text-green-600 dark:text-green-400">
                {formatCurrency(totalCredits)}
              </TableCell>
              <TableCell className="text-right font-mono text-gray-900 dark:text-white">
                {formatCurrency(totalDebits - totalCredits)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default TrialBalancePanel
