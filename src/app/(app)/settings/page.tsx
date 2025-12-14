'use client'
import { useUser } from '@/lib/core'
import { Spinner } from '@/lib/core/ui-components'
import UserSettingsPageContent from './content'

export default function UsersListPage() {
  const { user, isLoading } = useUser()

  if (isLoading || !user) {
    return <Spinner size="xl" fullScreen />
  }

  return (
    <UserSettingsPageContent
      user={{
        ...user,
        name: user.name || 'Unknown User',
      }}
    />
  )
}
