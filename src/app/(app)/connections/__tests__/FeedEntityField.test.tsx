import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

// entity-scope (for hierarchyDepth) imports the core package, which needs
// a real component library; nothing here calls into it.
vi.mock('@robosystems/core', () => ({}))

vi.mock('@robosystems/core/ui', () => ({
  Label: ({ children, htmlFor }: any) => (
    <label htmlFor={htmlFor}>{children}</label>
  ),
  Select: ({ id, value, onChange, disabled, children }: any) => (
    <select id={id} value={value} onChange={onChange} disabled={disabled}>
      {children}
    </select>
  ),
}))

import FeedEntityField, {
  feedEntities,
  feedEntityAllowed,
  feedEntityDefault,
  feedEntityScope,
} from '../components/FeedEntityField'

const PARENT = {
  id: 'ent_parent',
  name: 'Harbor Holdings',
  isParent: true,
  parentEntityId: null,
} as any
const SUB = {
  id: 'ent_sub',
  name: 'Cadence Studio',
  isParent: false,
  parentEntityId: 'ent_parent',
} as any

describe('FeedEntityField', () => {
  it('shows nothing for a single company whose books are its own', () => {
    const { container } = render(
      <FeedEntityField
        id="f"
        entities={[PARENT]}
        value="ent_parent"
        onChange={vi.fn()}
        parentKept={false}
      />
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('says when QuickBooks keeps the only company’s books', () => {
    render(
      <FeedEntityField
        id="f"
        entities={[PARENT]}
        value=""
        onChange={vi.fn()}
        parentKept
      />
    )
    expect(screen.getByRole('note')).toHaveTextContent(
      /QuickBooks keeps Harbor Holdings’s books/
    )
  })

  it('lists the group with the parent disabled while QuickBooks keeps it', () => {
    const onChange = vi.fn()
    render(
      <FeedEntityField
        id="f"
        entities={[PARENT, SUB]}
        value="ent_sub"
        onChange={onChange}
        parentKept
      />
    )
    const options = screen.getAllByRole('option') as HTMLOptionElement[]
    expect(options.map((o) => o.value)).toEqual(['ent_parent', 'ent_sub'])
    expect(options[0].disabled).toBe(true)
    expect(options[0]).toHaveTextContent('(QuickBooks keeps its books)')
    expect(options[1].disabled).toBe(false)

    fireEvent.change(screen.getByLabelText('Company'), {
      target: { value: 'ent_parent' },
    })
    expect(onChange).toHaveBeenCalledWith('ent_parent')
  })

  it('leaves every company open when the books are native', () => {
    render(
      <FeedEntityField
        id="f"
        entities={[PARENT, SUB]}
        value="ent_parent"
        onChange={vi.fn()}
        parentKept={false}
      />
    )
    const options = screen.getAllByRole('option') as HTMLOptionElement[]
    expect(options.every((o) => !o.disabled)).toBe(true)
  })
})

describe('feed entity helpers', () => {
  it('defaults to the parent, or the first subsidiary when QuickBooks keeps it', () => {
    expect(feedEntityDefault([PARENT, SUB], false)).toBe('ent_parent')
    expect(feedEntityDefault([PARENT, SUB], true)).toBe('ent_sub')
    expect(feedEntityDefault([PARENT], true)).toBe('')
    expect(feedEntityDefault([], false)).toBe('')
  })

  it('sends null for the parent and the id for a subsidiary', () => {
    expect(feedEntityScope([PARENT, SUB], 'ent_parent')).toBeNull()
    expect(feedEntityScope([PARENT, SUB], 'ent_sub')).toBe('ent_sub')
    expect(feedEntityScope([PARENT, SUB], 'ent_missing')).toBeNull()
  })

  it('allows any listed company except a kept parent', () => {
    expect(feedEntityAllowed([PARENT, SUB], 'ent_parent', false)).toBe(true)
    expect(feedEntityAllowed([PARENT, SUB], 'ent_parent', true)).toBe(false)
    expect(feedEntityAllowed([PARENT, SUB], 'ent_sub', true)).toBe(true)
    expect(feedEntityAllowed([PARENT, SUB], 'ent_missing', false)).toBe(false)
  })
})

describe('feed entities and the focused default', () => {
  const CONSOLIDATION = {
    id: 'ent_cons',
    name: 'Consolidation Adjustments',
    isParent: false,
    parentEntityId: 'ent_parent',
    entityRole: 'consolidation',
  } as any

  it('never books a feed to the consolidation entity', () => {
    const all = [PARENT, CONSOLIDATION, SUB]
    expect(feedEntities(all).map((e) => e.id)).toEqual([
      'ent_parent',
      'ent_sub',
    ])
    expect(feedEntityAllowed(all, 'ent_cons', false)).toBe(false)
    // QuickBooks keeps the parent: the default skips the eliminations too.
    expect(feedEntityDefault(all, true)).toBe('ent_sub')
  })

  it('defaults to the entity in focus when it can take a feed', () => {
    expect(feedEntityDefault([PARENT, SUB], false, 'ent_sub')).toBe('ent_sub')
    expect(feedEntityDefault([PARENT, SUB], true, 'ent_parent')).toBe('ent_sub')
  })
})
