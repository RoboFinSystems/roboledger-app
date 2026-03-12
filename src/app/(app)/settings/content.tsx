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
import { useAuth } from '@/lib/core/auth-components'
import { useToast } from '@/lib/core/hooks/use-toast'
import { Button } from 'flowbite-react'
import type { FC } from 'react'
import { useState } from 'react'
import { HiCog, HiMail } from 'react-icons/hi'

export interface UserProps {
  user: User
  onRefresh?: () => Promise<void>
}

const UserSettingsPageContent: FC<UserProps> = function ({ user, onRefresh }) {
  const { resendVerificationEmail } = useAuth()
  const { showSuccess, showError, ToastContainer } = useToast()
  const [resendLoading, setResendLoading] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [resendError, setResendError] = useState(false)

  const handleResendVerification = async () => {
    setResendLoading(true)
    setResendSuccess(false)
    setResendError(false)
    try {
      const result = await resendVerificationEmail(user.email)
      if (result.success) {
        setResendSuccess(true)
        setTimeout(() => setResendSuccess(false), 5000)
      } else {
        setResendError(true)
        setTimeout(() => setResendError(false), 5000)
      }
    } catch {
      setResendError(true)
      setTimeout(() => setResendError(false), 5000)
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <PageLayout>
      <ToastContainer />
      <PageHeader
        icon={HiCog}
        title="User Settings"
        description="Manage your account settings and preferences"
        gradient="from-gray-500 to-gray-700"
      />

      <div className="space-y-6">
        {user.emailVerified === false && (
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <HiMail className="h-5 w-5 shrink-0 text-zinc-400 dark:text-zinc-500" />
                <div>
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Email not verified
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {resendSuccess
                      ? 'Verification email sent! Check your inbox.'
                      : resendError
                        ? 'Failed to send verification email. Please try again.'
                        : 'Please verify your email address to secure your account.'}
                  </p>
                </div>
              </div>
              <Button
                size="xs"
                color="light"
                onClick={handleResendVerification}
                disabled={resendLoading || resendSuccess}
              >
                {resendLoading
                  ? 'Sending...'
                  : resendSuccess
                    ? 'Sent'
                    : 'Resend Verification'}
              </Button>
            </div>
          </div>
        )}

        <GeneralInformationCard
          user={{
            ...user,
            name: user.name,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }}
          theme={customTheme}
          onRefresh={onRefresh}
          onSuccess={showSuccess}
          onError={showError}
        />
        <PasswordInformationCard
          theme={customTheme}
          onSuccess={showSuccess}
          onError={showError}
        />
        <ApiKeysCard theme={customTheme} />
      </div>
    </PageLayout>
  )
}

export default UserSettingsPageContent
