'use client'

import { ErrorBoundary } from '@/components/error/ErrorBoundary'
import { GraphSelector } from '@/components/graphs/GraphSelector'
import {
  CURRENT_APP,
  CoreNavbar,
  CoreSidebar,
  useGraphContext,
  useToast,
} from '@/lib/core'
import { LayoutContent } from './layout-content'
import { getNavigationItems } from './sidebar-config'

interface LayoutWrapperProps {
  children: React.ReactNode
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  const { ToastContainer } = useToast()
  const { state } = useGraphContext()

  // Get current graph
  const currentGraph =
    state.graphs.find((g) => g.graphId === state.currentGraphId) || null

  // Get navigation items based on current graph (handles repository filtering)
  const navigationItems = getNavigationItems(currentGraph)

  return (
    <>
      <ToastContainer />
      <CoreNavbar
        appName="RoboSystems"
        currentApp={CURRENT_APP}
        borderColorClass="dark:border-gray-800"
        additionalComponents={<GraphSelector />}
      />
      <div className="mt-16 flex items-start">
        <CoreSidebar
          navigationItems={navigationItems}
          features={{
            aiChat: false,
            companyDropdown: false,
          }}
          bottomMenuActions={[]}
          borderColorClass="dark:border-gray-800"
        />
        <LayoutContent>
          <ErrorBoundary>{children}</ErrorBoundary>
        </LayoutContent>
      </div>
    </>
  )
}
