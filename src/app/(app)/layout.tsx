import {
  AuthGuard,
  EntityProvider,
  GraphProvider,
  OrgProvider,
  ServiceOfferingsProvider,
  SidebarProvider,
  sidebarCookie,
} from '@/lib/core'
import { getEntitySelection } from '@/lib/core/actions/entity-actions'
import {
  getGraphSelection,
  persistGraphSelection,
} from '@/lib/core/actions/graph-actions'
import type { PropsWithChildren } from 'react'
import { LayoutWrapper } from './layout-wrapper'

export default async function DashboardLayout({ children }: PropsWithChildren) {
  const { isCollapsed } = await sidebarCookie.get()
  const initialGraphId = await getGraphSelection()
  const initialEntityCookie = await getEntitySelection()

  return (
    <AuthGuard>
      <OrgProvider>
        <ServiceOfferingsProvider>
          <GraphProvider
            initialGraphId={initialGraphId}
            persistGraphSelection={persistGraphSelection}
          >
            <EntityProvider initialEntityCookie={initialEntityCookie}>
              <SidebarProvider initialCollapsed={isCollapsed}>
                <LayoutWrapper>{children}</LayoutWrapper>
              </SidebarProvider>
            </EntityProvider>
          </GraphProvider>
        </ServiceOfferingsProvider>
      </OrgProvider>
    </AuthGuard>
  )
}
