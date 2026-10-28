import { ReactNode } from 'react'
import { renderHook } from '@testing-library/react'

import {
  ResultsNavLayoutProvider,
  useResultsNavLayout,
} from './ResultsNavLayoutContext'

describe('Results navigation layout', () => {
  it('releases legacy offsets in labelled mode and restores response gutters when the flag changes', () => {
    let showNavLabels = true
    const wrapper = ({ children }: { children: ReactNode }) => (
      <ResultsNavLayoutProvider value={{ showNavLabels }}>
        {children}
      </ResultsNavLayoutProvider>
    )
    const { result, rerender } = renderHook(() => useResultsNavLayout('1rem'), {
      wrapper,
    })
    expect(result.current).toEqual({
      bleed: { ml: 0, w: '100%' },
      contentPr: 0,
    })
    showNavLabels = false
    rerender()
    expect(result.current).toEqual({
      bleed: {
        ml: { base: 0, lg: '-15rem' },
        w: { base: '100%', lg: 'calc(100% + 15rem)' },
      },
      contentPr: { base: '1rem', md: '1.75rem', lg: '2rem' },
    })
  })
  it('keeps the legacy page gutter when rendered without the layout provider', () => {
    const { result } = renderHook(() => useResultsNavLayout())
    expect(result.current.contentPr).toEqual({
      base: '1.5rem',
      md: '1.75rem',
      lg: '2rem',
    })
  })
})
