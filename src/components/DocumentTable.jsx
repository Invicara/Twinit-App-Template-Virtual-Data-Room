import { useState } from 'react'
import IafDocViewer from '@dtplatform/iaf-doc-viewer'
import { useDocumentStatuses, useUpdateDocumentStatus, useTrashDocument } from '../services/useDocuments'
import StatusNoteDialog from './StatusNoteDialog'
import TrashDocumentDialog from './TrashDocumentDialog'
import DocumentRow from './DocumentRow'
import './DocumentTable.css'

function DocumentTable({ documents, sectionId, subsectionId, canChangeStatus = true, canTrash = true }) {
  const [viewerDocId, setViewerDocId] = useState(null)
  const [pendingChange, setPendingChange] = useState(null)
  const [pendingTrash, setPendingTrash] = useState(null)
  const { data: statuses } = useDocumentStatuses()
  const { mutate: updateStatus, isPending: isStatusPending, variables: statusVariables } = useUpdateDocumentStatus(sectionId, subsectionId)
  const { mutate: trashDocument } = useTrashDocument()

  function handleTrashConfirm() {
    trashDocument(
      { sectionId, subsectionId, fileid: pendingTrash._id },
      { onSettled: () => setPendingTrash(null) }
    )
  }

  const statusOptions = (statuses ?? []).map(s => (typeof s === 'string' ? s : (s._name ?? s.name ?? String(s))))

  function handleStatusChange(doc, status) {
    setPendingChange({ docId: doc._id, docName: doc._name, status })
  }

  function handleNoteConfirm(note) {
    updateStatus({ docId: pendingChange.docId, status: pendingChange.status, note })
    setPendingChange(null)
  }

  return (
    <>
      <div className="document-table">
        <div className="document-table-header">
          <span />
          <span className="document-header-name">Name</span>
          <span className="document-header-version">Version</span>
          <span className="document-header-status">Status</span>
          <span className="document-header-view" aria-hidden="true" />
          <span aria-hidden="true" />
          <span aria-hidden="true" />
        </div>
        {documents.map(doc => (
          <DocumentRow
            key={doc._id}
            doc={doc}
            onOpenViewer={setViewerDocId}
            statusOptions={statusOptions}
            onStatusChange={(status) => handleStatusChange(doc, status)}
            isStatusPending={isStatusPending && statusVariables?.docId === doc._id}
            onTrash={canTrash ? () => setPendingTrash(doc) : undefined}
            statusDisabled={!canChangeStatus}
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
                docIds={
                  [
                    {
                      _fileId: viewerDocId._id,
                      _fileVersionId: viewerDocId.versionId
                    }
                  ]
                }
                onClose={() => setViewerDocId(null)}
                style={{ height: '100%', width: '100%' }}
              />
            </div>
          </div>
        </div>
      )}
      {pendingChange && (
        <StatusNoteDialog
          docName={pendingChange.docName}
          newStatus={pendingChange.status}
          onConfirm={handleNoteConfirm}
          onCancel={() => setPendingChange(null)}
        />
      )}
      {pendingTrash && (
        <TrashDocumentDialog
          docName={pendingTrash._name}
          onConfirm={handleTrashConfirm}
          onCancel={() => setPendingTrash(null)}
        />
      )}
    </>
  )
}

export default DocumentTable
