'use client'
import { useUser } from '@robosystems/core'
import { Spinner } from '@robosystems/core/ui-components'
import { default as EntitiesListPageContent } from './content'

export default function EntitiesPage() {
  const { user, isLoading } = useUser()

  if (isLoading || !user) {
    return <Spinner size="xl" fullScreen />
  }

  return <EntitiesListPageContent />
}
