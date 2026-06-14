'use client'

import { clients, customTheme, LoadingState } from '@/lib/core'
import {
  Badge,
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
  accountCode: string | null
  accountName: string
  accountType: string | null
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

// Match the CoA + main Trial Balance page sort: AccountType first
// (Asset → Liability → Equity → Income → COGS → Expense), then numeric
// account code, then name. See `chart-of-accounts/content.tsx`
// `compareAccountNodes` for the canonical implementation.
const ACCOUNT_TYPE_ORDER: Record<string, number> = {
  Bank: 0,
  'Accounts Receivable': 1,
  'Other Current Asset': 2,
  'Fixed Asset': 3,
  'Other Asset': 4,
  'Accounts Payable': 5,
  'Credit Card': 6,
  'Other Current Liability': 7,
  'Long Term Liability': 8,
  Equity: 9,
  Income: 10,
  'Cost of Goods Sold': 11,
  Expense: 12,
  'Other Income': 13,
  'Other Expense': 14,
}

function compareTrialBalanceRows(
  a: TrialBalanceRow,
  b: TrialBalanceRow
): number {
  const ta = ACCOUNT_TYPE_ORDER[a.accountType || ''] ?? 99
  const tb = ACCOUNT_TYPE_ORDER[b.accountType || ''] ?? 99
  if (ta !== tb) return ta - tb
  const ca = a.accountCode ?? ''
  const cb = b.accountCode ?? ''
  if (ca !== cb) {
    return ca.localeCompare(cb, undefined, { numeric: true })
  }
  return a.accountName.localeCompare(b.accountName)
}

// Values returned by /trial-balance are already in dollars (the backend
// divides by 100 before returning). Do not divide again.
function formatCurrency(value: number): string {
  if (value === 0) return '–'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value)
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

      const result = await clients.ledger.getTrialBalance(graphId)

      if (result) {
        const mapped = (result.rows || []).map((row) => ({
          accountCode: row.accountCode ?? null,
          accountName: row.accountName ?? '',
          accountType: row.accountType ?? null,
          classification: row.trait ?? '',
          totalDebits: row.totalDebits ?? 0,
          totalCredits: row.totalCredits ?? 0,
          netBalance: row.netBalance ?? 0,
        }))
        mapped.sort(compareTrialBalanceRows)
        setRows(mapped)
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
    return <LoadingState size="xl" className="py-24" />
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
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
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
                  <span className="text-primary-600 dark:text-primary-400 font-mono">
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
            {rows.map((row) => (
              <TableRow key={`${row.classification}:${row.accountName}`}>
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
                  <span className="text-primary-600 dark:text-primary-400">
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
              <TableCell className="text-primary-600 dark:text-primary-400 text-right font-mono">
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
