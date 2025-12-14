'use client'

import * as SDK from '@robosystems/client'
import { Button } from 'flowbite-react'
import React, { useState } from 'react'
import { HiLockClosed } from 'react-icons/hi'
import { Spinner } from '../Spinner'
import { PasswordRequirements } from '../forms/PasswordRequirements'
import { SettingsCard } from '../forms/SettingsCard'
import { SettingsFormField } from '../forms/SettingsFormField'
import { StatusAlert } from '../forms/StatusAlert'
import type { PasswordUpdateData } from '../types'

export interface PasswordInformationCardProps {
  theme?: any
  onUpdate?: (data: PasswordUpdateData) => Promise<void>
  className?: string
}

export const PasswordInformationCard: React.FC<
  PasswordInformationCardProps
> = ({ theme, onUpdate = undefined, className = '' }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSuccess(false)

    const formData = new FormData(event.currentTarget)
    const updateData: PasswordUpdateData = {
      currentPassword: formData.get('currentPassword') as string,
      newPassword: formData.get('newPassword') as string,
      confirmPassword: formData.get('confirmPassword') as string,
    }

    // Client-side validation
    if (updateData.newPassword !== updateData.confirmPassword) {
      setError('New password and confirmation do not match')
      return
    }

    setIsLoading(true)

    try {
      if (onUpdate) {
        await onUpdate(updateData)
      } else {
        await SDK.updateUserPassword({
          body: {
            current_password: updateData.currentPassword,
            new_password: updateData.newPassword,
            confirm_password: updateData.confirmPassword,
          },
        })
      }

      setSuccess(true)
      // Clear form fields
      event.currentTarget.reset()
      setTimeout(() => {
        setIsLoading(false)
        setSuccess(false)
      }, 2000)
    } catch (err) {
      setError('Failed to update password. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <SettingsCard
      title="Password information"
      description="Update your password to keep your account secure"
      icon={HiLockClosed}
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
            message="Password updated successfully."
            theme={theme?.alert}
          />
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <SettingsFormField
              id="currentPassword"
              label="Current password"
              type="password"
              placeholder="••••••••"
              theme={theme}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <SettingsFormField
              id="newPassword"
              label="New password"
              type="password"
              placeholder="••••••••"
              theme={theme}
            />

            <SettingsFormField
              id="confirmPassword"
              label="Confirm password"
              type="password"
              placeholder="••••••••"
              theme={theme}
            />
          </div>

          <PasswordRequirements />

          <div className="flex justify-end pt-2">
            <Button
              theme={theme?.button}
              color="blue"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? <Spinner size="sm" /> : 'Update Password'}
            </Button>
          </div>
        </div>
      </form>
    </SettingsCard>
  )
}
