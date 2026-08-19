import { useState, useRef, useEffect } from 'react'
import { useSearch } from '../services/useSearch'
import { useSearchHighlight } from '../context/SearchHighlightContext'
import './SearchBar.css'

export default function SearchBar() {
  const [inputValue, setInputValue] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)
  const { setSpotlight, setNavigating } = useSearchHighlight()

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(inputValue)
    }, 300)
    return () => clearTimeout(timer)
  }, [inputValue])

  const { data, isLoading } = useSearch(debouncedQuery)
  const documents = data?.documents ?? []
  const links = data?.links ?? []

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleInputChange(e) {
    setInputValue(e.target.value)
    setIsOpen(true)
    setSpotlight(null)
  }

  function handleResultClick(result, type) {
    setNavigating(true)
    setSpotlight({
      type,
      sectionId: result.sectionId,
      subsectionId: result.subsectionId,
      itemId: result._id,
    })
    setIsOpen(false)
  }

  function handleFocus() {
    if (inputValue.trim()) setIsOpen(true)
  }

  function handleClear() {
    setInputValue('')
    setDebouncedQuery('')
    setIsOpen(false)
  }

  const showDropdown = isOpen && debouncedQuery.trim().length > 0

  return (
    <div className="search-bar" ref={containerRef}>
      <div className="search-input-wrapper">
        <svg className="search-icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path
            fillRule="evenodd"
            d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
            clipRule="evenodd"
          />
        </svg>
        <input
          type="text"
          className="search-input"
          placeholder="Search documents & links…"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          aria-label="Search"
          aria-autocomplete="list"
          aria-expanded={showDropdown}
          aria-haspopup="listbox"
        />
        {inputValue && (
          <button className="search-clear" onClick={handleClear} aria-label="Clear search">
            <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>

      {showDropdown && (
        <div className="search-dropdown" role="listbox" aria-label="Search results">
          <div className="search-section">
            <div className="search-section-label">Documents</div>
            {isLoading ? (
              <div className="search-section-empty">Searching…</div>
            ) : documents.length > 0 ? (
              documents.map((doc) => (
                <div
                  key={doc._id}
                  className="search-result-item"
                  role="option"
                  tabIndex={0}
                  onClick={() => handleResultClick(doc, 'document')}
                  onKeyDown={(e) => e.key === 'Enter' && handleResultClick(doc, 'document')}
                  title={doc._name ?? doc.name}
                >
                  <svg className="search-result-icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="search-result-name">{doc._name ?? doc.name}</span>
                </div>
              ))
            ) : (
              <div className="search-section-empty">No documents found</div>
            )}
          </div>

          <div className="search-section-divider" />

          <div className="search-section">
            <div className="search-section-label">Links</div>
            {isLoading ? (
              <div className="search-section-empty">Searching…</div>
            ) : links.length > 0 ? (
              links.map((link) => (
                <div
                  key={link._id}
                  className="search-result-item"
                  role="option"
                  tabIndex={0}
                  onClick={() => handleResultClick(link, 'link')}
                  onKeyDown={(e) => e.key === 'Enter' && handleResultClick(link, 'link')}
                  title={link._name ?? link.name}
                >
                  <svg className="search-result-icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="search-result-name">{link._name ?? link.name}</span>
                </div>
              ))
            ) : (
              <div className="search-section-empty">No links found</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
