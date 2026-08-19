import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Spinner from './Spinner'
import './DeleteConfirmDialog.css'

function DeleteConfirmDialog({ title, message, confirmLabel = 'Delete', onConfirm, onClose }) {
  const [isDeleting, setIsDeleting] = useState(false)
  const cancelRef = useRef(null)

  useEffect(() => {
    cancelRef.current?.focus()
  }, [])

  async function handleConfirm() {
    setIsDeleting(true)
    try {
      await onConfirm()
      onClose()
    } catch {
      setIsDeleting(false)
    }
  }

  return createPortal(
    <div className="del-confirm-overlay" onClick={isDeleting ? undefined : onClose}>
      <div
        className="del-confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        onClick={e => e.stopPropagation()}
      >
        <div className="del-confirm-header">
          <div className="del-confirm-title">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="del-confirm-icon" aria-hidden="true">
              <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
            </svg>
            {title}
          </div>
          <button
            type="button"
            className="del-confirm-close"
            onClick={onClose}
            disabled={isDeleting}
            aria-label="Cancel"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>
        <div className="del-confirm-body">
          <div className="del-confirm-message">{message}</div>
          <div className="del-confirm-actions">
            <button
              ref={cancelRef}
              type="button"
              className="del-confirm-btn del-confirm-btn--cancel"
              onClick={onClose}
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button
              type="button"
              className="del-confirm-btn del-confirm-btn--delete"
              onClick={handleConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? <Spinner className="del-confirm-spinner" /> : null}
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default DeleteConfirmDialog
