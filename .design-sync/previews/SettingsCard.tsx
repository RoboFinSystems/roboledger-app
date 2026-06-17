import { SettingsCard, SettingsFormField } from '@robosystems/core'
import { HiBell, HiKey, HiOutlineGlobeAlt } from 'react-icons/hi'

/** Settings section with an icon chip, title, description, and form fields inside. */
export const WithIcon = () => (
  <div className="max-w-lg">
    <SettingsCard
      icon={HiKey}
      title="API Credentials"
      description="Manage the keys used to authenticate requests against your knowledge graphs."
    >
      <div className="space-y-4">
        <SettingsFormField
          id="api-key-name"
          label="Key name"
          defaultValue="Production ingestion"
        />
        <SettingsFormField
          id="api-key-scope"
          label="Allowed origin"
          defaultValue="https://app.roboledger.ai"
        />
      </div>
    </SettingsCard>
  </div>
)

/** Without an icon — a plain titled section. Here a danger-toned action footer. */
export const NoIcon = () => (
  <div className="max-w-lg">
    <SettingsCard
      title="Delete Graph"
      description="Permanently remove this knowledge graph and all of its entities. This cannot be undone."
    >
      <button
        type="button"
        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
      >
        Delete graph
      </button>
    </SettingsCard>
  </div>
)

/** Notification preferences — toggleable rows composed as children. */
export const Notifications = () => (
  <div className="max-w-lg">
    <SettingsCard
      icon={HiBell}
      title="Notifications"
      description="Choose which events send you an email."
    >
      <div className="divide-y divide-gray-100 dark:divide-gray-700">
        <label className="flex items-center justify-between py-3">
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Backup completed
          </span>
          <input
            type="checkbox"
            defaultChecked
            className="accent-primary-600 h-4 w-4"
          />
        </label>
        <label className="flex items-center justify-between py-3">
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Billing thresholds reached
          </span>
          <input
            type="checkbox"
            defaultChecked
            className="accent-primary-600 h-4 w-4"
          />
        </label>
        <label className="flex items-center justify-between py-3">
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Weekly usage digest
          </span>
          <input type="checkbox" className="accent-primary-600 h-4 w-4" />
        </label>
      </div>
    </SettingsCard>
  </div>
)

/** A region preference with a select control inside the card body. */
export const Region = () => (
  <div className="max-w-lg">
    <SettingsCard
      icon={HiOutlineGlobeAlt}
      title="Data Residency"
      description="Where your graph data is stored and processed."
    >
      <select
        defaultValue="us-east-1"
        className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
      >
        <option value="us-east-1">US East (N. Virginia)</option>
        <option value="eu-west-1">EU West (Ireland)</option>
        <option value="ap-southeast-2">Asia Pacific (Sydney)</option>
      </select>
    </SettingsCard>
  </div>
)
