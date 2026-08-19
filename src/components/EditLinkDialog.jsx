import { useState } from 'react'
import Button from './Button'
import CancelButton from './CancelButton'
import Spinner from './Spinner'
import { useUpdateLink } from '../services/useSubsections'
import './CreateSectionDialog.css'

function EditLinkDialog({ link, sectionId, subsectionId, onClose }) {
  const { mutate: updateLink, isPending, error } = useUpdateLink()

  const [name, setName] = useState(link.name ?? '')
  const [description, setDescription] = useState(link.description ?? '')
  const [url, setUrl] = useState(link.url ?? '')
  const [urlError, setUrlError] = useState(null)
  const [submitError, setSubmitError] = useState(null)

  const trimmedName = name.trim()
  const trimmedUrl = url.trim()

  const hasChanged =
    trimmedName !== (link.name ?? '') ||
    description.trim() !== (link.description ?? '') ||
    trimmedUrl !== (link.url ?? '')

  const canSave = trimmedName !== '' && trimmedUrl !== '' && hasChanged && !urlError

  function validateUrl(value) {
    const trimmed = value.trim()
    if (!trimmed) {
      setUrlError(null)
      return
    }
    try {
      const parsed = new URL(trimmed)
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        setUrlError('URL must start with http:// or https://')
      } else {
        setUrlError(null)
      }
    } catch {
      setUrlError('Please enter a valid URL (e.g. https://example.com)')
    }
  }

  function handleUrlChange(e) {
    setUrl(e.target.value)
    validateUrl(e.target.value)
  }

  function handleSave() {
    setSubmitError(null)
    updateLink(
      {
        sectionId,
        subsectionId,
        linkId: link._id,
        linkData: {
          ...link,
          name: trimmedName,
          description: description.trim(),
          url: trimmedUrl
        }
      },
      {
        onSuccess: (data) => {
          if (data?._result?.statusCode && data._result.statusCode !== 200) {
            setSubmitError(data.message ?? 'Failed to update link. Please try again.')
          } else {
            onClose()
          }
        },
        onError: (err) => setSubmitError(err?.message ?? 'Failed to update link. Please try again.')
      }
    )
  }

  return (
    <div className="section-dialog-overlay">
      <div className="section-dialog" onClick={e => e.stopPropagation()}>
        <h2>Edit Link</h2>

        <div className="section-dialog-field">
          <label htmlFor="edit-link-name">Name</label>
          <input
            id="edit-link-name"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            disabled={isPending}
            autoFocus
          />
        </div>

        <div className="section-dialog-field">
          <label htmlFor="edit-link-description">Description <span style={{ fontWeight: 400, color: 'var(--text-muted, #888)' }}>(optional)</span></label>
          <input
            id="edit-link-description"
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            disabled={isPending}
          />
        </div>

        <div className="section-dialog-field">
          <label htmlFor="edit-link-url">URL</label>
          <input
            id="edit-link-url"
            type="url"
            value={url}
            onChange={handleUrlChange}
            disabled={isPending}
            className={urlError ? 'input-error' : ''}
          />
          {urlError && <p className="section-dialog-error">{urlError}</p>}
        </div>

        {(submitError || error) && (
          <p className="section-dialog-error section-dialog-submit-error">
            {submitError ?? error?.message ?? 'An error occurred. Please try again.'}
          </p>
        )}

        <div className="section-dialog-actions">
          {isPending && <Spinner className="section-dialog-spinner" />}
          <CancelButton onClick={onClose} disabled={isPending} />
          <Button onClick={handleSave} disabled={!canSave || isPending}>
            {isPending ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default EditLinkDialog
