import { SettingsFormField } from '@robosystems/core'

/** A standard text field with a label and a prefilled value. */
export const Text = () => (
  <div className="max-w-sm">
    <SettingsFormField
      id="org-name"
      label="Organization name"
      defaultValue="Harbinger Finance"
    />
  </div>
)

/** Email field with placeholder, marked required. */
export const Email = () => (
  <div className="max-w-sm">
    <SettingsFormField
      id="billing-email"
      label="Billing email"
      type="email"
      placeholder="finance@harbinger.co"
      required
    />
  </div>
)

/** Stacked fields — the layout used down a settings form. */
export const Stacked = () => (
  <div className="max-w-sm space-y-4">
    <SettingsFormField
      id="graph-slug"
      label="Graph identifier"
      defaultValue="kg-prod-9f3a"
    />
    <SettingsFormField
      id="retention-days"
      label="Backup retention (days)"
      type="number"
      defaultValue="30"
      min={1}
      max={365}
    />
  </div>
)

/** Disabled field — a read-only value the user cannot edit. */
export const Disabled = () => (
  <div className="max-w-sm">
    <SettingsFormField
      id="graph-region"
      label="Region (locked)"
      defaultValue="us-east-1"
      disabled
    />
  </div>
)
