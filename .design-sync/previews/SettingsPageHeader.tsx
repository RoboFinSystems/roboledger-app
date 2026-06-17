import { SettingsPageHeader } from '@robosystems/core'

/** Default header — a Home → Settings breadcrumb above the page title. */
export const Default = () => (
  <div className="max-w-2xl">
    <SettingsPageHeader />
  </div>
)

/** Custom title — used for a specific settings sub-page. */
export const CustomTitle = () => (
  <div className="max-w-2xl">
    <SettingsPageHeader title="Billing & usage" />
  </div>
)
