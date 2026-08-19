import { useState } from 'react'
import Button from './Button'
import CancelButton from './CancelButton'
import TrashButton from './TrashButton'
import Spinner from './Spinner'
import { useUpdateSubsection, useTrashSubsection } from '../services/useSubsections'
import './CreateSectionDialog.css'

function EditSubsectionDialog({ section, subsection, subsections = [], onClose }) {

  const { mutate: updateSubsection, isPending: isUpdatePending, error: updateError } = useUpdateSubsection()
  const { mutate: trashSubsection, isPending: isTrashPending, error: trashError } = useTrashSubsection()

  const isPending = isUpdatePending || isTrashPending
  const error = updateError ?? trashError

  const [number, setNumber] = useState(String(subsection.number))
  const [name, setName] = useState(subsection.name)
  const [description, setDescription] = useState(subsection.description ?? '')
  const [submitError, setSubmitError] = useState(null)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const trimmedNumber = number.trim()
  const trimmedName = name.trim()

  const otherSubsections = subsections.filter(s => s._id !== subsection._id)

  const duplicateNumber = trimmedNumber !== '' &&
    otherSubsections.some(s => String(s.number).toLowerCase() === trimmedNumber.toLowerCase())

  const duplicateName = trimmedName !== '' &&
    otherSubsections.some(s => s.name?.toLowerCase() === trimmedName.toLowerCase())

  const hasChanged =
    trimmedNumber !== String(subsection.number) ||
    trimmedName !== subsection.name ||
    description.trim() !== (subsection.description ?? '')

  const canSave = trimmedNumber !== '' && trimmedName !== '' && !duplicateNumber && !duplicateName && hasChanged

  const onSaveSuccess = (data) => {
    if (data._result.statusCode !== 200) {
      setSubmitError(data.message ?? 'Failed to update subsection. Please try again.')
    } else {
      setSubmitError(null)
      onClose()
    }
  }

  const handleSave = async () => {
    setSubmitError(null)
    let subsectionData = {
      ...subsection,
      number: trimmedNumber,
      name: trimmedName,
      description: description.trim(),
      deleted: false
    }
    await updateSubsection({
      sectionId: section._id,
      subsectionData
    }, { onSuccess: onSaveSuccess })
  }

  const handleDelete = () => setConfirmingDelete(true)
  const handleCancelDelete = () => setConfirmingDelete(false)

  const handleConfirmDelete = () => {
    setSubmitError(null)
    trashSubsection({ sectionId: section._id, subsectionId: subsection._id }, {
      onSuccess: (data) => {
        if (data._result?.statusCode !== 200) {
          setSubmitError(data.message ?? 'Failed to delete subsection. Please try again.')
        } else {
          onClose()
        }
      }
    })
  }

  return (
    <div className="section-dialog-overlay">
      <div className="section-dialog" onClick={(e) => e.stopPropagation()}>
        <h2>Edit Subsection</h2>

        <div className="section-dialog-field">
          <label htmlFor="edit-subsection-number">Subsection Number</label>
          <input
            id="edit-subsection-number"
            type="text"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            maxLength={5}
            disabled={isPending}
            autoFocus
          />
          {duplicateNumber && (
            <p className="section-dialog-error">A subsection with this number already exists.</p>
          )}
        </div>

        <div className="section-dialog-field">
          <label htmlFor="edit-subsection-name">Subsection Name</label>
          <input
            id="edit-subsection-name"
            type="text"
            value={name}
            maxLength={50}
            onChange={(e) => setName(e.target.value)}
            disabled={isPending}
          />
          {duplicateName && (
            <p className="section-dialog-error">A subsection with this name already exists.</p>
          )}
        </div>

        <div className="section-dialog-field">
          <label htmlFor="edit-subsection-description">Description</label>
          <textarea
            id="edit-subsection-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isPending}
            rows={3}
          />
        </div>

        {(submitError || error) && (
          <p className="section-dialog-error section-dialog-submit-error">
            {submitError ?? error?.message ?? 'An error occurred. Please try again.'}
          </p>
        )}

        {confirmingDelete ? (
          <div className="section-dialog-confirm">
            <p className="section-dialog-confirm-message">
              Are you sure you want to move <strong>{subsection.name}</strong> to trash?
            </p>
            <div className="section-dialog-actions">
              <CancelButton onClick={handleCancelDelete}>No, Keep It</CancelButton>
              <TrashButton onClick={handleConfirmDelete}>Move to Trash</TrashButton>
            </div>
          </div>
        ) : (
          <div className="section-dialog-actions">
            {isPending && <Spinner className="section-dialog-spinner" />}
            <TrashButton onClick={handleDelete} disabled={isPending} />
            <CancelButton onClick={onClose} disabled={isPending} />
            <Button onClick={handleSave} disabled={!canSave || isPending}>
              {isPending ? 'Saving…' : 'Save'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default EditSubsectionDialog
