import { describe, expect, it } from 'vitest'
import { searchIndustries } from '../components/IndustryField'

const node = (id: string, label: string, path: string[], extra = {}) =>
  ({
    id,
    parentId: id.includes('/') ? id.slice(0, id.lastIndexOf('/')) : null,
    level: ['sector', 'subsector', 'industry', 'sub-industry'][
      id.split('/').length - 1
    ],
    label,
    path,
    carried: false,
    replacedBy: null,
    ...extra,
  }) as any

const NODES = [
  node('technology', 'Technology', ['Technology']),
  node('technology/software', 'Software', ['Technology', 'Software']),
  node('technology/software/application', 'Application', [
    'Technology',
    'Software',
    'Application',
  ]),
  node('health-care', 'Health Care', ['Health Care']),
  node('health-care/health-care-technology', 'Health Care Technology', [
    'Health Care',
    'Health Care Technology',
  ]),
  node(
    'health-care/health-care-technology/health-care-technology',
    'Health Care Technology',
    ['Health Care', 'Health Care Technology'],
    { carried: true }
  ),
  node('technology/old', 'Old Software', ['Technology', 'Old Software'], {
    replacedBy: 'technology/software',
  }),
]

describe('searchIndustries', () => {
  it('offers the sectors before anything is typed', () => {
    expect(searchIndustries(NODES, '').map((n) => n.id)).toEqual([
      'technology',
      'health-care',
    ])
  })

  it('ranks a name that starts with the query over one that contains it', () => {
    expect(searchIndustries(NODES, 'tech').map((n) => n.id)).toEqual([
      'technology',
      'health-care/health-care-technology',
      'technology/software',
      'technology/software/application',
    ])
  })

  it('never offers a retired node or a carried duplicate', () => {
    const ids = searchIndustries(NODES, 'software').map((n) => n.id)
    expect(ids).toContain('technology/software')
    expect(ids).not.toContain('technology/old')
    expect(
      searchIndustries(NODES, 'health care technology').map((n) => n.id)
    ).toEqual(['health-care/health-care-technology'])
  })
})
