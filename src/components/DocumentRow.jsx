import { useState, useEffect, useRef } from 'react'
import { useDocumentVersions } from '../services/useDocuments'
import Spinner from './Spinner'
import StatusPill from './StatusPill'
import VersionLogsDialog from './VersionLogsDialog'
import { useSearchHighlight } from '../context/SearchHighlightContext'

function getStatus(doc) {
  const tag = doc._tags?.find(t => t.startsWith('status:'))
  return tag ? tag.slice('status:'.length) : null
}

function formatDate(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

/** PDF, Office, images supported by iaf-doc-viewer */
const VIEWABLE_EXTENSIONS = new Set([
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'xlsm', 'ppt', 'pptx',
  'jpg', 'jpeg', 'png', 'bmp', 'tiff', 'tif',
])

function canViewFileName(name) {
  const parts = String(name ?? '').split('.')
  return parts.length > 1 && VIEWABLE_EXTENSIONS.has(parts.pop().toLowerCase())
}

const eyeIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
    <path d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
    <path fillRule="evenodd" d="M.664 10.59a.75.75 0 0 1 0-.59c1.004-2.755 3.796-4.5 9.336-4.5s8.332 1.745 9.336 4.5a.75.75 0 0 1 0 .59c-1.004 2.755-3.796 4.5-9.336 4.5s-8.332-1.745-9.336-4.5ZM10 6.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" clipRule="evenodd" />
  </svg>
)

const downloadIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
    <path d="M10.75 2.75a.75.75 0 0 0-1.5 0v8.614L6.295 8.235a.75.75 0 1 0-1.09 1.03l4.25 4.5a.75.75 0 0 0 1.09 0l4.25-4.5a.75.75 0 0 0-1.09-1.03l-2.955 3.129V2.75Z" />
    <path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" />
  </svg>
)

function DocumentRow({ doc, onOpenViewer, statusOptions, onStatusChange, isStatusPending, onTrash, trashDisabled = false, showDownload = false, statusDisabled = false, onRestore, isRestoring = false }) {
  const [expanded, setExpanded] = useState(false)
  const [historyVersion, setHistoryVersion] = useState(null)
  const { data: versions, isPending: versionsLoading } = useDocumentVersions(doc._id, { enabled: expanded })
  const status = getStatus(doc)
  const showView = canViewFileName(doc._name)

  const { spotlight, setSpotlight } = useSearchHighlight()
  const highlighted = spotlight?.type === 'document' && spotlight?.itemId === doc._id
  const rowRef = useRef(null)

  useEffect(() => {
    if (highlighted && rowRef.current) {
      rowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [highlighted])

  function handleAnimationEnd() {
    if (highlighted) setSpotlight(null)
  }

  return (
    <>
      <div
        ref={rowRef}
        className={`document-table-row${expanded ? ' document-table-row--expanded' : ''}${highlighted ? ' document-table-row--highlighted' : ''}`}
        onAnimationEnd={handleAnimationEnd}
      >
        <button
          className={`document-row-toggle ${expanded ? 'document-row-toggle--open' : ''}`}
          onClick={() => setExpanded(e => !e)}
          aria-label={expanded ? 'Collapse versions' : 'Show version history'}
          tabIndex='0'
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z" clipRule="evenodd" />
          </svg>
        </button>
        <span className="document-cell document-cell-name" title={doc._name}>{doc._name}</span>
        <span className="document-cell document-cell-version">{doc._tipVersion}</span>
        <span className="document-cell document-cell-status">
          <StatusPill
            status={status}
            onChange={statusDisabled ? undefined : onStatusChange}
            options={statusDisabled ? undefined : statusOptions.filter(opt => opt !== status)}
            isPending={isStatusPending}
          />
        </span>
        {showView ? (
          <button
            type="button"
            className="document-row-view"
            onClick={() => onOpenViewer({ _id: doc._id, versionId: doc._tipId })}
            aria-label={`View ${doc._name}`}
            title="View document"
          >
            {eyeIcon}
          </button>
        ) : (
          <span className="document-row-view-spacer" aria-hidden="true" />
        )}
        {(doc._url || showDownload) ? (
          <a
            className="document-row-download"
            href={doc._url ?? '#'}
            download={doc._url ? doc._name : undefined}
            aria-label={`Download ${doc._name}`}
            title="Download document"
          >
            {downloadIcon}
          </a>
        ) : (
          <span className="document-row-download-spacer" aria-hidden="true" />
        )}
        {onRestore && (
          <button
            type="button"
            className={`document-row-restore${isRestoring ? ' document-row-restore--spinning' : ''}`}
            onClick={isRestoring ? undefined : onRestore}
            disabled={isRestoring}
            aria-label={`Restore ${doc._name}`}
            title="Restore"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 0 1-9.201 2.466l-.312-.311h2.433a.75.75 0 0 0 0-1.5H3.989a.75.75 0 0 0-.75.75v4.242a.75.75 0 0 0 1.5 0v-2.43l.31.31a7 7 0 0 0 11.712-3.138.75.75 0 0 0-1.449-.39Zm1.23-3.723a.75.75 0 0 0 .219-.53V2.929a.75.75 0 0 0-1.5 0V5.36l-.31-.31A7 7 0 0 0 3.239 8.188a.75.75 0 1 0 1.448.389A5.5 5.5 0 0 1 13.89 6.11l.311.31h-2.432a.75.75 0 0 0 0 1.5h4.243a.75.75 0 0 0 .53-.219Z" clipRule="evenodd" />
            </svg>
          </button>
        )}
        <button
          type="button"
          className={`document-row-trash${(trashDisabled || !onTrash) ? ' document-row-trash--disabled' : ''}`}
          onClick={onTrash && !trashDisabled ? onTrash : undefined}
          disabled={trashDisabled || !onTrash}
          aria-label={!onTrash ? 'Move to trash (not permitted)' : trashDisabled ? 'Delete (not yet implemented)' : `Move ${doc._name} to trash`}
          title={!onTrash ? 'Not permitted' : trashDisabled ? 'Not Yet Implemented' : 'Move to trash'}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      {expanded && (
        <div className="document-version-history">
          {versionsLoading && (
            <div className="document-version-loading">
              <Spinner />
              <span>Loading versions…</span>
            </div>
          )}
          {!versionsLoading && versions?.length > 0 && (
            <div className="document-version-header">
              <span />
              <span className="document-version-header-cell">Ver.</span>
              <span className="document-version-header-cell">Status</span>
              <span className="document-version-header-cell">Message</span>
              <span className="document-version-header-cell">User</span>
              <span className="document-version-header-cell">Date</span>
              <span />
              <span />
            </div>
          )}
          {!versionsLoading && versions?.map(v => {
            const log = v.logs?.[0]
            return (
              <div key={v._id} className="document-version-row">
                <span />
                <span className="document-version-cell document-version-cell-version">{v._version}</span>
                <span className="document-version-cell"><StatusPill status={log?.status ?? null} /></span>
                <span className="document-version-cell document-version-cell-message" title={log?.message}>{log?.message ?? '—'}</span>
                <span className="document-version-cell document-version-cell-username">{log?.username ?? '—'}</span>
                <span className="document-version-cell document-version-cell-date">{formatDate(log?._metadata?._createdAt)}</span>
                <a
                  className={`document-version-download${v._url ? '' : ' document-version-download--disabled'}`}
                  href={v._url ?? '#'}
                  download={v._url ? `${doc._name} (v${v._version})` : undefined}
                  aria-label={`Download version ${v._version}`}
                  title={v._url ? `Download v${v._version}` : 'No download available'}
                  onClick={v._url ? undefined : e => e.preventDefault()}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10.75 2.75a.75.75 0 0 0-1.5 0v8.614L6.295 8.235a.75.75 0 1 0-1.09 1.03l4.25 4.5a.75.75 0 0 0 1.09 0l4.25-4.5a.75.75 0 0 0-1.09-1.03l-2.955 3.129V2.75Z" />
                    <path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" />
                  </svg>
                </a>
                <button
                  type="button"
                  className="document-version-history-btn"
                  onClick={() => setHistoryVersion(v)}
                  aria-label="View full log history"
                  title="View full log history"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-13a.75.75 0 0 0-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 0 0 0-1.5h-3.25V5Z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            )
          })}
          {historyVersion && (
            <VersionLogsDialog
              version={historyVersion}
              docName={doc._name}
              onClose={() => setHistoryVersion(null)}
            />
          )}
        </div>
      )}
    </>
  )
}

export default DocumentRow
