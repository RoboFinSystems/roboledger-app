'use client'

import { EntitySelector } from '@/components/EntitySelector'
import { ErrorBoundary } from '@/components/error/ErrorBoundary'
import {
  CoreNavbar,
  CoreSidebar,
  CURRENT_APP,
  GraphFilters,
  useGraphContext,
  useToast,
} from '@/lib/core'
import { useMemo } from 'react'
import { LayoutContent } from './layout-content'
import { getNavigationItems } from './sidebar-config'

interface LayoutWrapperProps {
  children: React.ReactNode
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  const { ToastContainer } = useToast()
  const { state } = useGraphContext()

  const hasQualifyingGraph = useMemo(
    () => state.graphs.filter(GraphFilters.roboledger).length > 0,
    [state.graphs]
  )

  const navigationItems = getNavigationItems(hasQualifyingGraph)

  return (
    <>
      <CoreNavbar
        appName="RoboLedger"
        currentApp={CURRENT_APP}
        additionalComponents={
          <div className="flex items-center gap-3">
            <EntitySelector />
          </div>
        }
        borderColorClass="dark:border-gray-800"
      />
      <div className="mt-16 flex items-start">
        <CoreSidebar
          navigationItems={navigationItems}
          features={{
            showOrgSection: false,
          }}
          additionalMobileComponents={<EntitySelector />}
          borderColorClass="dark:border-gray-800"
        />
        <LayoutContent>
          <ErrorBoundary>{children}</ErrorBoundary>
        </LayoutContent>
      </div>
      <ToastContainer />
    </>
  )
}
