/**
 * Cypher Query Definitions for Ledger Pages
 *
 * All Cypher queries used by the ledger UI components.
 */

// ============================================================================
// ELEMENTS (Chart of Accounts)
// ============================================================================

export const ELEMENTS_QUERY = `
MATCH (e:Element)
WHERE e.classification IS NOT NULL
RETURN
  e.identifier as identifier,
  e.uri as uri,
  e.qname as qname,
  e.name as name,
  e.classification as classification,
  e.balance as balance,
  e.periodType as periodType,
  e.type as type,
  e.item_type as itemType,
  e.is_abstract as isAbstract,
  e.is_numeric as isNumeric,
  e.is_dimension_item as isDimensionItem,
  e.is_domain_member as isDomainMember,
  e.is_hypercube_item as isHypercubeItem
ORDER BY e.classification, e.name
`

export const ELEMENT_BY_ID_QUERY = `
MATCH (e:Element {identifier: $id})
RETURN e
`

// ============================================================================
// TRANSACTIONS
// ============================================================================

export const TRANSACTIONS_QUERY = `
MATCH (entity:Entity)-[:ENTITY_HAS_TRANSACTION]->(t:Transaction)
WHERE ($startDate IS NULL OR t.date >= $startDate)
  AND ($endDate IS NULL OR t.date <= $endDate)
RETURN
  t.identifier as identifier,
  t.uri as uri,
  t.transaction_number as transactionNumber,
  t.date as date,
  t.description as description,
  t.transaction_type as transactionType,
  t.amount as amount,
  t.reference_number as referenceNumber,
  t.currency as currency,
  t.updated_at as updatedAt
ORDER BY t.date DESC
LIMIT $limit
`

export const LINE_ITEMS_QUERY = `
MATCH (t:Transaction {identifier: $txId})-[:TRANSACTION_HAS_LINE_ITEM]->(li:LineItem)
MATCH (li)-[:LINE_ITEM_RELATES_TO_ELEMENT]->(e:Element)
RETURN
  li.identifier as identifier,
  li.uri as uri,
  li.description as description,
  li.debit_amount as debitAmount,
  li.credit_amount as creditAmount,
  li.updated_at as updatedAt,
  e.name as accountName,
  e.identifier as accountId
ORDER BY li.identifier
`

// ============================================================================
// TRIAL BALANCE
// ============================================================================

// Get distinct periods from transactions for period selector
export const TRIAL_BALANCE_PERIODS_QUERY = `
MATCH (t:Transaction)
WHERE t.date IS NOT NULL
WITH t.date as txDate
WITH substring(txDate, 0, 7) as period
RETURN DISTINCT period
ORDER BY period DESC
`

export const TRIAL_BALANCE_COA_QUERY = `
MATCH (t:Transaction)-[:TRANSACTION_HAS_LINE_ITEM]->(li:LineItem)-[:LINE_ITEM_RELATES_TO_ELEMENT]->(e:Element)
WHERE ($period IS NULL OR substring(t.date, 0, 7) = $period)
WITH
  e.identifier as accountId,
  e.name as accountName,
  e.classification as classification,
  sum(li.debit_amount) as totalDebits,
  sum(li.credit_amount) as totalCredits
RETURN
  accountId,
  accountName,
  classification,
  totalDebits,
  totalCredits,
  totalDebits - totalCredits as netBalance
ORDER BY classification, accountName
`

// ============================================================================
// MAPPINGS
// ============================================================================

export const MAPPING_STRUCTURES_QUERY = `
MATCH (s:Structure)
WHERE s.type = 'ElementMapping'
OPTIONAL MATCH (s)-[:STRUCTURE_HAS_ASSOCIATION]->(a:Association)
WITH s, count(a) as associationCount
RETURN
  s.identifier as identifier,
  s.name as name,
  s.definition as description,
  s.uri as taxonomyUri,
  s.network_uri as targetTaxonomyUri,
  associationCount
ORDER BY s.name
`

export const MAPPING_WITH_ASSOCIATIONS_QUERY = `
MATCH (s:Structure {identifier: $structureId})
OPTIONAL MATCH (s)-[:STRUCTURE_HAS_ASSOCIATION]->(a:Association)
OPTIONAL MATCH (a)-[:ASSOCIATION_HAS_FROM_ELEMENT]->(source:Element)
OPTIONAL MATCH (a)-[:ASSOCIATION_HAS_TO_ELEMENT]->(target:Element)
RETURN
  s.identifier as structureId,
  s.name as structureName,
  s.definition as description,
  s.uri as taxonomyUri,
  s.network_uri as targetTaxonomyUri,
  collect({
    identifier: a.identifier,
    aggregationMethod: a.preferred_label,
    weight: a.weight,
    orderValue: a.order_value,
    sourceElement: source.uri,
    sourceElementName: source.name,
    targetElement: target.uri,
    targetElementName: target.name
  }) as associations
`

export const UNMAPPED_ELEMENTS_QUERY = `
MATCH (e:Element)
WHERE e.classification IS NOT NULL
  AND NOT EXISTS {
    MATCH (e)<-[:ASSOCIATION_HAS_FROM_ELEMENT]-(:Association)<-[:STRUCTURE_HAS_ASSOCIATION]-(:Structure)
  }
RETURN
  e.identifier as identifier,
  e.name as name,
  e.classification as classification
ORDER BY e.classification, e.name
`

// ============================================================================
// REPORTS
// ============================================================================

export const REPORTS_QUERY = `
MATCH (entity:Entity)-[:ENTITY_HAS_REPORT]->(r:Report)
OPTIONAL MATCH (r)-[:REPORT_HAS_FACT]->(f:Fact)
WITH r, entity, count(f) as factCount
RETURN
  r.identifier as identifier,
  r.uri as uri,
  r.name as name,
  r.accession_number as accessionNumber,
  r.form as form,
  r.filing_date as filingDate,
  r.report_date as reportDate,
  r.period_end_date as periodEndDate,
  r.processed as processed,
  r.updated_at as updatedAt,
  entity.name as entityName,
  factCount
ORDER BY r.report_date DESC
`

export const REPORT_WITH_FACTS_QUERY = `
MATCH (r:Report {identifier: $reportId})
OPTIONAL MATCH (r)-[:REPORT_HAS_FACT]->(f:Fact)-[:FACT_HAS_ELEMENT]->(e:Element)
OPTIONAL MATCH (f)-[:FACT_HAS_PERIOD]->(p:Period)
RETURN
  r.identifier as reportId,
  r.name as reportName,
  r.form as form,
  r.report_date as reportDate,
  r.period_end_date as periodEndDate,
  collect({
    identifier: f.identifier,
    value: f.value,
    numericValue: f.numeric_value,
    factType: f.fact_type,
    decimals: f.decimals,
    elementName: e.name,
    periodStart: p.start_date,
    periodEnd: p.end_date
  }) as facts
`

// ============================================================================
// MUTATIONS (for creating mappings)
// ============================================================================

export const CREATE_MAPPING_STRUCTURE_MUTATION = `
CREATE (s:Structure {
  identifier: $identifier,
  type: 'ElementMapping',
  name: $name,
  definition: $description,
  uri: $taxonomyUri,
  network_uri: $targetTaxonomyUri
})
RETURN s
`

export const CREATE_ASSOCIATION_MUTATION = `
MATCH (s:Structure {identifier: $structureId})
MERGE (target:Element {uri: $targetElementUri})
ON CREATE SET
  target.identifier = $targetIdentifier,
  target.name = $targetName,
  target.classification = $targetClassification,
  target.balance = $targetBalance,
  target.periodType = $targetPeriodType
WITH s, target
MATCH (source:Element {uri: $sourceElementUri})
CREATE (a:Association {
  identifier: $associationId,
  association_type: 'ElementMapping',
  arcrole: 'aggregation',
  preferred_label: $aggregationMethod,
  weight: $weight,
  order_value: $orderValue
})
CREATE (s)-[:STRUCTURE_HAS_ASSOCIATION]->(a)
CREATE (a)-[:ASSOCIATION_HAS_FROM_ELEMENT]->(source)
CREATE (a)-[:ASSOCIATION_HAS_TO_ELEMENT]->(target)
RETURN a
`

export const DELETE_MAPPING_STRUCTURE_MUTATION = `
MATCH (s:Structure {identifier: $structureId})
OPTIONAL MATCH (s)-[:STRUCTURE_HAS_ASSOCIATION]->(a:Association)
DETACH DELETE a, s
`

export const DELETE_ASSOCIATION_MUTATION = `
MATCH (a:Association {identifier: $associationId})
DETACH DELETE a
`
