import { useState, useEffect, useRef } from 'react'
import { useInviteUsers, useGetAllUsers } from '../services/useUsers'
import Spinner from './Spinner'

export const GROUP_ORDER = ['Section Admin', 'Section Contributor', 'Section Viewer']

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function InviteUserDialog({ sections, groups, roomAdminGroup, onClose }) {
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [selectedUserId, setSelectedUserId] = useState('')
  const [isRoomAdmin, setIsRoomAdmin] = useState(false)
  const [sectionRoles, setSectionRoles] = useState(() =>
    Object.fromEntries((sections ?? []).map(s => [s._id, '']))
  )
  const overlayRef = useRef(null)
  const { mutateAsync: inviteUsers, isPending, isError, error } = useInviteUsers()
  const { data: allUsers, isLoading: usersLoading } = useGetAllUsers()

  function handleUserSelect(e) {
    const uid = e.target.value
    setSelectedUserId(uid)
    if (uid) {
      const u = allUsers?.find(u => u._id === uid)
      if (u) { setEmail(u._email); setEmailError('') }
    }
  }

  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape' && !isPending) onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, isPending])

  async function handleInvite() {
    if (!EMAIL_RE.test(email.trim())) {
      setEmailError('Please enter a valid email address.')
      return
    }

    const selectedGroups = isRoomAdmin
      ? [{ groupId: roomAdminGroup?._id, groupName: roomAdminGroup?._name, section: { number: 'All', name: 'Sections' } }].filter(g => g.groupId)
      : Object.entries(sectionRoles)
          .filter(([, role]) => role)
          .map(([sectionId, role]) => {
            const group = groups?.find(g => g._userAttributes?.section === sectionId && g._name === role)
            const section = sections?.find(s => s._id === sectionId)
            if (!group || !section) return null
            return {
              groupId: group._id,
              groupName: group._name,
              section: { _id: section._id, number: section.number, name: section.name }
            }
          })
          .filter(Boolean)

    const payload = {
      email: email.trim(),
      base_url: window.location.origin,
      groups: selectedGroups,
    }

    await inviteUsers(payload)
    onClose()
  }

  return (
    <div className="mu-dialog-overlay" ref={overlayRef}>
      <div className="mu-dialog" role="dialog" aria-modal="true" aria-labelledby="mu-dialog-title">
        <div className="mu-dialog-header">
          <h3 id="mu-dialog-title">Invite User</h3>
          <button className="mu-dialog-close" onClick={onClose} disabled={isPending} aria-label="Close">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>

        <div className="mu-dialog-body">
          <div className="mu-field">
            <label className="mu-label" htmlFor="mu-invite-email">Email address</label>
            {usersLoading ? (
              <div className="mu-users-loading">
                <Spinner className="mu-users-spinner" />
                <span>Loading existing users…</span>
              </div>
            ) : allUsers?.length > 0 ? (
              <>
                <select
                  className="mu-select mu-select--full"
                  value={selectedUserId}
                  onChange={handleUserSelect}
                  aria-label="Select an existing user"
                  disabled={isPending}
                >
                  <option value="">— Select an existing user —</option>
                  {allUsers.map(u => (
                    <option key={u._id} value={u._id}>
                      {u._firstname} {u._lastname} ({u._email})
                    </option>
                  ))}
                </select>
                <span className="mu-field-or">or enter a new email below</span>
              </>
            ) : null}
            <input
              id="mu-invite-email"
              className={`mu-input ${emailError ? 'mu-input--error' : ''}`}
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={e => { setEmail(e.target.value); setEmailError(''); setSelectedUserId('') }}
              disabled={isPending}
            />
            {emailError && <p className="mu-field-error">{emailError}</p>}
          </div>

          <div className="mu-field">
            <p className="mu-label">Room access</p>
            <label className="mu-checkbox-row">
              <input
                type="checkbox"
                checked={isRoomAdmin}
                onChange={e => setIsRoomAdmin(e.target.checked)}
              />
              <span>Room Admin</span>
            </label>
          </div>

          <div className={`mu-field ${isRoomAdmin ? 'mu-field--disabled' : ''}`}>
            <p className="mu-label">Section roles</p>
            <div className="mu-section-roles">
              {(sections ?? []).map(section => (
                <div key={section._id} className="mu-section-role-row">
                  <div className="mu-section-role-label">
                    <span className="mu-section-number">Section {section.number}</span>
                    <span className="mu-section-role-name">{section.name}</span>
                  </div>
                  <select
                    className="mu-select"
                    disabled={isRoomAdmin}
                    value={sectionRoles[section._id] ?? ''}
                    onChange={e => setSectionRoles(prev => ({ ...prev, [section._id]: e.target.value }))}
                  >
                    <option value="">— No access —</option>
                    {GROUP_ORDER.map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mu-dialog-footer">
          {isError && (
            <p className="mu-invite-error">{error?.message ?? 'Invite failed. Please try again.'}</p>
          )}
          <button className="mu-btn-cancel" onClick={onClose} disabled={isPending}>Cancel</button>
          <button
            className="mu-btn-invite"
            onClick={handleInvite}
            disabled={
              isPending ||
              !email.trim() ||
              (!isRoomAdmin && Object.values(sectionRoles).every(r => !r))
            }
          >
            {isPending ? 'Sending…' : 'Invite'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default InviteUserDialog
