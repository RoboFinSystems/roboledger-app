import { SettingsCard, SettingsContainer } from '@robosystems/core'
import { HiBell, HiUser } from 'react-icons/hi'

/** A settings page: stacked SettingsCards with consistent spacing. */
export const SettingsPage = () => (
  <SettingsContainer>
    <SettingsCard
      title="Profile"
      description="Your account name and contact details."
      icon={HiUser}
    >
      <div className="flex items-center justify-between border-t border-gray-100 pt-4 text-sm">
        <span className="text-gray-500">Display name</span>
        <span className="font-medium text-gray-900">Jordan Rivera</span>
      </div>
    </SettingsCard>
    <SettingsCard
      title="Notifications"
      description="Choose what we email you about."
      icon={HiBell}
    >
      <div className="flex items-center justify-between border-t border-gray-100 pt-4 text-sm">
        <span className="text-gray-500">Weekly usage summary</span>
        <span className="text-primary-600 font-medium">On</span>
      </div>
    </SettingsCard>
  </SettingsContainer>
)
