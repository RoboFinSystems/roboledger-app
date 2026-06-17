import { StatCard } from '@robosystems/core'
import {
  HiChartBar,
  HiCurrencyDollar,
  HiDatabase,
  HiUsers,
} from 'react-icons/hi'

/** A metrics row — drop several into a grid. Icon sits value-left / icon-right. */
export const MetricsRow = () => (
  <div className="grid grid-cols-2 gap-4">
    <StatCard label="Total Graphs" value="12" icon={HiChartBar} />
    <StatCard label="Storage Used" value="1.2 GB" icon={HiDatabase} />
    <StatCard label="Monthly Spend" value="$3,480" icon={HiCurrencyDollar} />
    <StatCard label="Team Members" value="8" icon={HiUsers} />
  </div>
)

/** Without an icon — the value sits alone under its label. */
export const NoIcon = () => (
  <div className="max-w-xs">
    <StatCard label="Active Connections" value="247" />
  </div>
)
