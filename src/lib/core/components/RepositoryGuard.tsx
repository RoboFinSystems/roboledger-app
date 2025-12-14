'use client'

import { Alert, Button, Card } from 'flowbite-react'
import { useRouter } from 'next/navigation'
import { useEffect, type ReactNode } from 'react'
import { HiInformationCircle } from 'react-icons/hi'
import { useGraphContext } from '../contexts/graph-context'
import { customTheme } from '../theme'

export interface RepositoryGuardProps {
  children: ReactNode
  /**
   * What to do when a repository is selected
   * - 'redirect': Redirect to a different page (default: /console)
   * - 'block': Show a message but don't redirect
   * - 'hide': Return null (hide the content)
   */
  mode?: 'redirect' | 'block' | 'hide'
  /**
   * Page to redirect to when mode is 'redirect'
   */
  redirectTo?: string
  /**
   * Custom message to show when blocking
   */
  message?: string
}

/**
 * Guard component that prevents access to pages that don't work with repositories.
 *
 * Use this to wrap pages that are only for user graphs (not shared repositories):
 * - Graph creation/deletion
 * - Schema modifications
 * - Subgraphs
 * - Backups
 * - etc.
 *
 * Pages that SHOULD work with repositories (don't wrap with this):
 * - Console (queries work!)
 * - Usage/Credits
 * - Billing
 * - Dashboard (with limited features)
 *
 * @example
 * ```tsx
 * export default function SchemaPage() {
 *   return (
 *     <RepositoryGuard mode="redirect" redirectTo="/console">
 *       <SchemaEditor />
 *     </RepositoryGuard>
 *   )
 * }
 * ```
 */
export function RepositoryGuard({
  children,
  mode = 'redirect',
  redirectTo = '/console',
  message = 'This feature is not available for shared repositories.',
}: RepositoryGuardProps) {
  const { state } = useGraphContext()
  const router = useRouter()

  // Find the current graph
  const currentGraph = state.graphs.find(
    (g) => g.graphId === state.currentGraphId
  )

  // Check if current graph is a repository
  const isRepository = currentGraph?.isRepository ?? false

  useEffect(() => {
    if (isRepository && mode === 'redirect') {
      router.push(redirectTo)
    }
  }, [isRepository, mode, redirectTo, router])

  // If not a repository, show children normally
  if (!isRepository) {
    return <>{children}</>
  }

  // Handle different modes
  switch (mode) {
    case 'hide':
      return null

    case 'redirect':
      // Show loading state while redirecting
      return (
        <div className="flex min-h-screen items-center justify-center">
          <Card theme={customTheme.card}>
            <div className="text-center">
              <HiInformationCircle className="mx-auto mb-4 h-12 w-12 text-gray-400" />
              <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
                Redirecting...
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {message}
              </p>
            </div>
          </Card>
        </div>
      )

    case 'block':
      // Show message without redirecting
      return (
        <div className="p-4">
          <Alert color="info" icon={HiInformationCircle}>
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium">
                  Not Available for Repositories
                </span>
                <div className="mt-1 text-sm">{message}</div>
              </div>
              <Button size="sm" onClick={() => router.push('/console')}>
                Go to Console
              </Button>
            </div>
          </Alert>
        </div>
      )

    default:
      return <>{children}</>
  }
}

/**
 * Hook to check if the current graph is a repository.
 * Useful for conditional rendering without full guards.
 *
 * @example
 * ```tsx
 * const { isRepository, currentGraph } = useIsRepository()
 *
 * return (
 *   <div>
 *     {!isRepository && <DeleteGraphButton />}
 *     <QueryConsole />
 *   </div>
 * )
 * ```
 */
export function useIsRepository() {
  const { state } = useGraphContext()

  const currentGraph = state.graphs.find(
    (g) => g.graphId === state.currentGraphId
  )

  return {
    isRepository: currentGraph?.isRepository ?? false,
    currentGraph,
    graphType: currentGraph?.isRepository ? 'repository' : 'graph',
  }
}
