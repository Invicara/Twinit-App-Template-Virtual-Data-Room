import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import StatusPill from './StatusPill'
import './StatusNoteDialog.css'

function StatusNoteDialog({ docName, newStatus, onConfirm, onCancel }) {
  const [note, setNote] = useState('')
  const textareaRef = useRef(null)

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  function handleSubmit(e) {
    e.preventDefault()
    onConfirm(note)
  }

  return createPortal(
    <div className="status-note-overlay" onClick={onCancel}>
      <div
        className="status-note-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Update document status"
        onClick={e => e.stopPropagation()}
      >
        <div className="status-note-header">
          <div className="status-note-title">
            <span className="status-note-docname" title={docName}>{docName}</span>
            <span className="status-note-subtitle">
              Setting status to <StatusPill status={newStatus} />
            </span>
          </div>
          <button
            type="button"
            className="status-note-close"
            onClick={onCancel}
            aria-label="Cancel"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>
        <form className="status-note-body" onSubmit={handleSubmit}>
          <label className="status-note-label" htmlFor="status-note-input">
            Note <span className="status-note-optional">(optional)</span>
          </label>
          <textarea
            id="status-note-input"
            ref={textareaRef}
            className="status-note-textarea"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Add a note about this status change…"
            rows={3}
          />
          <div className="status-note-actions">
            <button type="button" className="status-note-btn status-note-btn--cancel" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="status-note-btn status-note-btn--confirm">
              Update Status
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}

export default StatusNoteDialog
