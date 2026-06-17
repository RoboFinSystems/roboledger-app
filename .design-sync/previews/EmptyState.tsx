import { EmptyState } from '@robosystems/core'
import { HiOutlineFolderOpen, HiOutlineInbox } from 'react-icons/hi'

/** Full empty state: icon, title, supporting copy, and a call-to-action. */
export const WithAction = () => (
  <div className="max-w-md">
    <EmptyState
      icon={HiOutlineFolderOpen}
      title="No graphs yet"
      description="Create your first knowledge graph to start exploring connected financial data."
      action={
        <button
          type="button"
          className="bg-primary-600 hover:bg-primary-700 rounded-lg px-4 py-2 text-sm font-medium text-white"
        >
          Create graph
        </button>
      }
    />
  </div>
)

/** Minimal — just an icon, a title, and a short description. */
export const Minimal = () => (
  <div className="max-w-md">
    <EmptyState
      icon={HiOutlineInbox}
      title="You're all caught up"
      description="No new notifications."
    />
  </div>
)
