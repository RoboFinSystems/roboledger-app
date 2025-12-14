'use client'

import { PageHeader } from '@/components/PageHeader'
import { customTheme, PageLayout } from '@/lib/core'
import type { TabsRef } from 'flowbite-react'
import {
  Badge,
  Button,
  Card,
  Dropdown,
  DropdownItem,
  TabItem,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Tabs,
} from 'flowbite-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import type { FC } from 'react'
import { useRef, useState } from 'react'
import {
  HiChevronDown,
  HiDocumentDownload,
  HiDocumentReport,
  HiOutlinePencil,
  HiPrinter,
} from 'react-icons/hi'

// Mock report data for screenshots
const MOCK_REPORT = {
  identifier: 'rpt-2025-q4-001',
  name: 'Q4 2025 Financial Statements',
  type: '10-Q',
  entityName: 'Acme Corporation',
  periodStart: '2025-10-01',
  periodEnd: '2025-12-31',
  createdAt: '2025-01-15T10:30:00Z',
  createdBy: 'Joseph French',
  status: 'Final',
}

// Mock Balance Sheet data
const MOCK_BALANCE_SHEET = {
  assets: {
    current: [
      { label: 'Cash and Cash Equivalents', value: 2450000 },
      { label: 'Accounts Receivable, Net', value: 1875000 },
      { label: 'Inventory', value: 3200000 },
      { label: 'Prepaid Expenses', value: 425000 },
    ],
    currentTotal: 7950000,
    nonCurrent: [
      { label: 'Property, Plant and Equipment, Net', value: 12500000 },
      { label: 'Intangible Assets, Net', value: 3750000 },
      { label: 'Goodwill', value: 5200000 },
      { label: 'Long-term Investments', value: 2100000 },
    ],
    nonCurrentTotal: 23550000,
    total: 31500000,
  },
  liabilities: {
    current: [
      { label: 'Accounts Payable', value: 1650000 },
      { label: 'Accrued Expenses', value: 875000 },
      { label: 'Short-term Debt', value: 2000000 },
      { label: 'Current Portion of Long-term Debt', value: 500000 },
    ],
    currentTotal: 5025000,
    nonCurrent: [
      { label: 'Long-term Debt', value: 8500000 },
      { label: 'Deferred Tax Liabilities', value: 1250000 },
      { label: 'Other Long-term Liabilities', value: 725000 },
    ],
    nonCurrentTotal: 10475000,
    total: 15500000,
  },
  equity: {
    items: [
      { label: 'Common Stock', value: 5000000 },
      { label: 'Additional Paid-in Capital', value: 3500000 },
      { label: 'Retained Earnings', value: 7500000 },
    ],
    total: 16000000,
  },
}

// Mock Income Statement data
const MOCK_INCOME_STATEMENT = {
  revenue: [
    { label: 'Product Revenue', value: 18500000 },
    { label: 'Service Revenue', value: 6250000 },
  ],
  totalRevenue: 24750000,
  costOfRevenue: [
    { label: 'Cost of Products Sold', value: 9250000 },
    { label: 'Cost of Services', value: 2500000 },
  ],
  totalCostOfRevenue: 11750000,
  grossProfit: 13000000,
  operatingExpenses: [
    { label: 'Research and Development', value: 3200000 },
    { label: 'Sales and Marketing', value: 2800000 },
    { label: 'General and Administrative', value: 1950000 },
  ],
  totalOperatingExpenses: 7950000,
  operatingIncome: 5050000,
  otherItems: [
    { label: 'Interest Expense', value: -425000 },
    { label: 'Other Income, Net', value: 175000 },
  ],
  incomeBeforeTax: 4800000,
  incomeTaxExpense: 1200000,
  netIncome: 3600000,
}

// Mock Cash Flow data
const MOCK_CASH_FLOW = {
  operating: [
    { label: 'Net Income', value: 3600000 },
    { label: 'Depreciation and Amortization', value: 1250000 },
    { label: 'Changes in Working Capital', value: -450000 },
    { label: 'Other Operating Activities', value: 200000 },
  ],
  operatingTotal: 4600000,
  investing: [
    { label: 'Capital Expenditures', value: -2100000 },
    { label: 'Acquisitions', value: -1500000 },
    { label: 'Investment Purchases', value: -500000 },
  ],
  investingTotal: -4100000,
  financing: [
    { label: 'Debt Repayments', value: -1000000 },
    { label: 'Dividends Paid', value: -600000 },
    { label: 'Stock Repurchases', value: -400000 },
  ],
  financingTotal: -2000000,
  netChange: -1500000,
  beginningCash: 3950000,
  endingCash: 2450000,
}

const formatCurrency = (value: number): string => {
  const absValue = Math.abs(value)
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(absValue)
  return value < 0 ? `(${formatted})` : formatted
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const BalanceSheetSection: FC = () => {
  const data = MOCK_BALANCE_SHEET
  return (
    <div className="space-y-6">
      {/* Assets */}
      <Card theme={customTheme.card}>
        <h3 className="font-heading mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Assets
        </h3>
        <Table theme={customTheme.table}>
          <TableBody>
            <TableRow className="bg-gray-50 dark:bg-gray-800">
              <TableCell className="font-semibold">Current Assets</TableCell>
              <TableCell></TableCell>
            </TableRow>
            {data.assets.current.map((item, idx) => (
              <TableRow key={idx}>
                <TableCell className="pl-8">{item.label}</TableCell>
                <TableCell className="text-right font-mono">
                  {formatCurrency(item.value)}
                </TableCell>
              </TableRow>
            ))}
            <TableRow className="border-t-2 border-gray-300 dark:border-gray-600">
              <TableCell className="pl-8 font-semibold">
                Total Current Assets
              </TableCell>
              <TableCell className="text-right font-mono font-semibold">
                {formatCurrency(data.assets.currentTotal)}
              </TableCell>
            </TableRow>

            <TableRow className="bg-gray-50 dark:bg-gray-800">
              <TableCell className="font-semibold">
                Non-Current Assets
              </TableCell>
              <TableCell></TableCell>
            </TableRow>
            {data.assets.nonCurrent.map((item, idx) => (
              <TableRow key={idx}>
                <TableCell className="pl-8">{item.label}</TableCell>
                <TableCell className="text-right font-mono">
                  {formatCurrency(item.value)}
                </TableCell>
              </TableRow>
            ))}
            <TableRow className="border-t-2 border-gray-300 dark:border-gray-600">
              <TableCell className="pl-8 font-semibold">
                Total Non-Current Assets
              </TableCell>
              <TableCell className="text-right font-mono font-semibold">
                {formatCurrency(data.assets.nonCurrentTotal)}
              </TableCell>
            </TableRow>

            <TableRow className="border-t-4 border-gray-400 bg-gray-100 dark:border-gray-500 dark:bg-gray-700">
              <TableCell className="font-bold">Total Assets</TableCell>
              <TableCell className="text-right font-mono font-bold">
                {formatCurrency(data.assets.total)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Card>

      {/* Liabilities */}
      <Card theme={customTheme.card}>
        <h3 className="font-heading mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Liabilities
        </h3>
        <Table theme={customTheme.table}>
          <TableBody>
            <TableRow className="bg-gray-50 dark:bg-gray-800">
              <TableCell className="font-semibold">
                Current Liabilities
              </TableCell>
              <TableCell></TableCell>
            </TableRow>
            {data.liabilities.current.map((item, idx) => (
              <TableRow key={idx}>
                <TableCell className="pl-8">{item.label}</TableCell>
                <TableCell className="text-right font-mono">
                  {formatCurrency(item.value)}
                </TableCell>
              </TableRow>
            ))}
            <TableRow className="border-t-2 border-gray-300 dark:border-gray-600">
              <TableCell className="pl-8 font-semibold">
                Total Current Liabilities
              </TableCell>
              <TableCell className="text-right font-mono font-semibold">
                {formatCurrency(data.liabilities.currentTotal)}
              </TableCell>
            </TableRow>

            <TableRow className="bg-gray-50 dark:bg-gray-800">
              <TableCell className="font-semibold">
                Non-Current Liabilities
              </TableCell>
              <TableCell></TableCell>
            </TableRow>
            {data.liabilities.nonCurrent.map((item, idx) => (
              <TableRow key={idx}>
                <TableCell className="pl-8">{item.label}</TableCell>
                <TableCell className="text-right font-mono">
                  {formatCurrency(item.value)}
                </TableCell>
              </TableRow>
            ))}
            <TableRow className="border-t-2 border-gray-300 dark:border-gray-600">
              <TableCell className="pl-8 font-semibold">
                Total Non-Current Liabilities
              </TableCell>
              <TableCell className="text-right font-mono font-semibold">
                {formatCurrency(data.liabilities.nonCurrentTotal)}
              </TableCell>
            </TableRow>

            <TableRow className="border-t-4 border-gray-400 bg-gray-100 dark:border-gray-500 dark:bg-gray-700">
              <TableCell className="font-bold">Total Liabilities</TableCell>
              <TableCell className="text-right font-mono font-bold">
                {formatCurrency(data.liabilities.total)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Card>

      {/* Equity */}
      <Card theme={customTheme.card}>
        <h3 className="font-heading mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Stockholders&apos; Equity
        </h3>
        <Table theme={customTheme.table}>
          <TableBody>
            {data.equity.items.map((item, idx) => (
              <TableRow key={idx}>
                <TableCell>{item.label}</TableCell>
                <TableCell className="text-right font-mono">
                  {formatCurrency(item.value)}
                </TableCell>
              </TableRow>
            ))}
            <TableRow className="border-t-4 border-gray-400 bg-gray-100 dark:border-gray-500 dark:bg-gray-700">
              <TableCell className="font-bold">
                Total Stockholders&apos; Equity
              </TableCell>
              <TableCell className="text-right font-mono font-bold">
                {formatCurrency(data.equity.total)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Card>

      {/* Verification */}
      <Card
        theme={customTheme.card}
        className="bg-green-50 dark:bg-green-900/20"
      >
        <div className="flex items-center justify-between">
          <div>
            <span className="font-semibold text-gray-900 dark:text-white">
              Total Liabilities + Equity
            </span>
          </div>
          <div className="text-right">
            <span className="font-mono font-bold text-green-600 dark:text-green-400">
              {formatCurrency(data.liabilities.total + data.equity.total)}
            </span>
            <Badge color="success" className="ml-3">
              Balanced
            </Badge>
          </div>
        </div>
      </Card>
    </div>
  )
}

const IncomeStatementSection: FC = () => {
  const data = MOCK_INCOME_STATEMENT
  return (
    <Card theme={customTheme.card}>
      <Table theme={customTheme.table}>
        <TableBody>
          {/* Revenue */}
          <TableRow className="bg-gray-50 dark:bg-gray-800">
            <TableCell className="font-semibold">Revenue</TableCell>
            <TableCell></TableCell>
          </TableRow>
          {data.revenue.map((item, idx) => (
            <TableRow key={idx}>
              <TableCell className="pl-8">{item.label}</TableCell>
              <TableCell className="text-right font-mono">
                {formatCurrency(item.value)}
              </TableCell>
            </TableRow>
          ))}
          <TableRow className="border-t-2 border-gray-300 dark:border-gray-600">
            <TableCell className="font-semibold">Total Revenue</TableCell>
            <TableCell className="text-right font-mono font-semibold">
              {formatCurrency(data.totalRevenue)}
            </TableCell>
          </TableRow>

          {/* Cost of Revenue */}
          <TableRow className="bg-gray-50 dark:bg-gray-800">
            <TableCell className="font-semibold">Cost of Revenue</TableCell>
            <TableCell></TableCell>
          </TableRow>
          {data.costOfRevenue.map((item, idx) => (
            <TableRow key={idx}>
              <TableCell className="pl-8">{item.label}</TableCell>
              <TableCell className="text-right font-mono">
                {formatCurrency(item.value)}
              </TableCell>
            </TableRow>
          ))}
          <TableRow className="border-t-2 border-gray-300 dark:border-gray-600">
            <TableCell className="font-semibold">
              Total Cost of Revenue
            </TableCell>
            <TableCell className="text-right font-mono font-semibold">
              {formatCurrency(data.totalCostOfRevenue)}
            </TableCell>
          </TableRow>

          {/* Gross Profit */}
          <TableRow className="border-t-4 border-gray-400 bg-blue-50 dark:border-gray-500 dark:bg-blue-900/20">
            <TableCell className="font-bold">Gross Profit</TableCell>
            <TableCell className="text-right font-mono font-bold">
              {formatCurrency(data.grossProfit)}
            </TableCell>
          </TableRow>

          {/* Operating Expenses */}
          <TableRow className="bg-gray-50 dark:bg-gray-800">
            <TableCell className="font-semibold">Operating Expenses</TableCell>
            <TableCell></TableCell>
          </TableRow>
          {data.operatingExpenses.map((item, idx) => (
            <TableRow key={idx}>
              <TableCell className="pl-8">{item.label}</TableCell>
              <TableCell className="text-right font-mono">
                {formatCurrency(item.value)}
              </TableCell>
            </TableRow>
          ))}
          <TableRow className="border-t-2 border-gray-300 dark:border-gray-600">
            <TableCell className="font-semibold">
              Total Operating Expenses
            </TableCell>
            <TableCell className="text-right font-mono font-semibold">
              {formatCurrency(data.totalOperatingExpenses)}
            </TableCell>
          </TableRow>

          {/* Operating Income */}
          <TableRow className="border-t-4 border-gray-400 bg-blue-50 dark:border-gray-500 dark:bg-blue-900/20">
            <TableCell className="font-bold">Operating Income</TableCell>
            <TableCell className="text-right font-mono font-bold">
              {formatCurrency(data.operatingIncome)}
            </TableCell>
          </TableRow>

          {/* Other Items */}
          {data.otherItems.map((item, idx) => (
            <TableRow key={idx}>
              <TableCell>{item.label}</TableCell>
              <TableCell className="text-right font-mono">
                {formatCurrency(item.value)}
              </TableCell>
            </TableRow>
          ))}

          {/* Income Before Tax */}
          <TableRow className="border-t-2 border-gray-300 dark:border-gray-600">
            <TableCell className="font-semibold">
              Income Before Income Taxes
            </TableCell>
            <TableCell className="text-right font-mono font-semibold">
              {formatCurrency(data.incomeBeforeTax)}
            </TableCell>
          </TableRow>

          <TableRow>
            <TableCell>Income Tax Expense</TableCell>
            <TableCell className="text-right font-mono">
              {formatCurrency(data.incomeTaxExpense)}
            </TableCell>
          </TableRow>

          {/* Net Income */}
          <TableRow className="border-t-4 border-gray-400 bg-green-50 dark:border-gray-500 dark:bg-green-900/20">
            <TableCell className="text-lg font-bold">Net Income</TableCell>
            <TableCell className="text-right font-mono text-lg font-bold text-green-600 dark:text-green-400">
              {formatCurrency(data.netIncome)}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Card>
  )
}

const CashFlowSection: FC = () => {
  const data = MOCK_CASH_FLOW
  return (
    <Card theme={customTheme.card}>
      <Table theme={customTheme.table}>
        <TableBody>
          {/* Operating Activities */}
          <TableRow className="bg-gray-50 dark:bg-gray-800">
            <TableCell className="font-semibold">
              Cash Flows from Operating Activities
            </TableCell>
            <TableCell></TableCell>
          </TableRow>
          {data.operating.map((item, idx) => (
            <TableRow key={idx}>
              <TableCell className="pl-8">{item.label}</TableCell>
              <TableCell className="text-right font-mono">
                {formatCurrency(item.value)}
              </TableCell>
            </TableRow>
          ))}
          <TableRow className="border-t-2 border-gray-300 dark:border-gray-600">
            <TableCell className="font-semibold">
              Net Cash from Operating Activities
            </TableCell>
            <TableCell className="text-right font-mono font-semibold text-green-600 dark:text-green-400">
              {formatCurrency(data.operatingTotal)}
            </TableCell>
          </TableRow>

          {/* Investing Activities */}
          <TableRow className="bg-gray-50 dark:bg-gray-800">
            <TableCell className="font-semibold">
              Cash Flows from Investing Activities
            </TableCell>
            <TableCell></TableCell>
          </TableRow>
          {data.investing.map((item, idx) => (
            <TableRow key={idx}>
              <TableCell className="pl-8">{item.label}</TableCell>
              <TableCell className="text-right font-mono">
                {formatCurrency(item.value)}
              </TableCell>
            </TableRow>
          ))}
          <TableRow className="border-t-2 border-gray-300 dark:border-gray-600">
            <TableCell className="font-semibold">
              Net Cash from Investing Activities
            </TableCell>
            <TableCell className="text-right font-mono font-semibold text-red-600 dark:text-red-400">
              {formatCurrency(data.investingTotal)}
            </TableCell>
          </TableRow>

          {/* Financing Activities */}
          <TableRow className="bg-gray-50 dark:bg-gray-800">
            <TableCell className="font-semibold">
              Cash Flows from Financing Activities
            </TableCell>
            <TableCell></TableCell>
          </TableRow>
          {data.financing.map((item, idx) => (
            <TableRow key={idx}>
              <TableCell className="pl-8">{item.label}</TableCell>
              <TableCell className="text-right font-mono">
                {formatCurrency(item.value)}
              </TableCell>
            </TableRow>
          ))}
          <TableRow className="border-t-2 border-gray-300 dark:border-gray-600">
            <TableCell className="font-semibold">
              Net Cash from Financing Activities
            </TableCell>
            <TableCell className="text-right font-mono font-semibold text-red-600 dark:text-red-400">
              {formatCurrency(data.financingTotal)}
            </TableCell>
          </TableRow>

          {/* Summary */}
          <TableRow className="border-t-4 border-gray-400 bg-gray-100 dark:border-gray-500 dark:bg-gray-700">
            <TableCell className="font-bold">
              Net Change in Cash and Cash Equivalents
            </TableCell>
            <TableCell className="text-right font-mono font-bold">
              {formatCurrency(data.netChange)}
            </TableCell>
          </TableRow>

          <TableRow>
            <TableCell>Cash at Beginning of Period</TableCell>
            <TableCell className="text-right font-mono">
              {formatCurrency(data.beginningCash)}
            </TableCell>
          </TableRow>

          <TableRow className="border-t-4 border-gray-400 bg-blue-50 dark:border-gray-500 dark:bg-blue-900/20">
            <TableCell className="text-lg font-bold">
              Cash at End of Period
            </TableCell>
            <TableCell className="text-right font-mono text-lg font-bold">
              {formatCurrency(data.endingCash)}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Card>
  )
}

const ReportViewerContent: FC = function () {
  const params = useParams()
  const tabsRef = useRef<TabsRef>(null)
  const [activeTab, setActiveTab] = useState(0)
  const report = MOCK_REPORT

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _reportId = params.id

  return (
    <PageLayout>
      <PageHeader
        icon={HiDocumentReport}
        title={report.name}
        description={report.entityName}
        gradient="from-orange-500 to-red-600"
        actions={
          <div className="flex items-center gap-2">
            <Link href={`/reports/new?edit=${report.identifier}`}>
              <Button theme={customTheme.button} color="light">
                <HiOutlinePencil className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </Link>
            <Dropdown
              theme={customTheme.dropdown}
              label=""
              dismissOnClick={false}
              renderTrigger={() => (
                <Button theme={customTheme.button} color="primary">
                  <HiDocumentDownload className="mr-2 h-4 w-4" />
                  Export
                  <HiChevronDown className="ml-2 h-4 w-4" />
                </Button>
              )}
            >
              <DropdownItem icon={HiDocumentDownload}>
                Export to XBRL
              </DropdownItem>
              <DropdownItem icon={HiDocumentDownload}>
                Download as PDF
              </DropdownItem>
              <DropdownItem icon={HiDocumentDownload}>
                Download as Excel
              </DropdownItem>
              <DropdownItem icon={HiDocumentDownload}>
                Download as CSV
              </DropdownItem>
              <DropdownItem icon={HiPrinter}>Print Report</DropdownItem>
            </Dropdown>
          </div>
        }
      />

      {/* Report Metadata */}
      <Card theme={customTheme.card}>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <Badge color="success" size="sm">
            {report.status}
          </Badge>
          <span className="text-gray-500 dark:text-gray-400">
            Period: {formatDate(report.periodStart)} -{' '}
            {formatDate(report.periodEnd)}
          </span>
          <span className="text-gray-500 dark:text-gray-400">
            Created by {report.createdBy} on {formatDate(report.createdAt)}
          </span>
        </div>
      </Card>

      {/* Report Content with Tabs */}
      <Card theme={customTheme.card}>
        <Tabs
          ref={tabsRef}
          onActiveTabChange={(tab) => setActiveTab(tab)}
          variant="underline"
          theme={customTheme.tabs}
        >
          <TabItem active={activeTab === 0} title="Balance Sheet">
            <div className="mt-4">
              <div className="mb-4 text-center">
                <h2 className="font-heading text-xl font-bold text-gray-900 dark:text-white">
                  Consolidated Balance Sheet
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  As of {formatDate(report.periodEnd)}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  (In thousands of U.S. dollars)
                </p>
              </div>
              <BalanceSheetSection />
            </div>
          </TabItem>
          <TabItem active={activeTab === 1} title="Income Statement">
            <div className="mt-4">
              <div className="mb-4 text-center">
                <h2 className="font-heading text-xl font-bold text-gray-900 dark:text-white">
                  Consolidated Statement of Operations
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  For the Quarter Ended {formatDate(report.periodEnd)}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  (In thousands of U.S. dollars)
                </p>
              </div>
              <IncomeStatementSection />
            </div>
          </TabItem>
          <TabItem active={activeTab === 2} title="Cash Flow">
            <div className="mt-4">
              <div className="mb-4 text-center">
                <h2 className="font-heading text-xl font-bold text-gray-900 dark:text-white">
                  Consolidated Statement of Cash Flows
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  For the Quarter Ended {formatDate(report.periodEnd)}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  (In thousands of U.S. dollars)
                </p>
              </div>
              <CashFlowSection />
            </div>
          </TabItem>
        </Tabs>
      </Card>
    </PageLayout>
  )
}

export default ReportViewerContent
