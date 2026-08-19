import { useState } from 'react'

import { useCreateSubsection } from '../services/useSubsections'

import Button from './Button'
import CancelButton from './CancelButton'
import Spinner from './Spinner'
import './CreateSectionDialog.css'

function CreateSubsectionDialog({ section, subsections = [], onClose }) {

  const { mutate: createSubsection, isPending, error } = useCreateSubsection()

  const [number, setNumber] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [submitError, setSubmitError] = useState(null)

  const trimmedNumber = number.trim()
  const trimmedName = name.trim()

  const duplicateNumber = trimmedNumber !== '' &&
    subsections.some(s => String(s.number).toLowerCase() === trimmedNumber.toLowerCase())

  const duplicateName = trimmedName !== '' &&
    subsections.some(s => s.name?.toLowerCase() === trimmedName.toLowerCase())

  const canSave = trimmedNumber !== '' && trimmedName !== '' && !duplicateNumber && !duplicateName

  const onSaveSuccess = (data) => {
    if (data._result.statusCode !== 201) {
      setSubmitError(data.message ?? 'Failed to create subsection. Please try again.')
    } else {
      setSubmitError(null)
      onClose()
    }
  }

  const handleSave = async () => {
    setSubmitError(null)
    await createSubsection({ sectionId: section._id, subsectionData: { number: trimmedNumber, name: trimmedName, description: description.trim() } }, { onSuccess: onSaveSuccess })
  }

  return (
    <div className="section-dialog-overlay">
      <div className="section-dialog" onClick={(e) => e.stopPropagation()}>
        <h2>Create Subsection</h2>

        <div className="section-dialog-field">
          <label htmlFor="subsection-number">Subsection Number</label>
          <input
            id="subsection-number"
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
          <label htmlFor="subsection-name">Subsection Name</label>
          <input
            id="subsection-name"
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
          <label htmlFor="subsection-description">Description</label>
          <textarea
            id="subsection-description"
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

export default CreateSubsectionDialog
