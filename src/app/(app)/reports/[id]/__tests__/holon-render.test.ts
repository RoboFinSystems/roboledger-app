import { buildStatements, reportSections } from '@robosystems/report-components'
import { parseJsonld } from '@robosystems/report-components/adapters'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * Integration check for the holon comparison renderer. Verifies the shared
 * `@robosystems/report-components` adapter + projection pipeline actually runs
 * inside roboledger's ESM/vitest toolchain (jsonld + n3 interop is the part
 * most likely to break on integration) and reconstructs statements from a
 * real holon JSON-LD document — the same document the app's
 * Download → "Holon (JSON-LD)" action produces.
 */
const fixture = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), 'fixtures/sample.holon.jsonld'),
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

    const statements = buildStatements(report)
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
