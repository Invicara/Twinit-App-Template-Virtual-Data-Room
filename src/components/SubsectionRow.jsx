import { useState, useRef, useEffect } from 'react'

import { useDocuments, useUploadDocuments, useDocumentStatuses } from '../services/useDocuments'
import { useLinks, useCreateLink, useTrashLink, useUpdateLinkStatus } from '../services/useSubsections'
import EditSubsectionDialog from './EditSubsectionDialog'
import DocumentTable from './DocumentTable'
import SubsectionStatusBar from './SubsectionStatusBar'
import Spinner from './Spinner'
import StatusPill from './StatusPill'
import StatusNoteDialog from './StatusNoteDialog'
import EditLinkDialog from './EditLinkDialog'
import TrashLinkDialog from './TrashLinkDialog'
import LinkLogsDialog from './LinkLogsDialog'
import { useSearchHighlight } from '../context/SearchHighlightContext'
import { useUser } from '../context/UserContext'
import './SubsectionRow.css'


function SubsectionRow({ section, subsection, subsections, expanded, onToggleExpanded }) {
  const { roles } = useUser()
  const sectionRole = roles?.[section._id]
  const isViewer = sectionRole === 'Section Viewer'
  const canChangeStatus = sectionRole !== 'Section Viewer' && sectionRole !== 'Section Contributor'
  const canEditSubsection = sectionRole !== 'Section Viewer' && sectionRole !== 'Section Contributor'

  const { data: documents, isPending: isLoading, error: documentsError } = useDocuments(section._id, subsection._id, { enabled: expanded })
  const { mutate: uploadDocuments, isPending: isUploading } = useUploadDocuments(section._id, subsection._id, subsection.folderId)

  const [showEditDialog, setShowEditDialog] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(null)
  const [uploadError, setUploadError] = useState(null)
  const fileInputRef = useRef(null)

  const [linkName, setLinkName] = useState('')
  const [linkDescription, setLinkDescription] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [linkError, setLinkError] = useState(null)

  const { data: links, isPending: isLinksLoading } = useLinks(section._id, subsection._id, { enabled: expanded })
  const { mutate: createLink, isPending: isCreatingLink } = useCreateLink()
  const { mutate: deleteLink } = useTrashLink()
  const { mutate: updateLinkStatus, isPending: isLinkStatusPending, variables: linkStatusVariables } = useUpdateLinkStatus()
  const { data: statuses } = useDocumentStatuses()
  const statusOptions = (statuses ?? []).map(s => (typeof s === 'string' ? s : (s._name ?? s.name ?? String(s))))

  const [pendingDeleteLink, setPendingDeleteLink] = useState(null)
  const [pendingStatusChange, setPendingStatusChange] = useState(null)
  const [editingLink, setEditingLink] = useState(null)
  const [historyLink, setHistoryLink] = useState(null)

  const { spotlight, setSpotlight } = useSearchHighlight()
  const linkRowRefs = useRef({})

  useEffect(() => {
    if (
      spotlight?.type === 'link' &&
      spotlight.subsectionId === subsection._id &&
      links?.length
    ) {
      const el = linkRowRefs.current[spotlight.itemId]
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }, [spotlight, links, subsection._id])

  function handleStatusNoteConfirm(note) {
    updateLinkStatus({
      sectionId: section._id,
      subsectionId: subsection._id,
      linkId: pendingStatusChange.link._id,
      linkData: { status: pendingStatusChange.status, note: note || undefined }
    })
    setPendingStatusChange(null)
  }

  function handleDeleteConfirm() {
    deleteLink(
      { sectionId: section._id, subsectionId: subsection._id, linkId: pendingDeleteLink._id },
      { onSettled: () => setPendingDeleteLink(null) }
    )
  }

  function handleAddLink(e) {
    e.preventDefault()
    setLinkError(null)
    if (!linkName.trim()) {
      setLinkError('Name is required.')
      return
    }
    if (!linkUrl.trim()) {
      setLinkError('URL is required.')
      return
    }
    try {
      const parsed = new URL(linkUrl.trim())
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        setLinkError('URL must start with http:// or https://')
        return
      }
    } catch {
      setLinkError('Please enter a valid URL (e.g. https://example.com)')
      return
    }
    createLink(
      {
        sectionId: section._id,
        subsectionId: subsection._id,
        linkData: { name: linkName.trim(), description: linkDescription.trim(), url: linkUrl.trim() }
      },
      {
        onSuccess: () => {
          setLinkName('')
          setLinkDescription('')
          setLinkUrl('')
        },
        onError: (err) => setLinkError(err?.message || 'Failed to save link. Please try again.')
      }
    )
  }

  function handleUpload(files) {
    setUploadError(null)
    setUploadProgress({ completed: 0, total: files.length })
    uploadDocuments(
      {
        files,
        onFileComplete: () => setUploadProgress(p => ({ ...p, completed: p.completed + 1 }))
      },
      {
        onSuccess: () => setUploadProgress(null),
        onError: (err) => {
          setUploadProgress(null)
          setUploadError(err?.message || 'Upload failed. Please try again.')
        }
      }
    )
  }

  function handleDrop(e) {
    e.preventDefault()
    setIsDragOver(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length) handleUpload(files)
  }

  function handleFileInput(e) {
    const files = Array.from(e.target.files)
    if (files.length) handleUpload(files)
    e.target.value = ''
  }

  return (
    <>
      <div className="subsection-row">
        <div className="subsection-row-cells">
          <button
            className={`subsection-row-toggle ${expanded ? 'subsection-row-toggle--open' : ''}`}
            onClick={onToggleExpanded}
            aria-label={expanded ? 'Collapse subsection' : 'Expand subsection'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z" clipRule="evenodd" />
            </svg>
          </button>
          <span className="subsection-cell subsection-cell-number">
            {subsection.number}
            <button
              className="subsection-row-edit"
              onClick={canEditSubsection ? () => setShowEditDialog(true) : undefined}
              disabled={!canEditSubsection}
              aria-label={canEditSubsection ? 'Edit subsection' : 'Edit subsection (not permitted)'}
              title={canEditSubsection ? undefined : 'Not permitted'}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 1 1 2.828 2.828l-.793.793-2.828-2.828.793-.793ZM11.379 5.793 3 14.172V17h2.828l8.38-8.379-2.83-2.828Z" />
              </svg>
            </button>
          </span>
          <span className="subsection-cell subsection-cell-name">{subsection.name}</span>
          <span className="subsection-cell subsection-cell-description">{subsection.description}</span>
          <span className="subsection-cell subsection-cell-status">
            <SubsectionStatusBar sectionId={section._id} subsectionId={subsection._id} />
          </span>
        </div>
        {expanded && (
          <>
          <div className="subsection-row-detail">
            {isViewer
              ? <div className="subsection-drop-zone subsection-drop-zone--placeholder" aria-hidden="true" />
              : <div
              className={`subsection-drop-zone ${isDragOver && !isUploading ? 'subsection-drop-zone--active' : ''} ${isUploading ? 'subsection-drop-zone--disabled' : ''}`}
              onDragOver={e => { if (!isUploading) { e.preventDefault(); setIsDragOver(true) } }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={isUploading ? undefined : handleDrop}
              onClick={() => { if (!isUploading) fileInputRef.current?.click() }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.25 13.25a.75.75 0 0 0 1.5 0V4.636l2.955 3.129a.75.75 0 0 0 1.09-1.03l-4.25-4.5a.75.75 0 0 0-1.09 0l-4.25 4.5a.75.75 0 1 0 1.09 1.03L9.25 4.636v8.614Z" />
                <path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" />
              </svg>
              <span>Drop files here or click to upload</span>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="subsection-drop-zone-input"
                onChange={handleFileInput}
              />
              {isUploading && uploadProgress && (
                <div className="subsection-drop-zone-overlay">
                  <Spinner />
                  <span>Uploaded {uploadProgress.completed} of {uploadProgress.total} document{uploadProgress.total !== 1 ? 's' : ''}…</span>
                </div>
              )}
              {uploadError && (
                <div className="subsection-drop-zone-overlay subsection-drop-zone-overlay--error">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
                  </svg>
                  <span>{uploadError}</span>
                  <button
                    className="subsection-drop-zone-error-dismiss"
                    onClick={e => { e.stopPropagation(); setUploadError(null) }}
                    aria-label="Dismiss error"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                    </svg>
                  </button>
                </div>
              )}
            </div>}
            <div className="subsection-detail-right">
              {isLoading && (
                <div className="subsection-detail-loading">
                  <Spinner />
                  <span>Loading documents...</span>
                </div>
              )}
              {!isLoading && documents?.length === 0 && (
                <div className="subsection-detail-empty">
                  No documents have been uploaded yet.
                </div>
              )}
              {!isLoading && documents?.length > 0 && (
                <DocumentTable documents={documents} sectionId={section._id} subsectionId={subsection._id} canChangeStatus={canChangeStatus} canTrash={!isViewer} />
              )}
            </div>
          </div>
          <div className="subsection-links-section">
            <div className="subsection-links-divider" />
            <div className="subsection-row-detail subsection-row-detail--links">
              {isViewer
                ? <div className="subsection-link-form subsection-link-form--placeholder" aria-hidden="true" />
                : (isCreatingLink ? (
                <div className="subsection-link-form-saving">
                  <Spinner />
                  <span>Adding link…</span>
                </div>
              ) : (
                <form className="subsection-link-form" onSubmit={handleAddLink} noValidate>
                  <div className="subsection-link-field">
                    <label htmlFor={`link-name-${subsection._id}`}>Name</label>
                    <input
                      id={`link-name-${subsection._id}`}
                      type="text"
                      placeholder="e.g. Project Homepage"
                      value={linkName}
                      onChange={e => setLinkName(e.target.value)}
                    />
                  </div>
                  <div className="subsection-link-field">
                    <label htmlFor={`link-desc-${subsection._id}`}>Description (Optional)</label>
                    <input
                      id={`link-desc-${subsection._id}`}
                      type="text"
                      placeholder="Description"
                      value={linkDescription}
                      onChange={e => setLinkDescription(e.target.value)}
                    />
                  </div>
                  <div className="subsection-link-field">
                    <label htmlFor={`link-url-${subsection._id}`}>URL</label>
                    <input
                      id={`link-url-${subsection._id}`}
                      type="url"
                      placeholder="https://"
                      value={linkUrl}
                      onChange={e => setLinkUrl(e.target.value)}
                    />
                  </div>
                  {linkError && (
                    <p className="subsection-link-error">{linkError}</p>
                  )}
                  <button type="submit" className="subsection-link-submit">
                    Add Link
                  </button>
                </form>
              ))}
              <div className="subsection-detail-right">
                {isLinksLoading && (
                  <div className="subsection-detail-loading">
                    <Spinner />
                    <span>Loading links...</span>
                  </div>
                )}
                {!isLinksLoading && !links?.length && (
                  <div className="subsection-detail-empty">
                    No links have been added yet.
                  </div>
                )}
                {!isLinksLoading && links?.length > 0 && (
                  <div className="link-table">
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
                      <div
                        key={link._id}
                        className={`link-table-row${spotlight?.type === 'link' && spotlight.itemId === link._id ? ' link-table-row--highlighted' : ''}`}
                        ref={el => { linkRowRefs.current[link._id] = el }}
                        onAnimationEnd={spotlight?.type === 'link' && spotlight.itemId === link._id ? () => setSpotlight(null) : undefined}
                      >
                        <span className="link-cell link-cell-name" title={link.name}>{link.name}</span>
                        <span className="link-cell link-cell-description" title={link.description}>{link.description || '—'}</span>
                        <span className="link-cell link-cell-status">
                          <StatusPill
                            status={link.status ?? null}
                            onChange={canChangeStatus ? status => setPendingStatusChange({ link, status }) : undefined}
                            options={canChangeStatus ? statusOptions.filter(opt => opt !== link.status) : undefined}
                            isPending={isLinkStatusPending && linkStatusVariables?.linkId === link._id}
                          />
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
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.25 5.5a.75.75 0 0 0-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 0 0 .75-.75v-4a.75.75 0 0 1 1.5 0v4A2.25 2.25 0 0 1 12.75 17h-8.5A2.25 2.25 0 0 1 2 14.75v-8.5A2.25 2.25 0 0 1 4.25 4h5a.75.75 0 0 1 0 1.5h-5Zm6.75-3a.75.75 0 0 1 .75-.75h5.25a.75.75 0 0 1 .75.75v5.25a.75.75 0 0 1-1.5 0V4.06l-6.22 6.22a.75.75 0 1 1-1.06-1.06L15.44 3H11a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
                          </svg>
                        </a>
                        <button
                          type="button"
                          className="link-row-history"
                          onClick={() => setHistoryLink(link)}
                          aria-label={`View log history for ${link.name}`}
                          title="View log history"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-13a.75.75 0 0 0-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 0 0 0-1.5h-3.25V5Z" clipRule="evenodd" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          className="link-row-edit"
                          onClick={!isViewer ? () => setEditingLink(link) : undefined}
                          disabled={isViewer}
                          aria-label={isViewer ? 'Edit link (not permitted)' : `Edit ${link.name}`}
                          title={isViewer ? 'Not permitted' : 'Edit link'}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 1 1 2.828 2.828l-.793.793-2.828-2.828.793-.793ZM11.379 5.793 3 14.172V17h2.828l8.38-8.379-2.83-2.828Z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          className="link-row-delete"
                          onClick={!isViewer ? () => setPendingDeleteLink(link) : undefined}
                          disabled={isViewer}
                          aria-label={isViewer ? 'Move to Trash (not permitted)' : `Move ${link.name} to Trash`}
                          title={isViewer ? 'Not permitted' : 'Move Link to Trash'}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          </>
        )}
      </div>
      {showEditDialog && (
        <EditSubsectionDialog
          section={section}
          subsection={subsection}
          subsections={subsections}
          onClose={() => setShowEditDialog(false)}
        />
      )}
      {editingLink && (
        <EditLinkDialog
          link={editingLink}
          sectionId={section._id}
          subsectionId={subsection._id}
          onClose={() => setEditingLink(null)}
        />
      )}
      {pendingStatusChange && (
        <StatusNoteDialog
          docName={pendingStatusChange.link.name}
          newStatus={pendingStatusChange.status}
          onConfirm={handleStatusNoteConfirm}
          onCancel={() => setPendingStatusChange(null)}
        />
      )}
      {pendingDeleteLink && (
        <TrashLinkDialog
          linkName={pendingDeleteLink.name}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setPendingDeleteLink(null)}
        />
      )}
      {historyLink && (
        <LinkLogsDialog
          link={historyLink}
          sectionId={section._id}
          subsectionId={subsection._id}
          onClose={() => setHistoryLink(null)}
        />
      )}
    </>
  )
}

export default SubsectionRow
