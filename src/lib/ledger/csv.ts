/**
 * The books as CSV: the trial balance, an account's register and a statement,
 * rendered from what the page already holds.
 */

/** A synced name opened in a spreadsheet must stay text: one that starts like
 *  a formula is prefixed so it never runs as one. */
export const textCell = (text: string): string =>
  /^[=+\-@\t\r]/.test(text) ? `'${text}` : text

const quote = (text: string): string =>
  /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text

/** An amount in dollars, written to two places. */
export interface Money {
  dollars: number
}

export type CsvValue = string | number | Money | null | undefined

/** Dollars to two places, so a spreadsheet reads 25250.40, not 25250.4. */
export const dollars = (amount: number | null | undefined): Money | null =>
  amount === null || amount === undefined ? null : { dollars: amount }

/** One row: text guarded and quoted, numbers as written, empty for nothing. */
export function csvRow(values: readonly CsvValue[]): string {
  return values
    .map((value) => {
      if (value === null || value === undefined) return ''
      if (typeof value === 'number') return String(value)
      if (typeof value === 'object') return value.dollars.toFixed(2)
      return quote(textCell(value))
    })
    .join(',')
}

export function toCsv(rows: readonly (readonly CsvValue[])[]): string {
  return rows.map(csvRow).join('\n')
}
