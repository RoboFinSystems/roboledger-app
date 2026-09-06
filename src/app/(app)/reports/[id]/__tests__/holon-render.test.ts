import { buildPivots, reportSections } from '@robosystems/report-components'
import {
  parseJsonld,
  parseReportDocument,
} from '@robosystems/report-components/adapters'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * Integration check for the comparison renderer. Verifies the shared
 * `@robosystems/report-components` adapter + projection pipeline actually runs
 * inside roboledger's ESM/vitest toolchain (jsonld + n3 interop is the part
 * most likely to break on integration) and reconstructs statements from a
 * real holon JSON-LD document — the same document the app's
 * Download → "Holon (JSON-LD)" action produces — and from a real Tavi
 * compiled model, which is what the report page renders first.
 */
const here = dirname(fileURLToPath(import.meta.url))
const fixture = readFileSync(
  join(here, 'fixtures/sample.holon.jsonld'),
  'utf-8'
)
const taviFixture = readFileSync(
  join(here, 'fixtures/sample.tavi.json'),
  'utf-8'
)

describe('holon render pipeline', () => {
  it('parses a holon into a NormalizedReport with information blocks', async () => {
    const report = await parseJsonld(fixture)

    expect(report.entity?.name).toMatch(/lemonade/i)
    // Four financial statements: balance sheet, income, cash flow, equity.
    expect(report.informationBlocks.length).toBe(4)
    expect(report.facts.length).toBeGreaterThan(0)
    expect(Object.keys(report.elements).length).toBeGreaterThan(0)
  })

  it('reconstructs statements + sections the viewer renders', async () => {
    const report = await parseJsonld(fixture)

    const statements = buildPivots(report)
    expect(statements.length).toBe(4)
    // Every statement lays out at least one presentation row with cells.
    for (const stmt of statements) {
      expect(stmt.rows.length).toBeGreaterThan(0)
      expect(stmt.columns.length).toBeGreaterThan(0)
    }

    const sections = reportSections(report)
    expect(sections.length).toBe(4)
    expect(sections.every((s) => typeof s.title === 'string')).toBe(true)
  })
})

describe('tavi render pipeline', () => {
  it('parses a RoboLedger Tavi through the one door the page uses', async () => {
    const { format, report } = await parseReportDocument(taviFixture)

    expect(format).toBe('tavi')
    expect(report.entity?.name).toBe('Cascade Advisory Group LLC')
    expect(report.informationBlocks.length).toBe(4)
    expect(report.facts.length).toBeGreaterThan(0)
  })

  it('reconstructs the same four sections the holon renderer shows', async () => {
    const { report } = await parseReportDocument(taviFixture)

    const sections = reportSections(report)
    expect(sections.map((s) => s.title)).toEqual([
      'Balance Sheet',
      'Income Statement',
      'Cash Flow Statement',
      'Statement of Changes in Equity',
    ])
    const statements = buildPivots(report)
    expect(statements.length).toBe(4)
    for (const stmt of statements) {
      expect(stmt.rows.length).toBeGreaterThan(0)
      expect(stmt.columns.length).toBeGreaterThan(0)
    }
  })

  it('still reads a holon through the same door, for the fallback', async () => {
    const { format, report } = await parseReportDocument(fixture)

    expect(format).toBe('holon')
    expect(reportSections(report).length).toBe(4)
  })
})
