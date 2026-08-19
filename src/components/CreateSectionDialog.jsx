import { useState } from 'react'
import { useCreateSection } from '../services/useSections'

import Button from './Button'
import CancelButton from './CancelButton'
import Spinner from './Spinner'
import './CreateSectionDialog.css'

function CreateSectionDialog({ sections = [], onClose }) {

  const { mutate: createSection, isPending, error } = useCreateSection()

  const [number, setNumber] = useState('')
  const [name, setName] = useState('')
  const [submitError, setSubmitError] = useState(null)

  const trimmedNumber = number.trim()
  const trimmedName = name.trim()

  const duplicateNumber = trimmedNumber !== '' &&
    sections.some(s => String(s.number).toLowerCase() === trimmedNumber.toLowerCase())

  const duplicateName = trimmedName !== '' &&
    sections.some(s => s.name?.toLowerCase() === trimmedName.toLowerCase())

  const canSave = trimmedNumber !== '' && trimmedName !== '' && !duplicateNumber && !duplicateName

  const onSaveSuccess = (data) => {
    if (data._result.statusCode !== 201) {
      setSubmitError(data.message ?? 'Failed to create section. Please try again.')
    } else {
      setSubmitError(null)
      onClose()
    }
  }

  const handleSave = async () => {
    setSubmitError(null)
    await createSection({ number: number.trim(), name: name.trim() }, { onSuccess: onSaveSuccess })
  }

  return (
    <div className="section-dialog-overlay">
      <div className="section-dialog" onClick={(e) => e.stopPropagation()}>
        <h2>Create Section</h2>

        <div className="section-dialog-field">
          <label htmlFor="section-number">Section Number</label>
          <input
            id="section-number"
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
          <label htmlFor="section-name">Section Name</label>
          <input
            id="section-name"
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

export default CreateSectionDialog
