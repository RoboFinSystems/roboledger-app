'use client'

import GraphLimitModal from '@/components/app/GraphLimitModal'
import {
  GraphCreationPage,
  useEntity,
  useGraphContext,
  useUser,
  useUserLimits,
} from '@/lib/core'
import { Spinner } from 'flowbite-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export function NewGraphContent() {
  const router = useRouter()
  const { user } = useUser()
  const { setCurrentGraph, refreshGraphs } = useGraphContext()
  const { setCurrentEntity } = useEntity()
  const { canCreateGraph, remainingGraphs, isLoading, limits } = useUserLimits()
  const [showContactModal, setShowContactModal] = useState(false)

  // Check limits when component mounts or when loading completes
  useEffect(() => {
    if (!isLoading && !canCreateGraph) {
      setShowContactModal(true)
    }
  }, [isLoading, canCreateGraph])

  const handleSuccess = async (graphId: string, result?: any) => {
    try {
      if (graphId) {
        await refreshGraphs()
        await setCurrentGraph(graphId)

        if (result?.initial_entity) {
          const entity = result.initial_entity
          await setCurrentEntity({
            identifier: entity.identifier || entity.uri,
            name: entity.name || entity.identifier,
            parentEntityId: entity.parent_entity_id,
            isParent: entity.is_parent,
          })
        }

        router.replace('/home')
        router.refresh()
      } else {
        router.push('/home')
      }
    } catch (error) {
      console.error('Failed to select new graph:', error)
      router.push('/home')
    }
  }

  const handleModalClose = () => {
    setShowContactModal(false)
    router.push('/home')
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
              {(limits?.max_graphs || 0) === 0
                ? 'Graph Access Required'
                : 'Graph Creation Limit Reached'}
            </h2>
            <p className="mb-6 text-gray-600 dark:text-gray-400">
              {(limits?.max_graphs || 0) === 0
                ? 'Graph creation requires approval. Request access to get started.'
                : `You have reached your maximum number of graphs (${limits?.max_graphs || 0} graphs allowed).`}
            </p>
            <button
              onClick={() => setShowContactModal(true)}
              className="text-blue-600 underline hover:text-blue-700"
            >
              {(limits?.max_graphs || 0) === 0
                ? 'Request access'
                : 'Request a higher limit'}
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
        allowGenericGraphs={false}
        requiredExtensions={['roboledger']}
        allowedExtensions={['roboledger', 'roboinvestor']}
        requireInitialEntity={true}
        showTierSelection={true}
        onSuccess={handleSuccess}
        backUrl="/home"
        title="Create New Accounting Graph"
      />
    </>
  )
}
