'use client'

import { EntitySelector } from '@/components/EntitySelector'
import { ErrorBoundary } from '@/components/error/ErrorBoundary'
import {
  CoreNavbar,
  CoreSidebar,
  CURRENT_APP,
  GraphFilters,
  SupportModal,
  useGraphContext,
  useOrg,
  useToast,
} from '@/lib/core'
import { useMemo, useState } from 'react'
import { HiExclamationCircle, HiMail } from 'react-icons/hi'
import { LayoutContent } from './layout-content'
import { getNavigationItems } from './sidebar-config'

interface LayoutWrapperProps {
  children: React.ReactNode
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  const { ToastContainer } = useToast()
  const { state } = useGraphContext()
  const { currentOrg } = useOrg()
  const [isSupportOpen, setIsSupportOpen] = useState(false)

  const currentGraph =
    state.graphs.find((g) => g.graphId === state.currentGraphId) || null

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
          bottomMenuActions={[
            {
              label: 'Support',
              icon: HiMail,
              onClick: () => setIsSupportOpen(true),
              tooltip: 'Contact Support',
            },
            {
              label: 'Issues',
              icon: HiExclamationCircle,
              onClick: () =>
                window.open(
                  'https://github.com/RoboFinSystems/robosystems/issues',
                  '_blank'
                ),
              tooltip: 'Report an Issue',
            },
          ]}
          additionalMobileComponents={<EntitySelector />}
          borderColorClass="dark:border-gray-800"
        />
        <LayoutContent>
          <ErrorBoundary>{children}</ErrorBoundary>
        </LayoutContent>
      </div>
      <SupportModal
        isOpen={isSupportOpen}
        onClose={() => setIsSupportOpen(false)}
        metadata={{
          graphId: currentGraph?.graphId,
          graphName: currentGraph?.graphName,
          orgId: currentOrg?.id,
          orgName: currentOrg?.name,
          orgType: currentOrg?.org_type,
          userRole: currentGraph?.role,
        }}
      />
      <ToastContainer />
    </>
  )
}
