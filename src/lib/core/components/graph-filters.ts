import type { GraphInfo } from '@robosystems/client'

/**
 * Common filter functions for GraphSelectorCore
 * These can be composed together for complex filtering
 */

/**
 * Filter out subgraphs using the isSubgraph field
 */
export function excludeSubgraphs(graph: GraphInfo): boolean {
  return !graph.isSubgraph
}

/**
 * Filter out shared repositories
 */
export function excludeRepositories(graph: GraphInfo): boolean {
  return !graph.isRepository
}

/**
 * Filter to only show shared repositories
 */
export function onlyRepositories(graph: GraphInfo): boolean {
  return graph.isRepository === true
}

/**
 * Filter to only show user-owned graphs (excludes repositories and subgraphs)
 */
export function onlyUserGraphs(graph: GraphInfo): boolean {
  return excludeRepositories(graph) && excludeSubgraphs(graph)
}

/**
 * Filter graphs by type
 */
export function byGraphType(...types: string[]) {
  return (graph: GraphInfo): boolean => {
    // If graphType is undefined, check if the filter includes default types
    if (!graph.graphType) {
      return types.includes('entity') || types.includes('generic')
    }
    return types.includes(graph.graphType)
  }
}

/**
 * Filter to only show entity graphs
 */
export const onlyEntityGraphs = byGraphType('entity')

/**
 * Filter to only show generic graphs
 */
export const onlyGenericGraphs = byGraphType('generic')

/**
 * Compose multiple filter functions together (all must pass)
 */
export function composeFilters(
  ...filters: Array<(graph: GraphInfo) => boolean>
): (graph: GraphInfo) => boolean {
  return (graph: GraphInfo) => filters.every((filter) => filter(graph))
}

/**
 * Filter graphs by schema extension
 * Checks if the graph has a specific schema extension installed
 */
export function hasSchemaExtension(extensionName: string) {
  return (graph: GraphInfo): boolean => {
    return graph.schemaExtensions?.includes(extensionName) ?? false
  }
}

/**
 * Filter graphs that have ANY of the specified schema extensions
 */
export function hasAnySchemaExtension(...extensionNames: string[]) {
  return (graph: GraphInfo): boolean => {
    if (!graph.schemaExtensions || graph.schemaExtensions.length === 0) {
      return false
    }
    return extensionNames.some((ext) => graph.schemaExtensions.includes(ext))
  }
}

/**
 * Filter graphs that have ALL of the specified schema extensions
 */
export function hasAllSchemaExtensions(...extensionNames: string[]) {
  return (graph: GraphInfo): boolean => {
    if (!graph.schemaExtensions || graph.schemaExtensions.length === 0) {
      return false
    }
    return extensionNames.every((ext) => graph.schemaExtensions.includes(ext))
  }
}

/**
 * Common preset filters for different app types
 */
export const GraphFilters = {
  /**
   * For RoboLedger: Only user entity graphs with roboledger schema, no subgraphs or repositories
   */
  roboledger: composeFilters(
    excludeSubgraphs,
    excludeRepositories,
    onlyEntityGraphs,
    hasSchemaExtension('roboledger')
  ),

  /**
   * For RoboInvestor: Only user entity graphs with roboinvestor schema, no subgraphs or repositories
   */
  roboinvestor: composeFilters(
    excludeSubgraphs,
    excludeRepositories,
    onlyEntityGraphs,
    hasSchemaExtension('roboinvestor')
  ),

  /**
   * For RoboSystems: All graphs except subgraphs
   */
  robosystems: excludeSubgraphs,

  /**
   * For general use: Only user-owned graphs (no repositories or subgraphs)
   */
  userGraphsOnly: onlyUserGraphs,

  /**
   * Show everything (no filtering)
   */
  all: () => true,
} as const
