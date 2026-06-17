import { ConfirmModal } from '@robosystems/core'
import { HiTrash } from 'react-icons/hi'

/** A destructive-action confirmation, open. The caller supplies the warning copy. */
export const DeleteConfirmation = () => (
  <ConfirmModal
    show
    onClose={() => {}}
    onConfirm={() => {}}
    title="Delete Document"
    confirmLabel="Delete"
    confirmIcon={HiTrash}
  >
    <p className="text-sm text-gray-500 dark:text-gray-400">
      This will permanently delete{' '}
      <span className="font-medium text-gray-900 dark:text-white">
        Q3-Financials.pdf
      </span>{' '}
      and remove it from all linked graphs. This action cannot be undone.
    </p>
  </ConfirmModal>
)
