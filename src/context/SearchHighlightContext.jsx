import { createContext, useContext, useState } from 'react'

/**
 * Holds the currently spotlighted search result so that any component in
 * the tree can react — expanding a subsection, scrolling to a row, or
 * playing the throb animation — without prop-drilling.
 *
 * spotlight shape: { type: 'document'|'link', sectionId, subsectionId, itemId }
 * navigating: true while the target section is loading after a search result click
 */
const SearchHighlightContext = createContext(null)

export function SearchHighlightProvider({ children }) {
  const [spotlight, setSpotlight] = useState(null)
  const [navigating, setNavigating] = useState(false)
  return (
    <SearchHighlightContext.Provider value={{ spotlight, setSpotlight, navigating, setNavigating }}>
      {children}
    </SearchHighlightContext.Provider>
  )
}

export function useSearchHighlight() {
  return useContext(SearchHighlightContext)
}
