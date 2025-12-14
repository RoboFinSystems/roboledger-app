'use client'

import { PageHeader } from '@/components/PageHeader'
import type { User } from '@/lib/core'
import {
  ApiKeysCard,
  customTheme,
  GeneralInformationCard,
  PageLayout,
  PasswordInformationCard,
} from '@/lib/core'
import type { FC } from 'react'
import { HiCog } from 'react-icons/hi'

export interface UserProps {
  user: User
}

const UserSettingsPageContent: FC<UserProps> = function ({ user }) {
  return (
    <PageLayout>
      <PageHeader
        icon={HiCog}
        title="User Settings"
        description="Manage your account settings and preferences"
        gradient="from-gray-500 to-gray-700"
      />

      <div className="space-y-6">
        <GeneralInformationCard
          user={{
            ...user,
            name: user.name,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }}
          theme={customTheme}
        />
        <PasswordInformationCard theme={customTheme} />
        <ApiKeysCard theme={customTheme} />
      </div>
    </PageLayout>
  )
}

export default UserSettingsPageContent
