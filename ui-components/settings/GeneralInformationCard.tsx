'use client'

import * as SDK from '@robosystems/client'
import { Button } from 'flowbite-react'
import React, { useState } from 'react'
import { HiUser } from 'react-icons/hi'
import { Spinner } from '../Spinner'
import { SettingsCard } from '../forms/SettingsCard'
import { SettingsFormField } from '../forms/SettingsFormField'
import { StatusAlert } from '../forms/StatusAlert'
import type { AuthUser, UserUpdateData } from '../types'

export interface GeneralInformationCardProps {
  user: AuthUser
  theme?: any
  onUpdate?: (data: UserUpdateData) => Promise<void>
  onRefresh?: () => Promise<void>
  onSuccess?: (message: string) => void
  onError?: (message: string) => void
  className?: string
}

export const GeneralInformationCard: React.FC<GeneralInformationCardProps> = ({
  user,
  theme,
  onUpdate = undefined,
  onRefresh = undefined,
  onSuccess = undefined,
  onError = undefined,
  className = '',
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSuccess(false)

    const formData = new FormData(event.currentTarget)
    const updateData: UserUpdateData = {
      username: formData.get('username') as string,
      email: formData.get('email') as string,
    }

    setIsLoading(true)

    try {
      if (onUpdate) {
        await onUpdate(updateData)
      } else {
        const response = await SDK.updateUser({
          body: {
            name: updateData.username,
            email: updateData.email,
          },
        })
        if (response.error) {
          const detail =
            (response.error as any)?.detail?.detail ||
            (response.error as any)?.detail ||
            'Failed to update profile.'
          throw new Error(
            typeof detail === 'string' ? detail : 'Failed to update profile.'
          )
        }
      }

      if (onSuccess) {
        onSuccess('Profile updated successfully.')
      } else {
        setSuccess(true)
      }
      if (onRefresh) {
        await onRefresh()
      }
      setTimeout(() => {
        setIsLoading(false)
        setSuccess(false)
      }, 2000)
    } catch (err) {
      const msg =
        err instanceof Error && err.message
          ? err.message
          : 'Failed to update profile. Please try again.'
      if (onError) {
        onError(msg)
      } else {
        setError(msg)
      }
      setIsLoading(false)
    }
  }

  return (
    <SettingsCard
      title="General information"
      description="Update your account details"
      icon={HiUser}
      theme={theme?.card}
      className={className}
    >
      <div className="space-y-4">
        {error && (
          <StatusAlert type="error" message={error} theme={theme?.alert} />
        )}

        {success && (
          <StatusAlert
            type="success"
            message="Profile updated successfully."
            theme={theme?.alert}
          />
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <SettingsFormField
              id="username"
              label="Username"
              placeholder="Username"
              defaultValue={user.name}
              required
              theme={theme}
            />

            <SettingsFormField
              id="email"
              label="Email"
              type="email"
              placeholder="Email"
              defaultValue={user.email}
              required
              theme={theme}
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button
              theme={theme?.button}
              color="blue"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? <Spinner size="sm" /> : 'Save Changes'}
            </Button>
          </div>
        </div>
      </form>
    </SettingsCard>
  )
}
