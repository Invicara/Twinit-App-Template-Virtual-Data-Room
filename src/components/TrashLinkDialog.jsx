import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import './TrashLinkDialog.css'

function TrashLinkDialog({ linkName, onConfirm, onCancel }) {
  const cancelRef = useRef(null)

  useEffect(() => {
    cancelRef.current?.focus()
  }, [])

  return createPortal(
    <div className="trash-link-overlay" onClick={onCancel}>
      <div
        className="trash-link-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Trash link"
        onClick={e => e.stopPropagation()}
      >
        <div className="trash-link-header">
          <div className="trash-link-title">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="trash-link-icon">
              <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
            </svg>
            Trash Link
          </div>
          <button
            type="button"
            className="trash-link-close"
            onClick={onCancel}
            aria-label="Cancel"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>
        <div className="trash-link-body">
          <p className="trash-link-message">
            Are you sure you want to move <strong className="trash-link-name" title={linkName}>{linkName}</strong> to the trash? You will be able to restore it or permanently delete it later from the trash bin.
          </p>
          <div className="trash-link-actions">
            <button
              ref={cancelRef}
              type="button"
              className="trash-link-btn trash-link-btn--cancel"
              onClick={onCancel}
            >
              Cancel
            </button>
            <button
              type="button"
              className="trash-link-btn trash-link-btn--confirm"
              onClick={onConfirm}
            >
              Trash
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default TrashLinkDialog
