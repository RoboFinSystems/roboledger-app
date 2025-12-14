'use client'

import { PageHeader } from '@/components/PageHeader'
import { customTheme, PageLayout, useEntity, useGraphContext } from '@/lib/core'
import { Alert, Badge, Card } from 'flowbite-react'
import { type FC } from 'react'
import { HiOfficeBuilding } from 'react-icons/hi'

const EntityInfoPageContent: FC = function () {
  const { state: graphState } = useGraphContext()
  const { currentEntity } = useEntity()

  return (
    <PageLayout>
      <PageHeader
        icon={HiOfficeBuilding}
        title="Entity Details"
        description={
          currentEntity?.name || 'View entity information and settings'
        }
        gradient="from-indigo-500 to-purple-600"
      />

      <div className="space-y-6">
        {!currentEntity ? (
          <Card theme={customTheme.card}>
            <div className="py-8 text-center">
              <HiOfficeBuilding className="mx-auto mb-4 h-16 w-16 text-gray-400" />
              <h3 className="font-heading mb-4 text-xl font-bold dark:text-white">
                No Entity Selected
              </h3>
              <p className="mb-4 text-gray-500 dark:text-gray-400">
                Please select an entity from the Entity selector in the header
                to view its details.
              </p>
              {!graphState.currentGraphId && (
                <Alert
                  theme={customTheme.alert}
                  color="info"
                  className="mt-4 text-left"
                >
                  <span className="font-medium">No graph selected.</span> Please
                  select a graph first.
                </Alert>
              )}
            </div>
          </Card>
        ) : (
          <>
            {/* Entity Overview Card */}
            <Card theme={customTheme.card}>
              <div className="mb-4 border-b border-gray-200 pb-4 dark:border-gray-600">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Entity Information
                </h2>
              </div>
              <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <dt className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">
                    Name
                  </dt>
                  <dd className="text-base font-semibold text-gray-900 dark:text-white">
                    {currentEntity.name}
                  </dd>
                </div>
                <div>
                  <dt className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">
                    Identifier
                  </dt>
                  <dd className="font-mono text-sm text-gray-900 dark:text-white">
                    {currentEntity.identifier}
                  </dd>
                </div>
                {currentEntity.entityType && (
                  <div>
                    <dt className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">
                      Entity Type
                    </dt>
                    <dd>
                      <Badge color="gray" size="sm">
                        {currentEntity.entityType}
                      </Badge>
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">
                    Relationship
                  </dt>
                  <dd>
                    {currentEntity.isParent ? (
                      <Badge color="success" size="sm">
                        Parent Entity
                      </Badge>
                    ) : currentEntity.parentEntityId ? (
                      <div className="flex flex-col gap-1">
                        <Badge color="warning" size="sm">
                          Subsidiary
                        </Badge>
                        <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
                          Parent: {currentEntity.parentEntityId}
                        </span>
                      </div>
                    ) : (
                      <Badge color="gray" size="sm">
                        Standalone
                      </Badge>
                    )}
                  </dd>
                </div>
              </dl>
            </Card>
          </>
        )}
      </div>
    </PageLayout>
  )
}

export default EntityInfoPageContent
