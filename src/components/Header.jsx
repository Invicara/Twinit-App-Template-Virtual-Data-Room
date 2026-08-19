import { useState, useRef, useEffect } from 'react'

import pkg from '../../package.json'

import { IafSession } from '@dtplatform/platform-api'
import { useUser } from '../context/UserContext'
import { useProject } from '../context/ProjectContext'
import { logout } from '../auth/auth'
import twinitLogo from '../assets/Twinit-textmark-light.png'
import './Header.css'

export default function Header() {
  const { user, userLoading } = useUser()
  const { project, clearProject } = useProject()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  const firstName = user?._firstname ?? user?.firstname ?? ''
  const lastName = user?._lastname ?? user?.lastname ?? ''
  const fullName = [firstName, lastName].filter(Boolean).join(' ') || 'User'
  const initials = [firstName[0], lastName[0]].filter(Boolean).join('').toUpperCase() || '?'

  const appVersion = pkg.version

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleMyProfile() {
    setMenuOpen(false)
    const url = await IafSession.getAccountSettingsUrl(window.location)
    window.location.href = url
  }

  function handleSwitchProjects() {
    setMenuOpen(false)
    clearProject()
  }

  async function handleLogout() {
    setMenuOpen(false)
    await logout()
  }

  return (
    <header className="app-header">
      <div className="app-header-inner">
        <img src={twinitLogo} alt="Twinit" className="header-logo" />
        {project?._name && (
          <span className="header-project-name">Virtual Data Room: {project._name}</span>
        )}
        {!userLoading && (
          <div className="app-header-user" ref={menuRef}>
          <div className="user-avatar">{initials}</div>
          <span className="user-name">{fullName}</span>
          <button
            className={`user-menu-toggle${menuOpen ? ' open' : ''}`}
            onClick={() => setMenuOpen((v) => !v)}
            aria-haspopup="true"
            aria-expanded={menuOpen}
            aria-label="User menu"
          >
            <svg
              className="chevron-icon"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          {menuOpen && (
            <ul className="user-menu-dropdown" role="menu">
              <li role="none">
                <button role="menuitem" onClick={handleMyProfile}>My Profile</button>
              </li>
              <li role="none">
                <button role="menuitem" onClick={handleSwitchProjects}>Switch Room</button>
              </li>
              <li role="separator" className="user-menu-divider" style={{borderTop: '1px solid #ececec', margin: '6px 8px'}}></li>
        
              <li role="none">
                <button role="menuitem" onClick={handleLogout}>Logout</button>
              </li>
              <li role="none">
                <span className="user-menu-version">{appVersion}</span>
              </li>
            </ul>
          )}
        </div>
        )}
      </div>
    </header>
  )
}
