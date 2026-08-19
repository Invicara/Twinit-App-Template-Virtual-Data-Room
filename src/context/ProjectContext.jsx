import { createContext, useContext, useState, useEffect, useMemo } from 'react'
import { IafWorkspace, IafProj, IafPassSvc, IafUserGroup } from '@dtplatform/platform-api'
import { logout } from '../auth/auth'
import './ProjectContext.css'

const SELECTED_PROJECT_KEY = 'twinit_selected_project'

const ProjectContext = createContext(null)

export function ProjectProvider({ children }) {
  const [project, setProject] = useState(null)
  const [projects, setProjects] = useState([])
  const [showPicker, setShowPicker] = useState(false)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [invites, setInvites] = useState([])
  const [busyInviteId, setBusyInviteId] = useState(null)

  useEffect(() => {
    const init = async () => {
      try {
        const stored = sessionStorage.getItem(SELECTED_PROJECT_KEY)
        if (stored) {
          setProject(JSON.parse(stored))
          setLoading(false)
          return
        }

        const list = await IafWorkspace.getAll()

        setProjects(list)
        setShowPicker(true)
        setLoading(false)
      } catch (err) {
        setError(err.message)
        setLoading(false)
      }
    }

    init()
  }, [])

  useEffect(() => {
    if (!showPicker) return
    IafPassSvc.getUserInvites({ _status: ['PENDING'] })
      .then(result => setInvites(Array.isArray(result) ? result : []))
      .catch(() => setInvites([]))
  }, [showPicker])

  async function selectProject(p) {
    await IafProj.switchProject(p._id)
    sessionStorage.setItem(SELECTED_PROJECT_KEY, JSON.stringify(p))
    setProject(p)
    setShowPicker(false)
  }

  async function clearProject() {
    sessionStorage.removeItem(SELECTED_PROJECT_KEY)
    setProject(null)
    setSearch('')
    setLoading(true)
    try {
      const list = await IafWorkspace.getAll()
      setProjects(list)
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
    setShowPicker(true)
  }

  async function acceptInvite(invite) {
    setBusyInviteId(invite._id)
    try {
      await IafUserGroup.addUserToGroupByInvite(invite._usergroup, invite)
      setInvites(prev => prev.filter(i => i._id !== invite._id))
      const list = await IafWorkspace.getAll()
      setProjects(list)
    } catch (err) {
      console.error('Failed to accept invite:', err)
    } finally {
      setBusyInviteId(null)
    }
  }

  async function declineInvite(invite) {
    setBusyInviteId(invite._id)
    try {
      await IafUserGroup.rejectInvite(invite._usergroup, invite._id)
      setInvites(prev => prev.filter(i => i._id !== invite._id))
    } catch (err) {
      console.error('Failed to decline invite:', err)
    } finally {
      setBusyInviteId(null)
    }
  }

  const filteredProjects = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return projects
    return projects.filter((p) => (p.name ?? p._name ?? '').toLowerCase().includes(term))
  }, [projects, search])

  if (loading) return <div className="project-status">Loading Rooms...</div>
  if (error) return <div className="project-status project-error">Failed to load Rooms: {error}</div>

  return (
    <ProjectContext.Provider value={{ project, clearProject }}>
      {showPicker && (
        <div className="project-picker-overlay">
          <div className="project-picker-dialog">
          {!projects?.length ? (
              <p className="project-picker-empty">
                You are not yet a member of any Virtual Data Rooms. Please contact your Room administrator.
              </p>
            ) : (
              <>
                <input
                  className="project-picker-search"
                  type="text"
                  placeholder="Search Rooms..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  autoFocus
                />
                {filteredProjects.length === 0 ? (
                  <p className="project-picker-empty">No Rooms match your search.</p>
                ) : (
                  <ul className="project-picker-list">
                    {filteredProjects.map((p) => (
                      <li key={p._id ?? p.id}>
                        <button onClick={() => selectProject(p)}>{p.name ?? p._name}</button>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          {invites.length > 0 && (
            <div className="project-picker-invites">
              <p className="project-picker-invites-title">Pending Invitations</p>
              <ul className="project-picker-invites-list">
                {invites.map(invite => {
                  const busy = busyInviteId === invite._id
                  return (
                    <li key={invite._id} className="project-picker-invite-item">
                      <div className="project-picker-invite-info">
                        <span className="project-picker-invite-room">{invite._params?.body_header}</span>
                        <span className="project-picker-invite-detail">{invite._params?.name} &mdash; {invite._params?.body_content}</span>
                      </div>
                      <div className="project-picker-invite-actions">
                        <button
                          className="project-picker-invite-accept"
                          onClick={() => acceptInvite(invite)}
                          disabled={!!busyInviteId}
                        >
                          {busy ? '…' : 'Accept'}
                        </button>
                        <button
                          className="project-picker-invite-decline"
                          onClick={() => declineInvite(invite)}
                          disabled={!!busyInviteId}
                        >
                          {busy ? '…' : 'Decline'}
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}

          <div className="project-picker-footer">
            <button className="project-picker-logout" onClick={logout}>Log Out</button>
          </div>
          </div>
        </div>
      )}
      {!showPicker && children}
    </ProjectContext.Provider>
  )
}

export function useProject() {
  return useContext(ProjectContext)
}
