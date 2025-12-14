'use client'

import { GraphCreationModal, SDK } from '@/lib/core'
import { useRouter } from 'next/navigation'

interface CreateEntityGraphModalProps {
  buttonSize?: 'xs' | 'sm' | 'md' | 'lg'
  buttonText?: string
  showIcon?: boolean
}

// RoboLedger-specific validation for entity creation
const validateRoboLedgerEntity = (entity: any): string | null => {
  // Add any RoboLedger-specific validation here
  if (!entity.name || entity.name.trim().length < 2) {
    return 'Entity name must be at least 2 characters long'
  }

  // Additional validation rules can be added here
  // For example, checking for specific naming conventions, etc.

  return null
}

export default function CreateEntityGraphModal({
  buttonSize = 'sm',
  buttonText = 'Create Knowledge Graph',
  showIcon = true,
}: CreateEntityGraphModalProps) {
  const router = useRouter()

  const handleSuccess = async (graphId: string) => {
    try {
      // Select the newly created graph
      await SDK.selectGraph({
        path: { graph_id: graphId },
      })

      // Refresh the page to establish the new graph context
      // This ensures all providers and components are updated with the new graph
      window.location.reload()
    } catch (error) {
      console.error('Failed to select new entity:', error)
      // Still reload even if selection failed since entity was created
      window.location.reload()
    }
  }

  return (
    <GraphCreationModal
      // RoboLedger-specific configuration
      allowGenericGraphs={false} // Only entity graphs for RoboLedger
      requiredExtensions={['roboledger']} // Always include RoboLedger schema
      showTierSelection={true}
      validateEntity={validateRoboLedgerEntity}
      onSuccess={handleSuccess}
      // Button props
      buttonSize={buttonSize}
      buttonText={buttonText}
      showIcon={showIcon}
    />
  )
}
