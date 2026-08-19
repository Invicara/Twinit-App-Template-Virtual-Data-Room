import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import './TrashDocumentDialog.css'

function TrashDocumentDialog({ docName, onConfirm, onCancel }) {
  const cancelRef = useRef(null)

  useEffect(() => {
    cancelRef.current?.focus()
  }, [])

  return createPortal(
    <div className="trash-doc-overlay" onClick={onCancel}>
      <div
        className="trash-doc-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Trash document"
        onClick={e => e.stopPropagation()}
      >
        <div className="trash-doc-header">
          <div className="trash-doc-title">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="trash-doc-icon">
              <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
            </svg>
            Trash Document
          </div>
          <button
            type="button"
            className="trash-doc-close"
            onClick={onCancel}
            aria-label="Cancel"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>
        <div className="trash-doc-body">
          <p className="trash-doc-message">
            Are you sure you want to move <strong className="trash-doc-name" title={docName}>{docName}</strong> to the trash? You will be able to restore it or permanently delete it later from the trash bin.
          </p>
          <div className="trash-doc-actions">
            <button
              ref={cancelRef}
              type="button"
              className="trash-doc-btn trash-doc-btn--cancel"
              onClick={onCancel}
            >
              Cancel
            </button>
            <button
              type="button"
              className="trash-doc-btn trash-doc-btn--confirm"
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

export default TrashDocumentDialog
