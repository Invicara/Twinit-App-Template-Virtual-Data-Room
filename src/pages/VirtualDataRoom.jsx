import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSections } from '../services/useSections'
import { useSubsections } from '../services/useSubsections'
import Button from '../components/Button'
import Spinner from '../components/Spinner'
import SectionCard from '../components/SectionCard'
import CreateSectionDialog from '../components/CreateSectionDialog'
import SearchBar from '../components/SearchBar'
import { SearchHighlightProvider, useSearchHighlight } from '../context/SearchHighlightContext'
import { useUser } from '../context/UserContext'
import './VirtualDataRoom.css'

function HamburgerMenu() {
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="hamburger-menu" ref={menuRef}>
      <button
        className="hamburger-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-label="Open menu"
        aria-expanded={open}
      >
        <span />
        <span />
        <span />
      </button>
      {open && (
        <ul className="hamburger-dropdown" role="menu">
          <li
            role="menuitem"
            onClick={() => { setOpen(false); navigate('/manage-users') }}
          >
            <svg className="menu-item-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            Manage Users
          </li>
          <li
            role="menuitem"
            onClick={() => { setOpen(false); navigate('/trash') }}
          >
            <svg className="menu-item-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14H6L5 6" />
              <path d="M10 11v6" />
              <path d="M14 11v6" />
              <path d="M9 6V4h6v2" />
            </svg>
            View Trash Bin
          </li>
        </ul>
      )}
    </div>
  )
}

/**
 * Renders a styled card shell with the section header and a spinner until subsections have loaded,
 * then swaps in the real SectionCard. Prevents layout cascade from short intermediate states.
 */
function LazySection({ section, sections }) {
  const ref = useRef(null)
  const [isVisible, setIsVisible] = useState(false)
  const { roles } = useUser()
  const isRoomAdmin = roles?.room_admin === true
  const sectionRole = roles?.[section._id]

  const { spotlight, setNavigating } = useSearchHighlight()

  useEffect(() => {
    if (spotlight?.sectionId === section._id) {
      setIsVisible(true)
    }
  }, [spotlight, section._id])

  const { isLoading: subsectionsLoading } = useSubsections(section._id, { enabled: isVisible })

  useEffect(() => {
    if (spotlight?.sectionId === section._id && isVisible && !subsectionsLoading) {
      setNavigating(false)
    }
  }, [spotlight, section._id, isVisible, subsectionsLoading, setNavigating])

  const observerRef = useRef(null)

  const attachRef = useCallback((node) => {
    ref.current = node
    if (observerRef.current) {
      observerRef.current.disconnect()
      observerRef.current = null
    }
    if (node && !isVisible) {
      observerRef.current = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
            observerRef.current?.disconnect()
          }
        },
        { rootMargin: '300px' }
      )
      observerRef.current.observe(node)
    }
  }, [isVisible])

  useEffect(() => {
    return () => observerRef.current?.disconnect()
  }, [])

  if (!isVisible || subsectionsLoading) {
    return (
      <div ref={attachRef} className="section-card section-card-placeholder">
        <div className="section-card-header">
          <div className="section-card-title">
            <div className="section-card-title-row">
              <span className="section-card-number">Section {section.number}</span>
              <span className="section-card-name">{section.name}</span>
            </div>
            {(isRoomAdmin || sectionRole) && (
              <span className="section-card-role">
                {isRoomAdmin ? 'Room Admin' : sectionRole}
              </span>
            )}
          </div>
        </div>
        {isVisible && subsectionsLoading && (
          <div className="section-card-loading">
            <Spinner className="section-card-spinner" />
            <span>Loading subsections…</span>
          </div>
        )}
      </div>
    )
  }

  return <SectionCard section={section} sections={sections} />
}

/**
 * Small fixed toast shown while navigating to a search result that needs to load.
 * Reads navigating + spotlight from context so it must render inside SearchHighlightProvider.
 */
function NavigationToast({ sections }) {
  const { navigating, spotlight } = useSearchHighlight()
  const section = sections?.find(s => s._id === spotlight?.sectionId)

  if (!navigating) return null

  return (
    <div className="nav-toast" role="status" aria-live="polite">
      <Spinner />
      <span>Navigating to <strong>{section?.name ?? 'result'}</strong>…</span>
    </div>
  )
}

function VirtualDataRoom() {
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const { roles } = useUser()
  const isRoomAdmin = roles?.room_admin === true

  const { data: sections, isLoading, isFetching, error } = useSections()

  if (isLoading) return <div className="vdr-status"><Spinner /> Loading Room...</div>
  if (error) return <div className="vdr-status vdr-error">Error: {error.message}</div>

  return (
    <SearchHighlightProvider>
      <>
        <NavigationToast sections={sections} />
        <div className="vdr-content">
          <div className="vdr-toolbar">
            {isFetching && <Spinner />}
            <SearchBar />
            {isRoomAdmin && <Button onClick={() => setShowCreateDialog(true)}>New Section</Button>}
            {isRoomAdmin && <HamburgerMenu />}
          </div>
          {!sections?.length && <div className="vdr-empty">
            <p>Your Room is empty.</p>
            <Button onClick={() => setShowCreateDialog(true)}>Create Your First Section</Button>
          </div>}
          {!!sections?.length && <div className="vdr-sections">
            {sections.map((section) => (
              <LazySection key={section._id} section={section} sections={sections} />
            ))}
          </div>}
        </div>
        {showCreateDialog && (
          <CreateSectionDialog
            sections={sections}
            onClose={() => setShowCreateDialog(false)}
          />
        )}
      </>
    </SearchHighlightProvider>
  )
}

export default VirtualDataRoom
