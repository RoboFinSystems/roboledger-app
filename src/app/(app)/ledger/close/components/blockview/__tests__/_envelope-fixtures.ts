import type {
  EnvelopeBlock,
  EnvelopeElement,
  EnvelopeFact,
  EnvelopeRendering,
} from '../types'

/**
 * Test fixtures for `BlockView` and its projections.
 *
 * These are deliberately *partial* shapes cast to the SDK envelope
 * type — every test only touches the fields its projection actually
 * reads. Carrying full SDK shapes here would couple the test bed to
 * GraphQL codegen and provide no real coverage.
 */

export const makeElement = (
  overrides: Partial<EnvelopeElement> = {}
): EnvelopeElement =>
  ({
    id: 'elem_rev',
    qname: 'us-gaap:Revenues',
    name: 'Revenue',
    code: null,
    elementType: 'concept',
    isAbstract: false,
    isMonetary: true,
    balanceType: 'credit',
    periodType: 'duration',
    ...overrides,
  }) as EnvelopeElement

export const makeFact = (overrides: Partial<EnvelopeFact> = {}): EnvelopeFact =>
  ({
    id: 'fact_01',
    elementId: 'elem_rev',
    value: 8500,
    periodStart: '2026-01-01',
    periodEnd: '2026-03-31',
    periodType: 'duration',
    unit: 'USD',
    factScope: 'in_scope',
    factSetId: 'fs_01',
    ...overrides,
  }) as EnvelopeFact

export const makeRendering = (
  overrides: Partial<EnvelopeRendering> = {}
): EnvelopeRendering =>
  ({
    rows: [
      {
        elementId: 'elem_rev',
        elementQname: 'us-gaap:Revenues',
        elementName: 'Revenue',
        classification: 'revenue',
        balanceType: 'credit',
        values: [8500],
        isSubtotal: false,
        depth: 0,
      },
      {
        elementId: 'elem_cogs',
        elementQname: 'us-gaap:CostOfGoodsSold',
        elementName: 'Cost of Goods Sold',
        classification: 'expense',
        balanceType: 'debit',
        values: [-3400],
        isSubtotal: false,
        depth: 1,
      },
      {
        elementId: 'elem_gp',
        elementQname: 'us-gaap:GrossProfit',
        elementName: 'Gross Profit',
        classification: 'revenue',
        balanceType: 'credit',
        values: [5100],
        isSubtotal: true,
        depth: 0,
      },
    ],
    periods: [{ start: '2026-01-01', end: '2026-03-31', label: 'Q1 2026' }],
    validation: null,
    unmappedCount: 0,
    ...overrides,
  }) as EnvelopeRendering

export const makeEnvelope = (
  overrides: Partial<EnvelopeBlock> = {}
): EnvelopeBlock =>
  ({
    id: 'struct_01',
    blockType: 'income_statement',
    name: 'Income Statement',
    displayName: 'Income Statement',
    category: 'Reporting',
    taxonomyId: 'tax_usgaap_reporting',
    taxonomyName: 'US GAAP',
    informationModel: {
      conceptArrangement: 'roll_up',
      memberArrangement: 'aggregation',
    },
    artifact: {
      topic: null,
      parentheticalNote: null,
      template: null,
      mechanics: { kind: 'statement_renderer' },
    },
    elements: [makeElement()],
    connections: [],
    facts: [makeFact()],
    rules: [],
    factSet: null,
    verificationResults: [],
    view: { rendering: makeRendering() },
    ...overrides,
  }) as EnvelopeBlock
