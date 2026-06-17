import { PageLayout, StatCard } from '@robosystems/core'
import { HiChartBar, HiCurrencyDollar, HiDatabase } from 'react-icons/hi'

/** Constrained page: centered max-width, vertical rhythm between sections. */
export const ConstrainedPage = () => (
  <PageLayout variant="constrained">
    <h1 className="font-heading text-2xl font-bold text-gray-900">Dashboard</h1>
    <div className="grid grid-cols-3 gap-4">
      <StatCard label="Total Graphs" value="12" icon={HiChartBar} />
      <StatCard label="Storage Used" value="1.2 GB" icon={HiDatabase} />
      <StatCard label="Monthly Spend" value="$3,480" icon={HiCurrencyDollar} />
    </div>
  </PageLayout>
)

/** Full-width variant — content spans the available width. */
export const FullWidth = () => (
  <PageLayout variant="full-width">
    <h1 className="font-heading text-2xl font-bold text-gray-900">
      Repositories
    </h1>
    <div className="grid grid-cols-2 gap-4">
      <StatCard label="Connected" value="6" icon={HiDatabase} />
      <StatCard label="Entities" value="1,204" icon={HiChartBar} />
    </div>
  </PageLayout>
)
