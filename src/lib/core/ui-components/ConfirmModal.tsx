import {
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from 'flowbite-react'
import type { ComponentType, ReactNode } from 'react'
import { Spinner } from './Spinner'

interface ConfirmModalProps {
  /** Whether the modal is open. */
  show: boolean
  /** Dismiss handler (Cancel button + backdrop/close). Ignored while `loading`. */
  onClose: () => void
  /** Invoked when the confirm button is pressed. */
  onConfirm: () => void
  /** Header title, e.g. "Delete Document". */
  title: string
  /** Body content — the warning copy and/or item details. */
  children?: ReactNode
  /** Confirm button label (default "Delete"). */
  confirmLabel?: string
  /** Confirm button label shown while `loading` (default "Deleting…"). */
  loadingLabel?: string
  /** Optional icon on the confirm button, e.g. `HiTrash`. */
  confirmIcon?: ComponentType<{
    className?: string
    'aria-hidden'?: boolean | 'true'
  }>
  /** Confirm button color (default "failure"). */
  confirmColor?: string
  /** Cancel button label (default "Cancel"). */
  cancelLabel?: string
  /** When true, disables both buttons and shows a spinner in the confirm button. */
  loading?: boolean
  /** Modal size (default "md"). */
  size?: string
}

/**
 * A confirmation dialog for a single irreversible action (delete, etc.). Owns
 * the modal chrome and the Cancel / Confirm buttons — including the
 * disabled-while-pending and confirm-button-spinner behavior — while the caller
 * supplies the warning copy and any item details as `children`.
 *
 * The caller drives the async flow: pass `loading` while the action runs (the
 * dialog can't be dismissed during it), and close the modal in your handler.
 */
export function ConfirmModal({
  show,
  onClose,
  onConfirm,
  title,
  children,
  confirmLabel = 'Delete',
  loadingLabel = 'Deleting…',
  confirmIcon: ConfirmIcon,
  confirmColor = 'failure',
  cancelLabel = 'Cancel',
  loading = false,
  size = 'md',
}: ConfirmModalProps) {
  const handleClose = () => {
    if (!loading) onClose()
  }

  return (
    <Modal show={show} onClose={handleClose} size={size}>
      <ModalHeader>{title}</ModalHeader>
      <ModalBody>{children}</ModalBody>
      <ModalFooter>
        <Button color={confirmColor} onClick={onConfirm} disabled={loading}>
          {loading ? (
            <>
              <Spinner size="sm" className="mr-2 text-white" />
              {loadingLabel}
            </>
          ) : (
            <>
              {ConfirmIcon && (
                <ConfirmIcon className="mr-2 h-4 w-4" aria-hidden="true" />
              )}
              {confirmLabel}
            </>
          )}
        </Button>
        <Button color="gray" onClick={handleClose} disabled={loading}>
          {cancelLabel}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
