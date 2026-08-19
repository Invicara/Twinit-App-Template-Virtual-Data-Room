import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import IafDocViewer from '@dtplatform/iaf-doc-viewer'
import { useTrash } from '../services/useSearch'
import { useDocumentStatuses, useUntrashDocument, useDeleteDocument } from '../services/useDocuments'
import { useUntrashLink, useUntrashSubsection, useDeleteSubsection, useDeleteLink } from '../services/useSubsections'
import { useUntrashSection, useDeleteSection } from '../services/useSections'
import DocumentRow from '../components/DocumentRow'
import LinkLogsDialog from '../components/LinkLogsDialog'
import StatusPill from '../components/StatusPill'
import Spinner from '../components/Spinner'
import DeleteConfirmDialog from '../components/DeleteConfirmDialog'
import { SearchHighlightProvider } from '../context/SearchHighlightContext'
import { useUser } from '../context/UserContext'
import '../components/SubsectionRow.css'
import './TrashBin.css'

function TrashDocumentTable({ documents }) {
  const [viewerDocId, setViewerDocId] = useState(null)
  const [pendingDeleteDoc, setPendingDeleteDoc] = useState(null)
  const { data: statuses } = useDocumentStatuses()
  const { mutate: untrashDocument, isPending: isRestorePending, variables: restoreVariables } = useUntrashDocument()
  const { mutateAsync: deleteDocument } = useDeleteDocument()

  const statusOptions = (statuses ?? []).map(s => (typeof s === 'string' ? s : (s._name ?? s.name ?? String(s))))

  function handleRestore(doc) {
    untrashDocument(
      { sectionId: doc.sectionId, subsectionId: doc.subsectionId, fileid: doc._id }
    )
  }

  return (
    <>
      <div className="document-table trash-document-table">
        <div className="document-table-header">
          <span />
          <span className="document-header-name">Name</span>
          <span className="document-header-version">Version</span>
          <span className="document-header-status">Status</span>
          <span className="document-header-view" aria-hidden="true" />
          <span aria-hidden="true" />
          <span aria-hidden="true" />
          <span aria-hidden="true" />
        </div>
        {documents.map(doc => (
          <DocumentRow
            key={doc._id}
            doc={doc}
            onOpenViewer={setViewerDocId}
            statusOptions={statusOptions}
            onStatusChange={() => {}}
            isStatusPending={false}
            onTrash={() => setPendingDeleteDoc(doc)}
            statusDisabled
            showDownload
            onRestore={() => handleRestore(doc)}
            isRestoring={isRestorePending && restoreVariables?.fileid === doc._id}
          />
        ))}
      </div>
      {viewerDocId && (
        <div
          className="document-viewer-backdrop"
          role="presentation"
          onClick={() => setViewerDocId(null)}
        >
          <div
            className="document-viewer-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Document viewer"
            onClick={e => e.stopPropagation()}
          >
            <button
              type="button"
              className="document-viewer-close"
              onClick={() => setViewerDocId(null)}
              aria-label="Close document viewer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
              </svg>
            </button>
            <div className="document-viewer-frame">
              <IafDocViewer
                docIds={[{ _fileId: viewerDocId._id, _fileVersionId: viewerDocId.versionId }]}
                onClose={() => setViewerDocId(null)}
                style={{ height: '100%', width: '100%' }}
              />
            </div>
          </div>
        </div>
      )}
      {pendingDeleteDoc && (
        <DeleteConfirmDialog
          title="Permanently Delete Document"
          message={
            <div>
              <p>
                You are about to permanently delete the document{' '}
                <strong>{pendingDeleteDoc._name}</strong>.
              </p>
              <span className="del-confirm-warning">This action cannot be undone.</span>
            </div>
          }
          confirmLabel="Delete Permanently"
          onConfirm={() => deleteDocument({ sectionId: pendingDeleteDoc.sectionId, subsectionId: pendingDeleteDoc.subsectionId, fileid: pendingDeleteDoc._id })}
          onClose={() => setPendingDeleteDoc(null)}
        />
      )}
    </>
  )
}

const trashIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
  </svg>
)

const historyIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-13a.75.75 0 0 0-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 0 0 0-1.5h-3.25V5Z" clipRule="evenodd" />
  </svg>
)

const openLinkIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M4.25 5.5a.75.75 0 0 0-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 0 0 .75-.75v-4a.75.75 0 0 1 1.5 0v4A2.25 2.25 0 0 1 12.75 17h-8.5A2.25 2.25 0 0 1 2 14.75v-8.5A2.25 2.25 0 0 1 4.25 4h5a.75.75 0 0 1 0 1.5h-5Zm6.75-3a.75.75 0 0 1 .75-.75h5.25a.75.75 0 0 1 .75.75v5.25a.75.75 0 0 1-1.5 0V4.06l-6.22 6.22a.75.75 0 1 1-1.06-1.06L15.44 3H11a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
  </svg>
)

const restoreIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 0 1-9.201 2.466l-.312-.311h2.433a.75.75 0 0 0 0-1.5H3.989a.75.75 0 0 0-.75.75v4.242a.75.75 0 0 0 1.5 0v-2.43l.31.31a7 7 0 0 0 11.712-3.138.75.75 0 0 0-1.449-.39Zm1.23-3.723a.75.75 0 0 0 .219-.53V2.929a.75.75 0 0 0-1.5 0V5.36l-.31-.31A7 7 0 0 0 3.239 8.188a.75.75 0 1 0 1.448.389A5.5 5.5 0 0 1 13.89 6.11l.311.31h-2.432a.75.75 0 0 0 0 1.5h4.243a.75.75 0 0 0 .53-.219Z" clipRule="evenodd" />
  </svg>
)

function TrashLinkTable({ links }) {
  const [historyLink, setHistoryLink] = useState(null)
  const [pendingDeleteLink, setPendingDeleteLink] = useState(null)
  const { mutate: untrashLink, isPending: isRestorePending, variables: restoreVariables } = useUntrashLink()
  const { mutateAsync: deleteLink } = useDeleteLink()

  function handleRestore(link) {
    untrashLink(
      { sectionId: link.sectionId, subsectionId: link.subsectionId, linkId: link._id }
    )
  }

  return (
    <>
      <div className="link-table trash-link-table">
        <div className="link-table-header">
          <span className="link-header-cell link-header-cell--left">Name</span>
          <span className="link-header-cell link-header-cell--left">Description</span>
          <span className="link-header-cell">Status</span>
          <span aria-hidden="true" />
          <span aria-hidden="true" />
          <span aria-hidden="true" />
          <span aria-hidden="true" />
          <span aria-hidden="true" />
        </div>
        {links.map(link => (
          <div key={link._id} className="link-table-row">
            <span className="link-cell link-cell-name" title={link.name}>{link.name}</span>
            <span className="link-cell link-cell-description" title={link.description}>{link.description || '—'}</span>
            <span className="link-cell link-cell-status">
              <StatusPill status={link.status ?? null} />
            </span>
            <span aria-hidden="true" />
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="link-row-open"
              aria-label={`Open ${link.name}`}
              title={link.url}
            >
              {openLinkIcon}
            </a>
            <button
              type="button"
              className="link-row-history"
              onClick={() => setHistoryLink(link)}
              aria-label={`View log history for ${link.name}`}
              title="View log history"
            >
              {historyIcon}
            </button>
            <button
              type="button"
              className={`link-row-restore${isRestorePending && restoreVariables?.linkId === link._id ? ' link-row-restore--spinning' : ''}`}
              onClick={isRestorePending && restoreVariables?.linkId === link._id ? undefined : () => handleRestore(link)}
              disabled={isRestorePending && restoreVariables?.linkId === link._id}
              aria-label={`Restore ${link.name}`}
              title="Restore"
            >
              {restoreIcon}
            </button>
            <button
              type="button"
              className="link-row-delete"
              onClick={() => setPendingDeleteLink(link)}
              aria-label={`Permanently delete ${link.name}`}
              title="Permanently Delete"
            >
              {trashIcon}
            </button>
          </div>
        ))}
      </div>
      {historyLink && (
        <LinkLogsDialog
          link={historyLink}
          sectionId={historyLink.sectionId ?? null}
          subsectionId={historyLink.subsectionId ?? null}
          onClose={() => setHistoryLink(null)}
        />
      )}
      {pendingDeleteLink && (
        <DeleteConfirmDialog
          title="Permanently Delete Link"
          message={
            <div>
              <p>
                You are about to permanently delete the link{' '}
                <strong>{pendingDeleteLink.name}</strong>.
              </p>
              <span className="del-confirm-warning">This action cannot be undone.</span>
            </div>
          }
          confirmLabel="Delete Permanently"
          onConfirm={() => deleteLink({ sectionId: pendingDeleteLink.sectionId, subsectionId: pendingDeleteLink.subsectionId, linkId: pendingDeleteLink._id })}
          onClose={() => setPendingDeleteLink(null)}
        />
      )}
    </>
  )
}

function TrashSubsectionTable({ subsections }) {
  const { mutate: untrashSubsection, isPending: isRestorePending, variables: restoreVariables } = useUntrashSubsection()
  const { mutateAsync: deleteSubsection } = useDeleteSubsection()
  const [pendingDeleteSubsection, setPendingDeleteSubsection] = useState(null)

  return (
    <>
      <div className="link-table trash-link-table">
        <div className="link-table-header">
          <span className="link-header-cell link-header-cell--left">Number</span>
          <span className="link-header-cell link-header-cell--left">Name</span>
          <span aria-hidden="true" />
          <span aria-hidden="true" />
          <span aria-hidden="true" />
          <span aria-hidden="true" />
          <span aria-hidden="true" />
          <span aria-hidden="true" />
        </div>
        {subsections.map(subsection => (
          <div key={subsection._id} className="link-table-row">
            <span className="link-cell link-cell-name" title={subsection.number}>{subsection.number}</span>
            <span className="link-cell link-cell-description" title={subsection.name}>{subsection.name}</span>
            <span aria-hidden="true" />
            <span aria-hidden="true" />
            <span aria-hidden="true" />
            <span aria-hidden="true" />
            <button
              type="button"
              className={`link-row-restore${isRestorePending && restoreVariables?.subsectionId === subsection._id ? ' link-row-restore--spinning' : ''}`}
              onClick={isRestorePending && restoreVariables?.subsectionId === subsection._id ? undefined : () => untrashSubsection({ sectionId: subsection.sectionId, subsectionId: subsection._id })}
              disabled={isRestorePending && restoreVariables?.subsectionId === subsection._id}
              aria-label={`Restore ${subsection.name}`}
              title="Restore"
            >
              {restoreIcon}
            </button>
            <button
              type="button"
              className="link-row-delete"
              onClick={() => setPendingDeleteSubsection(subsection)}
              aria-label={`Permanently delete ${subsection.name}`}
              title="Permanently Delete"
            >
              {trashIcon}
            </button>
          </div>
        ))}
      </div>
      {pendingDeleteSubsection && (
        <DeleteConfirmDialog
          title="Permanently Delete Subsection"
          message={
            <div>
              <p>
                You are about to permanently delete the subsection{' '}
                <strong>{pendingDeleteSubsection.number} — {pendingDeleteSubsection.name}</strong>.
              </p>
              <p>
                This will also delete all documents and links in this subsection.
              </p>
              <span className="del-confirm-warning">This action cannot be undone.</span>
            </div>
          }
          confirmLabel="Delete Permanently"
          onConfirm={() => deleteSubsection({ sectionId: pendingDeleteSubsection.sectionId, subsectionId: pendingDeleteSubsection._id })}
          onClose={() => setPendingDeleteSubsection(null)}
        />
      )}
    </>
  )
}

function TrashSectionTable({ sections }) {
  const { mutate: untrashSection, isPending: isRestorePending, variables: restoreVariables } = useUntrashSection()
  const { mutateAsync: deleteSection } = useDeleteSection()
  const [pendingDeleteSection, setPendingDeleteSection] = useState(null)

  return (
    <>
      <div className="link-table trash-link-table">
        <div className="link-table-header">
          <span className="link-header-cell link-header-cell--left">Number</span>
          <span className="link-header-cell link-header-cell--left">Name</span>
          <span aria-hidden="true" />
          <span aria-hidden="true" />
          <span aria-hidden="true" />
          <span aria-hidden="true" />
          <span aria-hidden="true" />
          <span aria-hidden="true" />
        </div>
        {sections.map(section => (
          <div key={section._id} className="link-table-row">
            <span className="link-cell link-cell-name" title={section.number}>{section.number}</span>
            <span className="link-cell link-cell-description" title={section.name}>{section.name}</span>
            <span aria-hidden="true" />
            <span aria-hidden="true" />
            <span aria-hidden="true" />
            <span aria-hidden="true" />
            <button
              type="button"
              className={`link-row-restore${isRestorePending && restoreVariables === section._id ? ' link-row-restore--spinning' : ''}`}
              onClick={isRestorePending && restoreVariables === section._id ? undefined : () => untrashSection(section._id)}
              disabled={isRestorePending && restoreVariables === section._id}
              aria-label={`Restore ${section.name}`}
              title="Restore"
            >
              {restoreIcon}
            </button>
            <button
              type="button"
              className="link-row-delete"
              onClick={() => setPendingDeleteSection(section)}
              aria-label={`Permanently delete ${section.name}`}
              title="Permanently Delete"
            >
              {trashIcon}
            </button>
          </div>
        ))}
      </div>
      {pendingDeleteSection && (
        <DeleteConfirmDialog
          title="Permanently Delete Section"
          message={
            <div>
              <p>
                You are about to permanently delete the section{' '}
                <strong>{pendingDeleteSection.number} — {pendingDeleteSection.name}</strong>.
              </p>
              <p>
                This will also delete all subsections in this section and all documents and links in those subsections.
              </p>
              <span className="del-confirm-warning">This action cannot be undone.</span>
            </div>
          }
          confirmLabel="Delete Permanently"
          onConfirm={() => deleteSection(pendingDeleteSection._id)}
          onClose={() => setPendingDeleteSection(null)}
        />
      )}
    </>
  )
}

function TrashBin() {
  const navigate = useNavigate()
  const { roles, userLoading } = useUser()

  useEffect(() => {
    if (!userLoading && !roles?.room_admin) {
      navigate('/', { replace: true })
    }
  }, [userLoading, roles, navigate])

  const { data, isLoading, isRefetching, error } = useTrash()

  const sections = data?.sections ?? []
  const subsections = data?.subsections ?? []
  const documents = data?.documents ?? []
  const links = data?.links ?? []

  return (
    <div className="trash-bin">
      <div className="trash-bin-header">
        <Link to="/" className="trash-bin-back">← Back to Room</Link>
        <h2 className="trash-bin-title">
          {!isRefetching && <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="trash-bin-title-icon" aria-hidden="true">
            <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
          </svg>}
          {isRefetching && <Spinner />}
          Trash Bin
          
        </h2>
      </div>

      {isLoading && (
        <div className="trash-bin-status">
          <Spinner /> Loading…
        </div>
      )}
      {error && (
        <div className="trash-bin-status trash-bin-error">Error: {error.message}</div>
      )}

      {!isLoading && !error && (
        <>
          <section className="trash-bin-section">
            <h3 className="trash-bin-section-title">Sections</h3>
            {sections.length === 0 ? (
              <p className="trash-bin-empty">No sections in trash.</p>
            ) : (
              <TrashSectionTable sections={sections} />
            )}
          </section>

          <section className="trash-bin-section">
            <h3 className="trash-bin-section-title">Subsections</h3>
            {subsections.length === 0 ? (
              <p className="trash-bin-empty">No subsections in trash.</p>
            ) : (
              <TrashSubsectionTable subsections={subsections} />
            )}
          </section>

          <section className="trash-bin-section">
            <h3 className="trash-bin-section-title">Documents</h3>
            {documents.length === 0 ? (
              <p className="trash-bin-empty">No documents in trash.</p>
            ) : (
              <SearchHighlightProvider>
                <TrashDocumentTable documents={documents} />
              </SearchHighlightProvider>
            )}
          </section>

          <section className="trash-bin-section">
            <h3 className="trash-bin-section-title">Links</h3>
            {links.length === 0 ? (
              <p className="trash-bin-empty">No links in trash.</p>
            ) : (
              <TrashLinkTable links={links} />
            )}
          </section>
        </>
      )}
    </div>
  )
}

export default TrashBin
