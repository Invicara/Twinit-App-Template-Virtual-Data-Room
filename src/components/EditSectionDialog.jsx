import { useState } from 'react'
import Button from './Button'
import CancelButton from './CancelButton'
import TrashButton from './TrashButton'
import Spinner from './Spinner'
import { useUpdateSection, useTrashSection } from '../services/useSections'
import './CreateSectionDialog.css'

function EditSectionDialog({ section, sections = [], onClose }) {

  const { mutate: updateSection, isPending: isUpdatePending, error: updateError } = useUpdateSection()
  const { mutate: trashSection, isPending: isTrashPending, error: trashError } = useTrashSection()

  const isPending = isUpdatePending || isTrashPending
  const error = updateError ?? trashError

  const [number, setNumber] = useState(String(section.number))
  const [name, setName] = useState(section.name)
  const [submitError, setSubmitError] = useState(null)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  
  const trimmedNumber = number.trim()
  const trimmedName = name.trim()

  const otherSections = sections.filter(s => s._id !== section._id)

  const duplicateNumber = trimmedNumber !== '' &&
    otherSections.some(s => String(s.number).toLowerCase() === trimmedNumber.toLowerCase())

  const duplicateName = trimmedName !== '' &&
    otherSections.some(s => s.name?.toLowerCase() === trimmedName.toLowerCase())

  const hasChanged = trimmedNumber !== String(section.number) || trimmedName !== section.name

  const canSave = trimmedNumber !== '' && trimmedName !== '' && !duplicateNumber && !duplicateName && hasChanged

  const onSaveSuccess = (data) => {
    if (data._result.statusCode !== 200) {
      setSubmitError(data.message ?? 'Failed to update section. Please try again.')
    } else {
      setSubmitError(null)
      onClose()
    }
  }

  const handleSave = async () => {
    setSubmitError(null)
    await updateSection({ _id: section._id, number: number.trim(), name: name.trim(), deleted: false }, { onSuccess: onSaveSuccess })
  }

  const handleDelete = () => {
    setConfirmingDelete(true)
  }

  const handleConfirmDelete = () => {
    setSubmitError(null)
    trashSection(section._id, {
      onSuccess: (data) => {
        if (data._result?.statusCode !== 200) {
          setSubmitError(data.message ?? 'Failed to delete section. Please try again.')
        } else {
          onClose()
        }
      }
    })
  }

  const handleCancelDelete = () => {
    setConfirmingDelete(false)
  }

  return (
    <div className="section-dialog-overlay">
      <div className="section-dialog" onClick={(e) => e.stopPropagation()}>
        <h2>Edit Section</h2>

        <div className="section-dialog-field">
          <label htmlFor="edit-section-number">Section Number</label>
          <input
            id="edit-section-number"
            type="text"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            maxLength={5}
            disabled={isPending}
            autoFocus
          />
          {duplicateNumber && (
            <p className="section-dialog-error">A section with this number already exists.</p>
          )}
        </div>

        <div className="section-dialog-field">
          <label htmlFor="edit-section-name">Section Name</label>
          <input
            id="edit-section-name"
            type="text"
            value={name}
            maxLength={50}
            onChange={(e) => setName(e.target.value)}
            disabled={isPending}
          />
          {duplicateName && (
            <p className="section-dialog-error">A section with this name already exists.</p>
          )}
        </div>

        {(submitError || error) && (
          <p className="section-dialog-error section-dialog-submit-error">
            {submitError ?? error.message ?? 'An error occurred. Please try again.'}
          </p>
        )}

        {confirmingDelete ? (
          <div className="section-dialog-confirm">
            <p className="section-dialog-confirm-message">
              Are you sure you want to move <strong>{section.name}</strong> to the trash?
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

export default EditSectionDialog
