import { createPortal } from 'react-dom'
import { useLinkLogs } from '../services/useSubsections'
import StatusPill from './StatusPill'
import Spinner from './Spinner'
import './VersionLogsDialog.css'

function formatDate(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function LinkLogsDialog({ link, sectionId, subsectionId, onClose }) {
  const { data: logs, isPending } = useLinkLogs(sectionId, subsectionId, link._id)

  return createPortal(
    <div className="version-logs-overlay" onClick={onClose}>
      <div className="version-logs-dialog" onClick={e => e.stopPropagation()}>
        <div className="version-logs-header">
          <div className="version-logs-title">
            <span className="version-logs-docname">{link.name}</span>
            <span className="version-logs-ver">Log History</span>
          </div>
          <button className="version-logs-close" onClick={onClose} aria-label="Close">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>
        {isPending && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '24px 20px', fontSize: '0.8rem', color: 'var(--text-muted, #888)' }}>
            <Spinner />
            <span>Loading logs…</span>
          </div>
        )}
        {!isPending && (!logs || logs.length === 0) && (
          <p className="version-logs-empty">No log entries for this link.</p>
        )}
        {!isPending && logs?.length > 0 && (
          <div className="version-logs-table">
            <div className="version-logs-table-header">
              <span>Status</span>
              <span>Message</span>
              <span>User</span>
              <span>Date</span>
            </div>
            {[...logs]
              .sort((a, b) => new Date(b._metadata?._createdAt) - new Date(a._metadata?._createdAt))
              .map((log, i) => (
                <div key={i} className={`version-logs-table-row${log.note ? ' version-logs-table-row--has-note' : ''}`}>
                  <span><StatusPill status={log.status ?? null} /></span>
                  <span className="version-log-cell version-log-cell-message" title={log.message}>{log.message ?? '—'}</span>
                  <span className="version-log-cell">{log.username ?? '—'}</span>
                  <span className="version-log-cell">{formatDate(log._metadata?._createdAt)}</span>
                  {log.note && (
                    <span className="version-log-note">{log.note}</span>
                  )}
                </div>
              ))
            }
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}

export default LinkLogsDialog
