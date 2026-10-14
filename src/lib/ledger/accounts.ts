/**
 * The chart of accounts as picker options, shared by every surface that
 * offers an account to post to (the inbox modal, a counterparty's default).
 */

export interface AccountOption {
  id: string
  code: string | null
  name: string
}

export interface AccountTreeNode {
  id: string
  code: string | null
  name: string
  isActive: boolean
  children?: AccountTreeNode[] | null
}

/** Every active account in the tree, depth-first, as picker options. */
export const flattenAccountTree = (
  nodes: AccountTreeNode[] | null | undefined
): AccountOption[] => {
  const out: AccountOption[] = []
  const walk = (list: AccountTreeNode[]) => {
    for (const node of list) {
      if (node.isActive) {
        out.push({ id: node.id, code: node.code ?? null, name: node.name })
      }
      if (node.children?.length) walk(node.children)
    }
  }
  walk(nodes ?? [])
  return out.sort(
    (a, b) =>
      (a.code ?? '').localeCompare(b.code ?? '', undefined, {
        numeric: true,
      }) || a.name.localeCompare(b.name)
  )
}

export const accountLabel = (account: AccountOption): string =>
  account.code ? `${account.code} — ${account.name}` : account.name
