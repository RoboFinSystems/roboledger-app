import { describe, expect, it } from 'vitest'
import { makeMetricEnvelope } from '../../ledger/close/components/blockview/__tests__/_envelope-fixtures'
import { buildRenderingCsv, csvFilename } from '../components/csv'

describe('buildRenderingCsv', () => {
  it('emits a label column plus one raw-value column per period', () => {
    const csv = buildRenderingCsv(makeMetricEnvelope())
    expect(csv).not.toBeNull()
    const lines = csv!.split('\n')
    expect(lines[0]).toBe('Line Item,2025-12-31,2026-06-30')
    expect(lines[1]).toBe('Working Capital,88047.19,238543.34')
    expect(lines[2]).toBe('Current Ratio,3.2727,5.5905')
  })

  it('prefers period labels over end dates in the header', () => {
    const envelope = makeMetricEnvelope()
    envelope.view.rendering!.periods[0].label = 'FY 2025'
    const csv = buildRenderingCsv(envelope)
    expect(csv!.split('\n')[0]).toBe('Line Item,FY 2025,2026-06-30')
  })

  it('leaves absent values as empty cells', () => {
    const envelope = makeMetricEnvelope()
    envelope.view.rendering!.rows[1].values = [null, 5.5905]
    const csv = buildRenderingCsv(envelope)
    expect(csv!.split('\n')[2]).toBe('Current Ratio,,5.5905')
  })

  it('quotes fields containing commas', () => {
    const envelope = makeMetricEnvelope()
    envelope.view.rendering!.rows[0].elementName = 'Working Capital, net'
    const csv = buildRenderingCsv(envelope)
    expect(csv!.split('\n')[1]).toBe(
      '"Working Capital, net",88047.19,238543.34'
    )
  })

  it('returns null when there is nothing to export', () => {
    const envelope = makeMetricEnvelope()
    envelope.view.rendering!.rows = []
    expect(buildRenderingCsv(envelope)).toBeNull()
    envelope.view.rendering = null
    expect(buildRenderingCsv(envelope)).toBeNull()
  })
})

describe('csvFilename', () => {
  it('slugs the block name', () => {
    expect(csvFilename('Key Financial Metrics')).toBe(
      'key-financial-metrics.csv'
    )
  })

  it('falls back when the name has no usable characters', () => {
    expect(csvFilename('—')).toBe('information-block.csv')
  })
})
