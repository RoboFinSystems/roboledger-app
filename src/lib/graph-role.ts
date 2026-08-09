import type { GraphInfo } from '@robosystems/client'

/**
 * Per-graph roles, ordered `viewer < member < admin` (mirrors the platform's
 * `GraphRole` enum). `GraphInfo.role` carries the caller's role on each graph,
 * so the current role is a lookup in the graph context rather than a fetch.
 */
export type GraphRole = 'viewer' | 'member' | 'admin'

const ROLE_ORDER: GraphRole[] = ['viewer', 'member', 'admin']

/** True when `role` meets or exceeds `required`. Unknown roles never pass. */
export const roleAtLeast = (
  role: string | null | undefined,
  required: GraphRole
): boolean => {
  if (!role) return false
  const held = ROLE_ORDER.indexOf(role.toLowerCase() as GraphRole)
  if (held === -1) return false
  return held >= ROLE_ORDER.indexOf(required)
}

/**
 * Whether the caller holds admin on `graphId`.
 *
 * Client-side gating is a UX affordance, never the authorization boundary —
 * the API re-checks and returns 403 regardless. We gate anyway so the
 * admin-only halves of the share controls (purging shared-in reports, lifting
 * a block, deleting a copy someone else sent) don't present buttons that can
 * only fail.
 */
export const isGraphAdmin = (
  graphs: GraphInfo[] | null | undefined,
  graphId: string | null | undefined
): boolean => {
  if (!graphs || !graphId) return false
  const graph = graphs.find((g) => g.graphId === graphId)
  return roleAtLeast(graph?.role, 'admin')
}
