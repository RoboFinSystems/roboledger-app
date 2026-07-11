'use client'
import { useUser } from '@robosystems/core'
import { Spinner } from '@robosystems/core/ui-components'
import UserSettingsPageContent from './content'

export default function UsersListPage() {
  const { user, isLoading, refreshUser } = useUser()

  if (isLoading || !user) {
    return <Spinner size="xl" fullScreen />
  }

  return (
    <UserSettingsPageContent
      user={{
        ...user,
        name: user.name || 'Unknown User',
      }}
      onRefresh={async () => {
        await refreshUser()
      }}
    />
  )
}
