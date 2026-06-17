import { LogoBadge } from '@robosystems/core'

/** The mark as an app-icon chip: a white logo on the brand gradient. */
export const Sizes = () => (
  <div className="flex items-center gap-4">
    <LogoBadge className="h-10 w-10" />
    <LogoBadge className="h-12 w-12" />
    <LogoBadge className="h-16 w-16" />
  </div>
)

/** Cross-app safe — renders the correct gradient for each app (used in the AppSwitcher). */
export const AllApps = () => (
  <div className="flex items-center gap-4">
    <LogoBadge app="robosystems" className="h-14 w-14" />
    <LogoBadge app="roboledger" className="h-14 w-14" />
    <LogoBadge app="roboinvestor" className="h-14 w-14" />
  </div>
)
