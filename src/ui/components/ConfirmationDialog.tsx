import { useEffect, useRef } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { formatBytes } from '../format'
import { Button } from './Primitives'

export interface ConfirmationDialogProps {
  open: boolean
  fileCount: number
  selectedBytes: number
  onCancel: () => void
  onConfirm: () => void
  isSubmitting?: boolean
}

export function ConfirmationDialog({
  open,
  fileCount,
  selectedBytes,
  onCancel,
  onConfirm,
  isSubmitting = false,
}: ConfirmationDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const confirmButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (open && !dialog.open) {
      dialog.showModal()
      confirmButtonRef.current?.focus()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  return (
    <dialog
      className="confirmation-dialog"
      ref={dialogRef}
      aria-labelledby="confirmation-title"
      aria-describedby="confirmation-description"
      onCancel={(event) => {
        event.preventDefault()
        if (!isSubmitting) onCancel()
      }}
      onClose={() => {
        if (open && !isSubmitting) onCancel()
      }}
    >
      <div className="confirmation-dialog__header">
        <span className="confirmation-dialog__icon"><AlertTriangle aria-hidden="true" /></span>
        <button className="icon-button" type="button" onClick={onCancel} disabled={isSubmitting} aria-label="Close confirmation">
          <X aria-hidden="true" />
        </button>
      </div>
      <h2 id="confirmation-title">Simulate this cleanup?</h2>
      <p id="confirmation-description">
        This removes {fileCount} {fileCount === 1 ? 'record' : 'records'} from the demo inventory and reports {formatBytes(selectedBytes)} as simulated logical space reclaimed.
      </p>
      <div className="dialog-disclosure">
        <strong>Sample files only</strong>
        <span>No files on this device will be changed.</span>
      </div>
      <div className="confirmation-dialog__actions">
        <Button variant="secondary" type="button" onClick={onCancel} disabled={isSubmitting}>Cancel</Button>
        <Button ref={confirmButtonRef} type="button" onClick={onConfirm} isLoading={isSubmitting}>Simulate cleanup</Button>
      </div>
    </dialog>
  )
}
