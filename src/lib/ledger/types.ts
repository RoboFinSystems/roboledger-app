/**
 * Ledger Data Types
 *
 * TypeScript interfaces for ledger-related data structures
 * matching the graph schema from RoboSystems backend.
 */

// ============================================================================
// ELEMENT (Chart of Accounts)
// ============================================================================

export type ElementClassification =
  | 'asset'
  | 'liability'
  | 'equity'
  | 'revenue'
  | 'expense'

export type BalanceType = 'debit' | 'credit'
export type PeriodType = 'instant' | 'duration'

export interface Element {
  identifier: string
  uri: string
  qname: string
  name: string

  // Classification
  classification: ElementClassification
  balance: BalanceType
  periodType: PeriodType

  // Type info
  type: string
  itemType?: string

  // Flags
  isAbstract: boolean
  isNumeric: boolean
  isDimensionItem: boolean
  isDomainMember: boolean
  isHypercubeItem: boolean
}

// ============================================================================
// TRANSACTION
// ============================================================================

export interface Transaction {
  identifier: string
  uri: string
  transactionNumber: string
  date: string
  description: string
  transactionType: string
  amount?: number
  referenceNumber?: string
  currency: string
  updatedAt: string
}

export interface LineItem {
  identifier: string
  uri: string
  description: string
  debitAmount: number
  creditAmount: number
  accountName?: string
  accountId?: string
  updatedAt: string
}

// ============================================================================
// TRIAL BALANCE
// ============================================================================

export interface TrialBalanceRow {
  accountId: string
  accountName: string
  classification: ElementClassification
  totalDebits: number
  totalCredits: number
  netBalance: number
}

// ============================================================================
// MAPPING
// ============================================================================

export type AggregationMethod =
  | 'sum'
  | 'average'
  | 'weighted_average'
  | 'first'
  | 'last'
  | 'calculated'

export interface MappingStructure {
  identifier: string
  name: string
  description?: string
  taxonomyUri: string
  targetTaxonomyUri: string
  associationCount?: number
}

export interface ElementAssociation {
  identifier: string
  sourceElement: string
  sourceElementName?: string
  targetElement: string
  targetElementName?: string
  aggregationMethod: AggregationMethod
  weight: number
  orderValue: number
}

// ============================================================================
// REPORT
// ============================================================================

export interface Report {
  identifier: string
  uri: string
  name: string
  accessionNumber: string
  form: string
  filingDate: string
  reportDate: string
  periodEndDate: string
  processed: boolean
  updatedAt: string
  entityName?: string
  factCount?: number
}

export interface Fact {
  identifier: string
  uri: string
  value: string
  numericValue: number
  factType: 'Numeric' | 'Text'
  decimals: string
  reportId: string
  elementId: string
  elementName?: string
  periodId: string
  unitId: string
  entityId: string
}

// ============================================================================
// PERIOD
// ============================================================================

export interface Period {
  identifier: string
  uri: string
  instantDate?: string
  startDate?: string
  endDate?: string
  fiscalYear: number
  fiscalQuarter: string
  periodType: 'instant' | 'duration' | 'monthly' | 'quarterly' | 'annual'
  isAnnual: boolean
  isQuarterly: boolean
  daysInPeriod: number
}

// ============================================================================
// UNIT
// ============================================================================

export interface Unit {
  identifier: string
  uri: string
  measure: string
  value: string
}
