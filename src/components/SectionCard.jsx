import { useState, useEffect, useRef } from 'react'
import Button from './Button'
import Spinner from './Spinner'
import SubsectionRow from './SubsectionRow'
import EditSectionDialog from './EditSectionDialog'
import CreateSubsectionDialog from './CreateSubsectionDialog'

import { useSubsections } from '../services/useSubsections'
import { useSearchHighlight } from '../context/SearchHighlightContext'
import { useUser } from '../context/UserContext'
import { useGroupUsers } from '../services/useUsers'
import './SectionCard.css'

function SectionCard({ section, sections }) {
  const { roles } = useUser()
  const isRoomAdmin = roles?.room_admin === true
  const sectionRole = roles?.[section._id]
  const canManageSubsections = sectionRole !== 'Section Viewer' && sectionRole !== 'Section Contributor'

  const { spotlight } = useSearchHighlight()
  const { data: subsections, isLoading, error: subsectionsError } = useSubsections(section._id)

  const [ showEditDialog, setShowEditDialog ] = useState(false)
  const [ showCreateSubsectionDialog, setShowCreateSubsectionDialog ] = useState(false)
  const [ expandedIds, setExpandedIds ] = useState(new Set())
  const [ showAdminsPopup, setShowAdminsPopup ] = useState(false)

  const adminGroupId = showAdminsPopup ? (section.groups?.admin ?? null) : null
  const { data: adminUsers, isLoading: adminsLoading } = useGroupUsers(adminGroupId)

  const lastHandledSpotlight = useRef(null)
  useEffect(() => {
    if (!spotlight || spotlight === lastHandledSpotlight.current) return
    if (spotlight.sectionId !== section._id) return
    lastHandledSpotlight.current = spotlight
    setExpandedIds(prev => {
      if (prev.has(spotlight.subsectionId)) return prev
      const next = new Set(prev)
      next.add(spotlight.subsectionId)
      return next
    })
  }, [spotlight, section._id])

  const allExpanded = subsections?.length > 0 && expandedIds.size === subsections.length

  function handleExpandAll() {
    if (allExpanded) {
      setExpandedIds(new Set())
    } else {
      setExpandedIds(new Set(subsections.map(s => s._id)))
    }
  }

  function handleToggleExpanded(id) {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <>
      <div className="section-card">
        <div className="section-card-header">
          <div className="section-card-title">
            <div className="section-card-title-row">
              <span className="section-card-number">Section {section.number}</span>
              <span className="section-card-name">{section.name}</span>
            </div>
            {(isRoomAdmin || sectionRole) && (
              <div className="section-card-role-row">
                <span className="section-card-role">
                  {isRoomAdmin ? 'Room Admin' : sectionRole}
                </span>
                {isRoomAdmin && section.groups?.admin && (
                  <button
                    className="section-card-admins-btn"
                    title="View Section Admins"
                    aria-label="View Section Admins"
                    onClick={() => setShowAdminsPopup(true)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM6 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM1.49 15.326a.78.78 0 0 1-.358-.442 3 3 0 0 1 4.308-3.516 6.484 6.484 0 0 0-1.905 3.959c-.023.222-.014.442.025.654a4.97 4.97 0 0 1-2.07-.655ZM16.44 15.98a4.97 4.97 0 0 0 2.07-.654.78.78 0 0 0 .357-.442 3 3 0 0 0-4.308-3.517 6.484 6.484 0 0 1 1.907 3.96 2.32 2.32 0 0 1-.026.654ZM18 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM5.304 16.19a.844.844 0 0 1-.277-.71 5 5 0 0 1 9.947 0 .843.843 0 0 1-.277.71A6.975 6.975 0 0 1 10 18a6.974 6.974 0 0 1-4.696-1.81Z" />
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>
          <button
            className="section-card-edit"
            onClick={isRoomAdmin ? () => setShowEditDialog(true) : undefined}
            disabled={!isRoomAdmin}
            aria-label={isRoomAdmin ? 'Edit section' : 'Edit section (not permitted)'}
            title={isRoomAdmin ? undefined : 'Not permitted'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 1 1 2.828 2.828l-.793.793-2.828-2.828.793-.793ZM11.379 5.793 3 14.172V17h2.828l8.38-8.379-2.83-2.828Z" />
            </svg>
          </button>
          {subsections?.length > 0 && (
            <button
              className="section-card-expand-all"
              onClick={handleExpandAll}
              aria-label={allExpanded ? 'Collapse all subsections' : 'Expand all subsections'}
            >
              {allExpanded ? 'Collapse All' : 'Expand All'}
            </button>
          )}
        </div>
        {isLoading && (
          <div className="section-card-loading">
            <Spinner className="section-card-spinner" />
            <span>Loading subsections…</span>
          </div>
        )}
        {subsectionsError && (
          <p className="section-card-error">
            Failed to load subsections: {subsectionsError.message ?? 'Unknown error'}
          </p>
        )}
        {!isLoading && !subsectionsError && subsections?.length === 0 && (
          <p className="section-card-empty">No subsections.</p>
        )}
        {!isLoading && !subsectionsError && subsections?.length > 0 && (
          <div className="subsection-table">
            <div className="subsection-table-header">
              <span />
              <span>Number</span>
              <span>Name</span>
              <span>Description</span>
              <span>Status</span>
            </div>
            {subsections.map(s => (
              <SubsectionRow
                key={s._id}
                section={section}
                subsection={s}
                subsections={subsections}
                expanded={expandedIds.has(s._id)}
                onToggleExpanded={() => handleToggleExpanded(s._id)}
              />
            ))}
          </div>
        )}
        {canManageSubsections && (
          <div className="section-card-footer">
            <Button onClick={() => setShowCreateSubsectionDialog(true)}>New Subsection</Button>
          </div>
        )}
      </div>
      {showEditDialog && (
        <EditSectionDialog
          section={section}
          sections={sections}
          onClose={() => setShowEditDialog(false)}
        />
      )}
      {showCreateSubsectionDialog && (
        <CreateSubsectionDialog
          section={section}
          subsections={subsections ?? []}
          onClose={() => setShowCreateSubsectionDialog(false)}
        />
      )}
      {showAdminsPopup && (
        <div className="section-admins-backdrop" onClick={() => setShowAdminsPopup(false)}>
          <div className="section-admins-popup" onClick={e => e.stopPropagation()}>
            <h3 className="section-admins-title">Section Admins</h3>
            {adminsLoading && (
              <div className="section-admins-loading">
                <Spinner />
                <span>Loading…</span>
              </div>
            )}
            {!adminsLoading && (!adminUsers || adminUsers.length === 0) && (
              <p className="section-admins-empty">No admins found.</p>
            )}
            {!adminsLoading && adminUsers && adminUsers.length > 0 && (
              <ul className="section-admins-list">
                {adminUsers.map(u => (
                  <li key={u._id ?? u.id}>
                    {[u._firstname ?? u.firstname, u._lastname ?? u.lastname].filter(Boolean).join(' ') || u.email || u._id}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </>
  )
}

export default SectionCard
