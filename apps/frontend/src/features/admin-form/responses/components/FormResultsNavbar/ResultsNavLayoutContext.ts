import { createContext, useContext } from 'react'

import { resultsNavBleed } from './constants'

const ResultsNavLayoutContext = createContext({ showNavLabels: false })
export const ResultsNavLayoutProvider = ResultsNavLayoutContext.Provider

export const useResultsNavLayout = (legacyMobilePr = '1.5rem') => {
  const { showNavLabels } = useContext(ResultsNavLayoutContext)
  return {
    // Labelled content stays inside the remaining flex column, even collapsed.
    bleed: showNavLabels ? { ml: 0, w: '100%' } : resultsNavBleed,
    contentPr: showNavLabels
      ? 0
      : { base: legacyMobilePr, md: '1.75rem', lg: '2rem' },
  }
}
