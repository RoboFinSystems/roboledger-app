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
      rendererNote: null,
      template: null,
      mechanics: { kind: 'statement_renderer' },
    },
    elements: [makeElement()],
    connections: [],
    facts: [makeFact()],
    rules: [],
    factSet: null,
    verificationResults: [],
    verificationSummary: null,
    view: { rendering: makeRendering() },
    ...overrides,
  }) as EnvelopeBlock

/**
 * A metric block with a 2-period standing time series. Rows mix value
 * kinds: Working Capital is monetary, Current Ratio is a ratio —
 * `MetricRendering` formats per-row from the row's `itemType` family.
 */
export const makeMetricEnvelope = (
  overrides: Partial<EnvelopeBlock> = {}
): EnvelopeBlock =>
  makeEnvelope({
    id: 'struct_metrics',
    blockType: 'metric',
    name: 'Key Financial Metrics',
    displayName: 'Key Financial Metrics',
    informationModel: {
      conceptArrangement: 'arithmetic',
      memberArrangement: 'aggregation',
    },
    artifact: {
      topic: null,
      rendererNote: null,
      template: null,
      mechanics: { kind: 'metric' },
    },
    elements: [
      makeElement({
        id: 'elem_wc',
        qname: 'rs-metric:WorkingCapital',
        name: 'Working Capital',
        isMonetary: true,
        periodType: 'instant',
      }),
      makeElement({
        id: 'elem_cr',
        qname: 'rs-metric:CurrentRatio',
        name: 'Current Ratio',
        isMonetary: false,
        periodType: 'instant',
      }),
    ],
    facts: [],
    view: {
      rendering: makeRendering({
        rows: [
          {
            elementId: 'elem_wc',
            elementQname: 'rs-metric:WorkingCapital',
            elementName: 'Working Capital',
            classification: null,
            balanceType: 'debit',
            itemType: 'monetary',
            values: [88047.19, 238543.34],
            isSubtotal: false,
            depth: 0,
          },
          {
            elementId: 'elem_cr',
            elementQname: 'rs-metric:CurrentRatio',
            elementName: 'Current Ratio',
            classification: null,
            balanceType: null,
            itemType: 'ratio',
            values: [3.2727, 5.5905],
            isSubtotal: false,
            depth: 0,
          },
        ] as EnvelopeRendering['rows'],
        periods: [
          { start: null, end: '2025-12-31', label: null },
          { start: null, end: '2026-06-30', label: null },
        ],
      }),
      chart: {
        panels: [
          {
            label: 'Monetary',
            itemType: 'monetary',
            kind: 'line',
            series: [
              {
                key: 'elem_wc',
                elementId: 'elem_wc',
                label: 'Working Capital',
              },
            ],
          },
          {
            label: 'Ratios',
            itemType: 'ratio',
            kind: 'line',
            series: [
              { key: 'elem_cr', elementId: 'elem_cr', label: 'Current Ratio' },
            ],
          },
        ],
      },
    } as EnvelopeBlock['view'],
    ...overrides,
  })

/**
 * A bound text-block disclosure note: `regulatory_disclosure` block
 * with a text-block CAP and one narrative rendering row carrying
 * `textValue` (the server emits one row per Nonnumeric fact).
 */
export const makeTextBlockEnvelope = (
  overrides: Partial<EnvelopeBlock> = {}
): EnvelopeBlock =>
  makeEnvelope({
    id: 'struct_policies',
    blockType: 'regulatory_disclosure',
    name: 'Significant Accounting Policies',
    displayName: 'Significant Accounting Policies',
    informationModel: {
      conceptArrangement: 'text_block',
      memberArrangement: 'whole_part',
    },
    elements: [
      makeElement({
        id: 'elem_policies',
        qname: 'driftline:SignificantAccountingPoliciesTextBlock',
        name: 'Significant Accounting Policies',
        isMonetary: false,
      }),
    ],
    facts: [],
    view: {
      rendering: makeRendering({
        rows: [
          {
            elementId: 'elem_policies',
            elementQname: 'driftline:SignificantAccountingPoliciesTextBlock',
            elementName: 'Significant Accounting Policies',
            textValue:
              '## Revenue Recognition\n\nRevenue is recognized when control transfers.',
          },
        ] as EnvelopeRendering['rows'],
        periods: [{ start: '2026-01-01', end: '2026-03-31', label: null }],
      }),
    },
    ...overrides,
  })
