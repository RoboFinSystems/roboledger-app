'use client'

import type {
  LibraryClient,
  LibraryTaxonomy,
} from '@robosystems/client/clients'
import { useState } from 'react'
import { ElementDetail } from './ElementDetail'
import { StructureTreeView } from './StructureTreeView'
import { StructuresBrowser } from './StructuresBrowser'

/**
 * The audit/authoring surface for taxonomy structures (presentation,
 * calculation, definition, dimension hierarchies). Three-pane layout:
 *
 *   - StructuresBrowser (left)  — pick a structure within the chosen taxonomy
 *   - StructureTreeView (mid)   — render its arcs as a DAG with badges
 *   - ElementDetail (right)     — element detail for the clicked node
 *
 * Read-only. Shares the chosen taxonomy with the Elements pane via
 * the parent page so toggling modes preserves context.
 */
export function StructuresPane({
  client,
  graphId,
  taxonomyId,
  taxonomies,
  onTaxonomyChange,
}: {
  client: LibraryClient
  graphId: string
  taxonomyId: string | null
  taxonomies?: LibraryTaxonomy[]
  onTaxonomyChange?: (id: string) => void
}) {
  const [selectedStructureId, setSelectedStructureId] = useState<string | null>(
    null
  )
  const [selectedElementId, setSelectedElementId] = useState<string | null>(
    null
  )

  const handleTaxonomyChange = (id: string) => {
    setSelectedStructureId(null)
    setSelectedElementId(null)
    onTaxonomyChange?.(id)
  }

  const handleSelectStructure = (id: string) => {
    setSelectedStructureId(id)
    setSelectedElementId(null)
  }

  return (
    <>
      <StructuresBrowser
        client={client}
        graphId={graphId}
        taxonomyId={taxonomyId}
        taxonomies={taxonomies}
        onTaxonomyChange={handleTaxonomyChange}
        selectedStructureId={selectedStructureId}
        onSelectStructure={handleSelectStructure}
      />
      <StructureTreeView
        client={client}
        graphId={graphId}
        taxonomyId={taxonomyId}
        structureId={selectedStructureId}
        onSelectElement={setSelectedElementId}
        selectedElementId={selectedElementId}
      />
      <ElementDetail
        client={client}
        graphId={graphId}
        elementId={selectedElementId}
        onSelectElement={setSelectedElementId}
        colSpanClass="md:col-span-3"
      />
    </>
  )
}
