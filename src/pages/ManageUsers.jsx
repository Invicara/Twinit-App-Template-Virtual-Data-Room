import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSections } from '../services/useSections'
import { useUserGroups, useGroupUsers, useRemoveUserFromGroup, useRemoveUserFromAllGroups, useCancelInvite } from '../services/useUsers'
import Spinner from '../components/Spinner'
import InviteUserDialog, { GROUP_ORDER } from '../components/InviteUserDialog'
import { useUser } from '../context/UserContext'
import './ManageUsers.css'

function GroupRow({ group }) {
  const [open, setOpen] = useState(false)
  const { user: currentUser } = useUser()
  const { data: users, isLoading } = useGroupUsers(open ? group._id : null)
  const {
    mutate: removeUserFromGroup,
    isPending: removePending,
    variables: removeVariables,
    isError: removeIsError,
    error: removeError,
    reset: resetRemoveError,
  } = useRemoveUserFromGroup()

  const {
    mutate: removeUserFromAllGroups,
    isPending: removeAllPending,
    variables: removeAllVariables,
    isError: removeAllIsError,
    error: removeAllError,
    reset: resetRemoveAllError,
  } = useRemoveUserFromAllGroups()

  const {
    mutate: cancelInvite,
    isPending: cancelInvitePending,
    variables: cancelInviteVariables,
    isError: cancelInviteIsError,
    error: cancelInviteError,
    reset: resetCancelInviteError,
  } = useCancelInvite()

  return (
    <li className="mu-group-item">
      <button
        className="mu-group-toggle"
        onClick={() => {
          resetRemoveError()
          resetRemoveAllError()
          resetCancelInviteError()
          setOpen(o => !o)
        }}
        aria-expanded={open}
      >
        <svg className={`mu-chevron ${open ? 'mu-chevron--open' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
        </svg>
        <span className="mu-group-name">{group._name}</span>
      </button>

      {open && (
        <div className="mu-user-list-wrap">
          {isLoading ? (
            <div className="mu-user-loading"><Spinner /></div>
          ) : (
            <>
              {!users?.length ? (
                <p className="mu-no-users">No users in this group.</p>
              ) : (
                <>
                  <table className="mu-user-table">
                    <thead>
                      <tr>
                        <th>First Name</th>
                        <th>Last Name</th>
                        <th>Email</th>
                        <th className="mu-user-table-actions mu-user-table-actions--wide" aria-label="Actions" />
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(u => {
                        const isCurrentUser = !!(u._id && currentUser?._id && u._id === currentUser._id)
                        return (
                          <tr key={u._id ?? u._email}>
                            <td>{u._firstname}</td>
                            <td>{u._lastname}</td>
                            <td>{u._email}</td>
                            <td className="mu-user-table-actions mu-user-table-actions--wide">
                              {u._id ? (
                                <div className="mu-action-group">
                                  {(() => {
                                    const removing =
                                      removePending &&
                                      removeVariables?.groupId === group._id &&
                                      removeVariables?.userId === u._id
                                    return (
                                      <button
                                        type="button"
                                        className="mu-remove-user"
                                        title={isCurrentUser ? 'You cannot remove yourself from a group' : 'Remove from this group'}
                                        aria-label={
                                          removing
                                            ? `Removing ${u._email} from this group…`
                                            : isCurrentUser
                                              ? `Cannot remove yourself from a group (${u._email})`
                                              : `Remove ${u._email} from this group`
                                        }
                                        disabled={isCurrentUser || removing}
                                        onClick={() =>
                                          removeUserFromGroup({ groupId: group._id, userId: u._id })
                                        }
                                      >
                                        {removing
                                          ? <Spinner className="mu-action-spinner" />
                                          : (
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                              <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.47 41.47 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
                                            </svg>
                                          )
                                        }
                                      </button>
                                    )
                                  })()}
                                  {(() => {
                                    const removingAll =
                                      removeAllPending && removeAllVariables?.userId === u._id
                                    return (
                                      <button
                                        type="button"
                                        className="mu-remove-user mu-remove-user--all"
                                        title={isCurrentUser ? 'You cannot remove yourself from all groups' : 'Remove from all groups'}
                                        aria-label={
                                          removingAll
                                            ? `Removing ${u._email} from all groups…`
                                            : isCurrentUser
                                              ? `Cannot remove yourself from all groups (${u._email})`
                                              : `Remove ${u._email} from all groups`
                                        }
                                        disabled={isCurrentUser || removingAll}
                                        onClick={() =>
                                          removeUserFromAllGroups({ userId: u._id })
                                        }
                                      >
                                        {removingAll
                                          ? <Spinner className="mu-action-spinner" />
                                          : (
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                              <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22Z" clipRule="evenodd" />
                                            </svg>
                                          )
                                        }
                                      </button>
                                    )
                                  })()}
                                </div>
                              ) : null}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                  {removeIsError && (
                    <p className="mu-remove-user-error" role="alert">
                      {removeError?.message ?? 'Could not remove user.'}
                    </p>
                  )}
                  {removeAllIsError && (
                    <p className="mu-remove-user-error" role="alert">
                      {removeAllError?.message ?? 'Could not remove user from all groups.'}
                    </p>
                  )}
                </>
              )}
              {group.invites?.length > 0 && (
                <div className="mu-invites-section">
                  <p className="mu-invites-heading">Pending Invites</p>
                  <table className="mu-user-table mu-invites-table">
                    <thead>
                      <tr>
                        <th>Email</th>
                        <th>Status</th>
                        <th>Expires</th>
                        <th className="mu-user-table-actions" aria-label="Actions" />
                      </tr>
                    </thead>
                    <tbody>
                      {group.invites.map(invite => {
                        const expiry = invite._expireTime
                          ? new Date(invite._expireTime).toLocaleString(undefined, {
                              month: 'short', day: 'numeric', year: 'numeric',
                              hour: 'numeric', minute: '2-digit'
                            })
                          : '—'
                        const status = invite._status ?? 'PENDING'
                        const isCancelling = cancelInvitePending && cancelInviteVariables?.inviteId === invite._id
                        const isCancelable = status === 'PENDING'
                        return (
                          <tr key={invite._id ?? invite._email}>
                            <td>{invite._email}</td>
                            <td>
                              <span className={`mu-invite-status mu-invite-status--${status.toLowerCase()}`}>
                                {status.charAt(0) + status.slice(1).toLowerCase()}
                              </span>
                            </td>
                            <td className="mu-invite-expiry">{expiry}</td>
                            <td className="mu-user-table-actions">
                              <button
                                className="mu-remove-user"
                                onClick={() => cancelInvite({ groupId: group._id, inviteId: invite._id })}
                                disabled={isCancelling || cancelInvitePending}
                                  aria-label={isCancelling ? 'Cancelling invite…' : `Cancel invite for ${invite._email}`}
                                  title={isCancelling ? 'Cancelling invite…' : `Cancel invite for ${invite._email}`}
                              >
                                {isCancelling ? (
                                  <Spinner className="mu-action-spinner" />
                                ) : (
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 3.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                  {cancelInviteIsError && (
                    <p className="mu-remove-user-error" role="alert">
                      {cancelInviteError?.message ?? 'Could not cancel invite.'}
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </li>
  )
}

function ManageUsers() {
  const navigate = useNavigate()
  const { roles, userLoading } = useUser()

  useEffect(() => {
    if (!userLoading && !roles?.room_admin) {
      navigate('/', { replace: true })
    }
  }, [userLoading, roles, navigate])

  const [inviteOpen, setInviteOpen] = useState(false)
  const { data: sections, isLoading: sectionsLoading } = useSections()
  const { data: groups, isLoading: groupsLoading } = useUserGroups()

  const isLoading = sectionsLoading || groupsLoading

  const roomAdminGroup = groups?.find(g => g._name === 'Room Admin')

  const sectionGroups = sections?.map(section => ({
    section,
    groups: (groups ?? [])
      .filter(g => g._userAttributes?.section === section._id)
      .sort((a, b) => GROUP_ORDER.indexOf(a._name) - GROUP_ORDER.indexOf(b._name))
  }))

  return (
    <div className="manage-users">
      <div className="manage-users-header">
        <Link to="/" className="manage-users-back">← Back to Room</Link>
        <h2>Manage Users</h2>
        <button className="mu-invite-btn" onClick={() => setInviteOpen(true)}>
          + Invite User
        </button>
      </div>

      {inviteOpen && (
        <InviteUserDialog
          sections={sections}
          groups={groups}
          roomAdminGroup={roomAdminGroup}
          onClose={() => setInviteOpen(false)}
        />
      )}

      {isLoading ? (
        <div className="manage-users-spinner"><Spinner /></div>
      ) : (
        <div className="manage-users-body">
          {roomAdminGroup && (
            <div className="mu-section-block">
              <div className="mu-section-header">
                <span className="mu-section-label">Room Admin</span>
              </div>
              <ul className="mu-group-list">
                <GroupRow group={roomAdminGroup} />
              </ul>
            </div>
          )}

          {sectionGroups?.map(({ section, groups: sGroups }) => (
            <div key={section._id} className="mu-section-block">
              <div className="mu-section-header">
                <span className="mu-section-number">Section {section.number}</span>
                <span className="mu-section-name">{section.name}</span>
              </div>
              {sGroups.length === 0 ? (
                <p className="mu-no-groups">No groups found for this section.</p>
              ) : (
                <ul className="mu-group-list">
                  {sGroups.map(group => (
                    <GroupRow key={group._id} group={group} />
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ManageUsers
