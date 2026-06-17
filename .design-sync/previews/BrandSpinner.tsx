import { BrandSpinner } from '@robosystems/core'

/** High-impact brand loader — the animated logo, looping. */
export const Large = () => (
  <div className="text-gray-900">
    <BrandSpinner size="lg" />
  </div>
)

/** A smaller brand load for compact shells. */
export const Medium = () => (
  <div className="text-gray-900">
    <BrandSpinner size="md" />
  </div>
)
