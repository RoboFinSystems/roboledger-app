'use client'

import * as SDK from '@robosystems/client'
import { Button } from 'flowbite-react'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { HiLockClosed } from 'react-icons/hi'
import { Spinner } from '../Spinner'
import { SettingsCard } from '../forms/SettingsCard'
import { SettingsFormField } from '../forms/SettingsFormField'
import { StatusAlert } from '../forms/StatusAlert'
import type { PasswordUpdateData } from '../types'

interface PasswordStrengthResult {
  score: number
  strength: string
  errors: string[]
  suggestions: string[]
  is_valid: boolean
}

export interface PasswordInformationCardProps {
  theme?: any
  onUpdate?: (data: PasswordUpdateData) => Promise<void>
  onSuccess?: (message: string) => void
  onError?: (message: string) => void
  className?: string
}

export const PasswordInformationCard: React.FC<
  PasswordInformationCardProps
> = ({
  theme,
  onUpdate = undefined,
  onSuccess = undefined,
  onError = undefined,
  className = '',
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [passwordStrength, setPasswordStrength] =
    useState<PasswordStrengthResult | null>(null)
  const [checkingPassword, setCheckingPassword] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  const checkPassword = useCallback(async (password: string) => {
    if (password.length < 4) {
      setPasswordStrength(null)
      return
    }
    setCheckingPassword(true)
    try {
      const response = await SDK.checkPasswordStrength({
        body: { password } as any,
      })
      const data = response.data as any
      setPasswordStrength({
        score: data?.score || 0,
        strength: data?.strength || 'very-weak',
        errors: data?.errors || [],
        suggestions: data?.suggestions || [],
        is_valid: data?.is_valid || false,
      })
    } catch {
      setPasswordStrength(null)
    } finally {
      setCheckingPassword(false)
    }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (newPassword.length < 4) {
      setPasswordStrength(null)
      return
    }
    debounceRef.current = setTimeout(() => {
      checkPassword(newPassword)
    }, 400)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [newPassword, checkPassword])

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
      const msg = 'New password and confirmation do not match'
      if (onError) {
        onError(msg)
      } else {
        setError(msg)
      }
      return
    }

    if (checkingPassword) {
      setError('Checking password strength, please wait...')
      return
    }

    if (passwordStrength && !passwordStrength.is_valid) {
      const msg =
        passwordStrength.errors.length > 0
          ? passwordStrength.errors.join('. ')
          : 'Password does not meet requirements'
      if (onError) {
        onError(msg)
      } else {
        setError(msg)
      }
      return
    }

    setIsLoading(true)
    const form = event.currentTarget

    try {
      if (onUpdate) {
        await onUpdate(updateData)
      } else {
        const response = await SDK.updateUserPassword({
          body: {
            current_password: updateData.currentPassword,
            new_password: updateData.newPassword,
            confirm_password: updateData.confirmPassword,
          },
        })
        if (response.error) {
          const detail =
            (response.error as any)?.detail?.detail ||
            (response.error as any)?.detail ||
            'Failed to update password.'
          throw new Error(
            typeof detail === 'string' ? detail : 'Failed to update password.'
          )
        }
      }

      if (onSuccess) {
        onSuccess('Password updated successfully.')
      } else {
        setSuccess(true)
      }
      // Clear form fields and strength state
      form.reset()
      setNewPassword('')
      setPasswordStrength(null)
      setTimeout(() => {
        setIsLoading(false)
        setSuccess(false)
      }, 2000)
    } catch (err) {
      const msg =
        err instanceof Error && err.message
          ? err.message
          : 'Failed to update password. Please try again.'
      if (onError) {
        onError(msg)
      } else {
        setError(msg)
      }
      setIsLoading(false)
    }
  }

  const strengthBarColor = !passwordStrength
    ? ''
    : passwordStrength.score < 30
      ? 'bg-red-500'
      : passwordStrength.score < 60
        ? 'bg-yellow-500'
        : passwordStrength.score < 80
          ? 'bg-blue-400'
          : 'bg-green-500'

  const strengthTextColor = !passwordStrength
    ? ''
    : passwordStrength.score < 30
      ? 'text-red-400'
      : passwordStrength.score < 60
        ? 'text-yellow-400'
        : passwordStrength.score < 80
          ? 'text-blue-300'
          : 'text-green-400'

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
              onChange={(e) => setNewPassword(e.target.value)}
            />

            <SettingsFormField
              id="confirmPassword"
              label="Confirm password"
              type="password"
              placeholder="••••••••"
              theme={theme}
            />
          </div>

          <div className="min-h-[2.75rem]">
            {passwordStrength && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-700">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${strengthBarColor}`}
                      style={{ width: `${passwordStrength.score}%` }}
                    />
                  </div>
                  <span
                    className={`text-xs font-medium capitalize ${strengthTextColor}`}
                  >
                    {passwordStrength.strength.replace('-', ' ')}
                  </span>
                </div>
                {passwordStrength.errors.length > 0 && (
                  <p className="text-xs text-red-400">
                    {passwordStrength.errors[0]}
                  </p>
                )}
                {passwordStrength.errors.length === 0 &&
                  passwordStrength.suggestions.length > 0 && (
                    <p className="text-xs text-gray-400">
                      {passwordStrength.suggestions[0]}
                    </p>
                  )}
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <Button
              theme={theme?.button}
              color="blue"
              type="submit"
              disabled={isLoading || checkingPassword}
            >
              {isLoading ? <Spinner size="sm" /> : 'Update Password'}
            </Button>
          </div>
        </div>
      </form>
    </SettingsCard>
  )
}
