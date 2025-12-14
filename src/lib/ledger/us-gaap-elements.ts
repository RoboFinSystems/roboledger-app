/**
 * Predefined US-GAAP Elements
 *
 * Common US-GAAP taxonomy elements for element mapping.
 * These serve as a "phantom" taxonomy since the full US-GAAP taxonomy isn't available.
 */

import type { BalanceType, ElementClassification, PeriodType } from './types'

export interface USGAAPElement {
  name: string
  label: string
  classification: ElementClassification
  balance: BalanceType
  periodType: PeriodType
  parent?: string
  isAbstract?: boolean
  isTotal?: boolean
}

export const US_GAAP_ELEMENTS: Record<string, USGAAPElement> = {
  // ════════════════════════════════════════════════════════════════════════
  // ASSETS
  // ════════════════════════════════════════════════════════════════════════

  // Current Assets
  CashAndCashEquivalentsAtCarryingValue: {
    name: 'CashAndCashEquivalentsAtCarryingValue',
    label: 'Cash and Cash Equivalents',
    classification: 'asset',
    balance: 'debit',
    periodType: 'instant',
    parent: 'AssetsCurrent',
  },
  AccountsReceivableNetCurrent: {
    name: 'AccountsReceivableNetCurrent',
    label: 'Accounts Receivable, Net',
    classification: 'asset',
    balance: 'debit',
    periodType: 'instant',
    parent: 'AssetsCurrent',
  },
  InventoryNet: {
    name: 'InventoryNet',
    label: 'Inventory, Net',
    classification: 'asset',
    balance: 'debit',
    periodType: 'instant',
    parent: 'AssetsCurrent',
  },
  PrepaidExpenseAndOtherAssetsCurrent: {
    name: 'PrepaidExpenseAndOtherAssetsCurrent',
    label: 'Prepaid Expenses and Other Current Assets',
    classification: 'asset',
    balance: 'debit',
    periodType: 'instant',
    parent: 'AssetsCurrent',
  },
  AssetsCurrent: {
    name: 'AssetsCurrent',
    label: 'Total Current Assets',
    classification: 'asset',
    balance: 'debit',
    periodType: 'instant',
    isTotal: true,
  },

  // Non-Current Assets
  PropertyPlantAndEquipmentNet: {
    name: 'PropertyPlantAndEquipmentNet',
    label: 'Property, Plant and Equipment, Net',
    classification: 'asset',
    balance: 'debit',
    periodType: 'instant',
    parent: 'AssetsNoncurrent',
  },
  IntangibleAssetsNetExcludingGoodwill: {
    name: 'IntangibleAssetsNetExcludingGoodwill',
    label: 'Intangible Assets, Net',
    classification: 'asset',
    balance: 'debit',
    periodType: 'instant',
    parent: 'AssetsNoncurrent',
  },
  Goodwill: {
    name: 'Goodwill',
    label: 'Goodwill',
    classification: 'asset',
    balance: 'debit',
    periodType: 'instant',
    parent: 'AssetsNoncurrent',
  },
  AssetsNoncurrent: {
    name: 'AssetsNoncurrent',
    label: 'Total Non-Current Assets',
    classification: 'asset',
    balance: 'debit',
    periodType: 'instant',
    isTotal: true,
  },
  Assets: {
    name: 'Assets',
    label: 'Total Assets',
    classification: 'asset',
    balance: 'debit',
    periodType: 'instant',
    isTotal: true,
  },

  // ════════════════════════════════════════════════════════════════════════
  // LIABILITIES
  // ════════════════════════════════════════════════════════════════════════

  // Current Liabilities
  AccountsPayableCurrent: {
    name: 'AccountsPayableCurrent',
    label: 'Accounts Payable',
    classification: 'liability',
    balance: 'credit',
    periodType: 'instant',
    parent: 'LiabilitiesCurrent',
  },
  AccruedLiabilitiesCurrent: {
    name: 'AccruedLiabilitiesCurrent',
    label: 'Accrued Liabilities',
    classification: 'liability',
    balance: 'credit',
    periodType: 'instant',
    parent: 'LiabilitiesCurrent',
  },
  DeferredRevenueCurrent: {
    name: 'DeferredRevenueCurrent',
    label: 'Deferred Revenue',
    classification: 'liability',
    balance: 'credit',
    periodType: 'instant',
    parent: 'LiabilitiesCurrent',
  },
  ShortTermBorrowings: {
    name: 'ShortTermBorrowings',
    label: 'Short-term Borrowings',
    classification: 'liability',
    balance: 'credit',
    periodType: 'instant',
    parent: 'LiabilitiesCurrent',
  },
  LiabilitiesCurrent: {
    name: 'LiabilitiesCurrent',
    label: 'Total Current Liabilities',
    classification: 'liability',
    balance: 'credit',
    periodType: 'instant',
    isTotal: true,
  },

  // Non-Current Liabilities
  LongTermDebtNoncurrent: {
    name: 'LongTermDebtNoncurrent',
    label: 'Long-term Debt',
    classification: 'liability',
    balance: 'credit',
    periodType: 'instant',
    parent: 'LiabilitiesNoncurrent',
  },
  DeferredTaxLiabilitiesNoncurrent: {
    name: 'DeferredTaxLiabilitiesNoncurrent',
    label: 'Deferred Tax Liabilities',
    classification: 'liability',
    balance: 'credit',
    periodType: 'instant',
    parent: 'LiabilitiesNoncurrent',
  },
  LiabilitiesNoncurrent: {
    name: 'LiabilitiesNoncurrent',
    label: 'Total Non-Current Liabilities',
    classification: 'liability',
    balance: 'credit',
    periodType: 'instant',
    isTotal: true,
  },
  Liabilities: {
    name: 'Liabilities',
    label: 'Total Liabilities',
    classification: 'liability',
    balance: 'credit',
    periodType: 'instant',
    isTotal: true,
  },

  // ════════════════════════════════════════════════════════════════════════
  // EQUITY
  // ════════════════════════════════════════════════════════════════════════

  CommonStockValue: {
    name: 'CommonStockValue',
    label: 'Common Stock',
    classification: 'equity',
    balance: 'credit',
    periodType: 'instant',
    parent: 'StockholdersEquity',
  },
  AdditionalPaidInCapital: {
    name: 'AdditionalPaidInCapital',
    label: 'Additional Paid-in Capital',
    classification: 'equity',
    balance: 'credit',
    periodType: 'instant',
    parent: 'StockholdersEquity',
  },
  RetainedEarningsAccumulatedDeficit: {
    name: 'RetainedEarningsAccumulatedDeficit',
    label: 'Retained Earnings',
    classification: 'equity',
    balance: 'credit',
    periodType: 'instant',
    parent: 'StockholdersEquity',
  },
  AccumulatedOtherComprehensiveIncomeLossNetOfTax: {
    name: 'AccumulatedOtherComprehensiveIncomeLossNetOfTax',
    label: 'Accumulated Other Comprehensive Income (Loss)',
    classification: 'equity',
    balance: 'credit',
    periodType: 'instant',
    parent: 'StockholdersEquity',
  },
  StockholdersEquity: {
    name: 'StockholdersEquity',
    label: "Total Stockholders' Equity",
    classification: 'equity',
    balance: 'credit',
    periodType: 'instant',
    isTotal: true,
  },
  LiabilitiesAndStockholdersEquity: {
    name: 'LiabilitiesAndStockholdersEquity',
    label: "Total Liabilities and Stockholders' Equity",
    classification: 'equity',
    balance: 'credit',
    periodType: 'instant',
    isTotal: true,
  },

  // ════════════════════════════════════════════════════════════════════════
  // INCOME STATEMENT - REVENUE
  // ════════════════════════════════════════════════════════════════════════

  RevenueFromContractWithCustomerExcludingAssessedTax: {
    name: 'RevenueFromContractWithCustomerExcludingAssessedTax',
    label: 'Revenue from Contracts with Customers',
    classification: 'revenue',
    balance: 'credit',
    periodType: 'duration',
    parent: 'Revenues',
  },
  RevenueFromContractWithCustomerIncludingAssessedTax: {
    name: 'RevenueFromContractWithCustomerIncludingAssessedTax',
    label: 'Revenue (Including Tax)',
    classification: 'revenue',
    balance: 'credit',
    periodType: 'duration',
    parent: 'Revenues',
  },
  InterestAndDividendIncomeOperating: {
    name: 'InterestAndDividendIncomeOperating',
    label: 'Interest and Dividend Income',
    classification: 'revenue',
    balance: 'credit',
    periodType: 'duration',
    parent: 'Revenues',
  },
  OtherIncome: {
    name: 'OtherIncome',
    label: 'Other Income',
    classification: 'revenue',
    balance: 'credit',
    periodType: 'duration',
    parent: 'Revenues',
  },
  Revenues: {
    name: 'Revenues',
    label: 'Total Revenues',
    classification: 'revenue',
    balance: 'credit',
    periodType: 'duration',
    isTotal: true,
  },

  // ════════════════════════════════════════════════════════════════════════
  // INCOME STATEMENT - EXPENSES
  // ════════════════════════════════════════════════════════════════════════

  CostOfGoodsAndServicesSold: {
    name: 'CostOfGoodsAndServicesSold',
    label: 'Cost of Goods and Services Sold',
    classification: 'expense',
    balance: 'debit',
    periodType: 'duration',
    parent: 'CostsAndExpenses',
  },
  CostOfRevenue: {
    name: 'CostOfRevenue',
    label: 'Cost of Revenue',
    classification: 'expense',
    balance: 'debit',
    periodType: 'duration',
    parent: 'CostsAndExpenses',
  },
  GrossProfit: {
    name: 'GrossProfit',
    label: 'Gross Profit',
    classification: 'revenue',
    balance: 'credit',
    periodType: 'duration',
    isTotal: true,
  },
  ResearchAndDevelopmentExpense: {
    name: 'ResearchAndDevelopmentExpense',
    label: 'Research and Development',
    classification: 'expense',
    balance: 'debit',
    periodType: 'duration',
    parent: 'OperatingExpenses',
  },
  SellingGeneralAndAdministrativeExpense: {
    name: 'SellingGeneralAndAdministrativeExpense',
    label: 'Selling, General and Administrative',
    classification: 'expense',
    balance: 'debit',
    periodType: 'duration',
    parent: 'OperatingExpenses',
  },
  LaborAndRelatedExpense: {
    name: 'LaborAndRelatedExpense',
    label: 'Labor and Related Expenses',
    classification: 'expense',
    balance: 'debit',
    periodType: 'duration',
    parent: 'OperatingExpenses',
  },
  DepreciationAndAmortization: {
    name: 'DepreciationAndAmortization',
    label: 'Depreciation and Amortization',
    classification: 'expense',
    balance: 'debit',
    periodType: 'duration',
    parent: 'OperatingExpenses',
  },
  OperatingExpenses: {
    name: 'OperatingExpenses',
    label: 'Total Operating Expenses',
    classification: 'expense',
    balance: 'debit',
    periodType: 'duration',
    isTotal: true,
  },
  OperatingIncomeLoss: {
    name: 'OperatingIncomeLoss',
    label: 'Operating Income (Loss)',
    classification: 'revenue',
    balance: 'credit',
    periodType: 'duration',
    isTotal: true,
  },
  InterestExpense: {
    name: 'InterestExpense',
    label: 'Interest Expense',
    classification: 'expense',
    balance: 'debit',
    periodType: 'duration',
    parent: 'NonoperatingIncomeExpense',
  },
  IncomeTaxExpenseBenefit: {
    name: 'IncomeTaxExpenseBenefit',
    label: 'Income Tax Expense (Benefit)',
    classification: 'expense',
    balance: 'debit',
    periodType: 'duration',
  },
  NetIncomeLoss: {
    name: 'NetIncomeLoss',
    label: 'Net Income (Loss)',
    classification: 'revenue',
    balance: 'credit',
    periodType: 'duration',
    isTotal: true,
  },
  EarningsPerShareBasic: {
    name: 'EarningsPerShareBasic',
    label: 'Earnings Per Share, Basic',
    classification: 'revenue',
    balance: 'credit',
    periodType: 'duration',
  },
  EarningsPerShareDiluted: {
    name: 'EarningsPerShareDiluted',
    label: 'Earnings Per Share, Diluted',
    classification: 'revenue',
    balance: 'credit',
    periodType: 'duration',
  },
}

/**
 * Get US-GAAP elements grouped by classification
 */
export function getUSGAAPElementsByClassification(): Record<
  ElementClassification,
  USGAAPElement[]
> {
  const grouped: Record<ElementClassification, USGAAPElement[]> = {
    asset: [],
    liability: [],
    equity: [],
    revenue: [],
    expense: [],
  }

  Object.values(US_GAAP_ELEMENTS).forEach((element) => {
    grouped[element.classification].push(element)
  })

  return grouped
}

/**
 * Get US-GAAP element by name
 */
export function getUSGAAPElement(name: string): USGAAPElement | undefined {
  return US_GAAP_ELEMENTS[name]
}

/**
 * Generate URI for a US-GAAP element
 */
export function generateUSGAAPUri(elementName: string): string {
  return `http://fasb.org/us-gaap/2024#${elementName}`
}
