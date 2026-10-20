import { describe, expect, it } from 'vitest'
import { csvRow, dollars, textCell, toCsv } from '../csv'

describe('csv', () => {
  it('guards text that would run as a formula, and quotes what needs it', () => {
    expect(textCell('=HYPERLINK("x")')).toBe(`'=HYPERLINK("x")`)
    expect(csvRow(['@SUM(A1)', 'Acme, Inc.', 'say "hi"'])).toBe(
      `'@SUM(A1),"Acme, Inc.","say ""hi"""`
    )
  })

  it('writes money to two places and a negative amount as a number', () => {
    expect(csvRow([dollars(25250.4), dollars(-1255), dollars(null)])).toBe(
      '25250.40,-1255.00,'
    )
  })

  it('joins rows with newlines and leaves nothing as an empty cell', () => {
    expect(
      toCsv([
        ['a', null],
        [1, undefined],
      ])
    ).toBe('a,\n1,')
  })
})
