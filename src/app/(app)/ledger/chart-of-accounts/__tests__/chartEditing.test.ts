import type { LedgerElement } from '@robosystems/client/clients'
import { describe, expect, it } from 'vitest'
import {
  addPayload,
  type ChartAccount,
  codeTakenBy,
  type EditableChart,
  isReclassification,
  newQname,
  parentOptions,
  pickEditableChart,
  updatePatch,
} from '../chartEditing'

const element = (
  id: string,
  overrides: Partial<LedgerElement> = {}
): LedgerElement =>
  ({
    id,
    code: null,
    name: id,
    description: null,
    qname: `coa:${id}`,
    namespace: null,
    trait: 'expense',
    subClassification: null,
    balanceType: 'debit',
    periodType: 'duration',
    isAbstract: false,
    elementType: 'concept',
    source: 'native',
    taxonomyId: 'tax_a',
    parentId: null,
    depth: 0,
    isActive: true,
    externalId: null,
    externalSource: null,
    ...overrides,
  }) as LedgerElement

const account = (
  id: string,
  overrides: Partial<ChartAccount> = {}
): ChartAccount => ({
  id,
  qname: `coa:${id}`,
  code: null,
  name: id,
  classification: 'expense',
  balanceType: 'debit',
  parentId: null,
  isActive: true,
  ...overrides,
})

const chart = (accounts: ChartAccount[]): EditableChart => ({
  taxonomyId: 'tax_a',
  prefix: 'coa',
  accounts,
})

const draft = (overrides = {}) => ({
  name: 'Rent',
  code: '6100',
  classification: 'expense' as const,
  balanceType: 'debit' as const,
  parentId: '',
  ...overrides,
})

describe('pickEditableChart', () => {
  it("takes the taxonomy holding the tree's accounts, with its prefix", () => {
    const found = pickEditableChart(
      [
        { taxonomyId: 'tax_other', elements: [element('x')] },
        {
          taxonomyId: 'tax_a',
          elements: [
            element('cash', { qname: 'coa-dcafe:1000' }),
            element('old', { qname: 'coa-dcafe:1900', isActive: false }),
          ],
        },
      ],
      new Set(['cash'])
    )
    expect(found).not.toBe('synced')
    expect(found).toMatchObject({ taxonomyId: 'tax_a', prefix: 'coa-dcafe' })
    expect(
      found !== null && found !== 'synced'
        ? found.accounts.map((a) => [a.id, a.isActive])
        : null
    ).toEqual([
      ['cash', true],
      ['old', false],
    ])
  })

  it('says synced when QuickBooks owns the chart, and null when none matches', () => {
    const synced = pickEditableChart(
      [
        {
          taxonomyId: 'tax_qb',
          elements: [element('a', { source: 'quickbooks' })],
        },
      ],
      new Set(['a'])
    )
    expect(synced).toBe('synced')
    expect(pickEditableChart([], new Set(['a']))).toBeNull()
  })
})

describe('adding an account', () => {
  it('keys it by its code, made unique, with the period its class implies', () => {
    const c = chart([account('a', { qname: 'coa:6100' })])
    expect(newQname(c, draft())).toBe('coa:6100_2')
    expect(newQname(c, draft({ code: '', name: 'Bank fees & charges' }))).toBe(
      'coa:BankFeesCharges'
    )
    const parent = account('p', { qname: 'coa:6000' })
    expect(
      addPayload(
        chart([parent]),
        draft({
          classification: 'liability',
          balanceType: 'credit',
          parentId: 'p',
        })
      )
    ).toEqual({
      taxonomy_id: 'tax_a',
      elements_to_add: [
        {
          qname: 'coa:6100',
          name: 'Rent',
          trait: 'liability',
          balance_type: 'credit',
          period_type: 'instant',
          code: '6100',
          parent_ref: 'coa:6000',
        },
      ],
    })
  })
})

describe('updatePatch', () => {
  const rent = account('rent', {
    code: '6100',
    name: 'Rent',
    parentId: 'occ',
  })
  const occ = account('occ', { qname: 'coa:6000' })
  const c = chart([rent, occ])
  const same = draft({ parentId: 'occ' })

  it('is null when nothing changed', () => {
    expect(updatePatch(c, rent, same)).toBeNull()
  })

  it('sends only what changed; an empty parent clears it', () => {
    expect(
      updatePatch(c, rent, { ...same, name: ' Office rent ', parentId: '' })
    ).toEqual({ qname: 'coa:rent', name: 'Office rent', parent_ref: '' })
  })

  it('moves the period type with a class that needs another', () => {
    const changed = {
      ...same,
      classification: 'asset' as const,
      balanceType: 'debit' as const,
    }
    expect(isReclassification(rent, changed)).toBe(true)
    expect(updatePatch(c, rent, changed)).toEqual({
      qname: 'coa:rent',
      trait: 'asset',
      period_type: 'instant',
    })
    expect(
      updatePatch(c, rent, { ...same, balanceType: 'credit' as const })
    ).toEqual({ qname: 'coa:rent', balance_type: 'credit' })
  })
})

describe('parentOptions and codes', () => {
  it('offers active accounts of the class, never the account or its children', () => {
    const top = account('top', { code: '6000' })
    const child = account('child', { parentId: 'top', code: '6010' })
    const grandchild = account('grand', { parentId: 'child', code: '6011' })
    const other = account('other', { code: '6200' })
    const retired = account('ret', { isActive: false })
    const cash = account('cash', { classification: 'asset' })
    const c = chart([top, child, grandchild, other, retired, cash])
    expect(parentOptions(c, 'expense', child).map((a) => a.id)).toEqual([
      'top',
      'other',
    ])
    expect(parentOptions(c, 'asset', null).map((a) => a.id)).toEqual(['cash'])
  })

  it('names the active account already using a code', () => {
    const c = chart([
      account('a', { code: '6100' }),
      account('b', { code: '6200', isActive: false }),
    ])
    expect(codeTakenBy(c, ' 6100 ', null)?.id).toBe('a')
    expect(codeTakenBy(c, '6100', c.accounts[0])).toBeNull()
    expect(codeTakenBy(c, '6200', null)).toBeNull()
    expect(codeTakenBy(c, '', null)).toBeNull()
  })
})
