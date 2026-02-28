'use client'

import GraphLimitModal from '@/components/app/GraphLimitModal'
import { useGraphContext, useUser, useUserLimits } from '@/lib/core'
import { GraphCreationPage } from '@/lib/core/components/graph-creation'
import { Spinner } from 'flowbite-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export function NewGraphContent() {
  const router = useRouter()
  const { user } = useUser()
  const { setCurrentGraph, refreshGraphs } = useGraphContext()
  const { canCreateGraph, remainingGraphs, isLoading, limits } = useUserLimits()
  const [showContactModal, setShowContactModal] = useState(false)

  // Check limits when component mounts or when loading completes
  useEffect(() => {
    if (!isLoading && !canCreateGraph) {
      setShowContactModal(true)
    }
  }, [isLoading, canCreateGraph])

  const handleSuccess = async (graphId: string) => {
    try {
      if (graphId) {
        // First refresh the graphs to ensure the new graph is in the list
        await refreshGraphs()

        // Then select the new graph through the context
        // This will update both the backend and the cookie
        await setCurrentGraph(graphId)

        // Use replace instead of push to prevent back button issues
        // and force a fresh mount of the dashboard component
        router.replace('/dashboard')

        // Trigger a router refresh to ensure all components re-render with new context
        router.refresh()
      } else {
        // If no graphId, just navigate
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Failed to select new graph:', error)
      // Still navigate even if selection failed since graph was created
      router.push('/dashboard')
    }
  }

  const handleModalClose = () => {
    setShowContactModal(false)
    router.push('/dashboard')
  }

  // Show loading while checking limits
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="xl" />
      </div>
    )
  }

  // Show contact modal if user can't create graphs
  if (!canCreateGraph) {
    return (
      <>
        <GraphLimitModal
          isOpen={showContactModal}
          onClose={handleModalClose}
          userEmail={user?.email || ''}
          currentLimit={limits?.max_graphs || 0}
        />
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <h2 className="font-heading mb-4 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              Graph Creation Limit Reached
            </h2>
            <p className="mb-6 text-gray-600 dark:text-gray-400">
              You have reached your maximum number of graphs (
              {limits?.max_graphs || 0} graphs allowed).
            </p>
            <button
              onClick={() => setShowContactModal(true)}
              className="text-blue-600 underline hover:text-blue-700"
            >
              Request a higher limit
            </button>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      {remainingGraphs <= 3 && remainingGraphs > 0 && (
        <div className="mx-auto mb-4 max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-900/20">
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              You have {remainingGraphs} graph{remainingGraphs !== 1 ? 's' : ''}{' '}
              remaining in your limit.
            </p>
          </div>
        </div>
      )}
      <GraphCreationPage
        // RoboSystems-specific configuration
        allowGenericGraphs={true} // Allow both entity and generic graphs
        requiredExtensions={[]} // No required extensions for flexibility
        allowedExtensions={['roboledger', 'roboinvestor']} // Only show relevant schemas
        showTierSelection={true}
        onSuccess={handleSuccess}
        backUrl="/dashboard"
        title="Create New Knowledge Graph"
      />
    </>
  )
}
