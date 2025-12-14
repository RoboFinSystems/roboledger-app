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
  className?: string
}

export const GeneralInformationCard: React.FC<GeneralInformationCardProps> = ({
  user,
  theme,
  onUpdate = undefined,
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
        // Use custom handler if provided
        await onUpdate(updateData)
      } else {
        // Use SDK as primary method
        await SDK.updateUser({
          body: {
            name: updateData.username,
            email: updateData.email,
          },
        })
      }

      setSuccess(true)
      setTimeout(() => {
        setIsLoading(false)
        setSuccess(false)
      }, 2000)
    } catch (err) {
      setError('Failed to update profile. Please try again.')
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
