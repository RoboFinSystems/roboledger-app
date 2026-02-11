'use client'

import { GraphCreationPage, useEntity, useGraphContext } from '@/lib/core'
import { useRouter } from 'next/navigation'

export function NewGraphContent() {
  const router = useRouter()
  const { setCurrentGraph, refreshGraphs } = useGraphContext()
  const { setCurrentEntity } = useEntity()

  const handleSuccess = async (graphId: string, result?: any) => {
    try {
      if (graphId) {
        // First refresh the graphs to ensure the new graph is in the list
        await refreshGraphs()

        // Then select the new graph through the context
        // This will update both the backend and the cookie
        await setCurrentGraph(graphId)

        // If an entity was created, select it
        if (result?.initial_entity) {
          const entity = result.initial_entity
          await setCurrentEntity({
            identifier: entity.identifier || entity.uri,
            name: entity.name || entity.identifier,
            parentEntityId: entity.parent_entity_id,
            isParent: entity.is_parent,
          })
        }

        // Use replace instead of push to prevent back button issues
        // and force a fresh mount of the home component
        router.replace('/home')

        // Trigger a router refresh to ensure all components re-render with new context
        router.refresh()
      } else {
        // If no graphId, just navigate
        router.push('/home')
      }
    } catch (error) {
      console.error('Failed to select new graph:', error)
      // Still navigate even if selection failed since graph was created
      router.push('/home')
    }
  }

  return (
    <GraphCreationPage
      // RoboLedger-specific configuration
      allowGenericGraphs={false} // Only allow entity graphs
      requiredExtensions={['roboledger']} // Require roboledger schema
      requireInitialEntity={true} // Always create with initial entity
      showTierSelection={true}
      onSuccess={handleSuccess}
      backUrl="/home"
      title="Create New Accounting Graph"
    />
  )
}
