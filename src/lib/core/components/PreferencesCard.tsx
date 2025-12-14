'use client'

import { Card, Label, ToggleSwitch } from 'flowbite-react'
import { useState } from 'react'
import { FaBolt } from 'react-icons/fa'
import { useCreditVisibility } from '../contexts/credit-visibility-context'

interface PreferencesCardProps {
  theme?: any
}

export function PreferencesCard({ theme }: PreferencesCardProps) {
  const { showCredits, setShowCredits } = useCreditVisibility()
  const [isSaving, setIsSaving] = useState(false)

  const handleCreditToggle = async (checked: boolean) => {
    setIsSaving(true)
    try {
      await setShowCredits(checked)
    } catch (error) {
      console.error('Failed to update credit visibility:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card theme={theme?.card}>
      <h5 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
        Display Preferences
      </h5>
      <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
        Customize how information is displayed in the application.
      </p>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FaBolt className="h-5 w-5 text-yellow-500" />
            <div>
              <Label htmlFor="credit-toggle" className="font-medium">
                Show Credit Balance
              </Label>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Display your credit balance in the navigation bar
              </p>
            </div>
          </div>
          <ToggleSwitch
            id="credit-toggle"
            checked={showCredits}
            onChange={handleCreditToggle}
            disabled={isSaving}
          />
        </div>
      </div>
    </Card>
  )
}
