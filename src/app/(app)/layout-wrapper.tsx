'use client'

import { EntitySelector } from '@/components/EntitySelector'
import { ErrorBoundary } from '@/components/error/ErrorBoundary'
import { CoreNavbar, CoreSidebar, useToast } from '@/lib/core'
import { LayoutContent } from './layout-content'
import { roboLedgerNavigationItems } from './sidebar-config'

interface LayoutWrapperProps {
  children: React.ReactNode
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  const { ToastContainer } = useToast()

  return (
    <>
      <CoreNavbar
        appName="RoboLedger"
        currentApp="roboledger"
        additionalComponents={
          <div className="flex items-center gap-3">
            <EntitySelector />
          </div>
        }
        borderColorClass="dark:border-gray-800"
      />
      <div className="mt-16 flex items-start">
        <CoreSidebar
          navigationItems={roboLedgerNavigationItems}
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
