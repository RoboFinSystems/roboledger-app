import { PageHeader } from '@robosystems/core'
import { HiChartBar, HiCog, HiDatabase } from 'react-icons/hi'

/** Full header: brand-gradient icon chip, title, subtitle, and right-aligned actions. */
export const WithActions = () => (
  <div className="w-full max-w-3xl">
    <PageHeader
      icon={HiChartBar}
      title="Knowledge Graphs"
      subtitle="12 graphs across 3 repositories"
      actions={
        <>
          <button
            type="button"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200"
          >
            Import
          </button>
          <button
            type="button"
            className="bg-primary-600 hover:bg-primary-700 rounded-lg px-4 py-2 text-sm font-medium text-white"
          >
            New graph
          </button>
        </>
      }
    />
  </div>
)

/** Title and subtitle only — no actions on the right. */
export const TitleAndSubtitle = () => (
  <div className="w-full max-w-3xl">
    <PageHeader
      icon={HiDatabase}
      title="SEC Repository"
      subtitle="Public filings · 4.2M entities · last synced 6 minutes ago"
    />
  </div>
)

/** Minimal — just the gradient icon chip and a title. */
export const TitleOnly = () => (
  <div className="w-full max-w-3xl">
    <PageHeader icon={HiCog} title="Settings" />
  </div>
)
