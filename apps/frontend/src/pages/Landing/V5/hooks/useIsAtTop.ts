import { useEffect, useState } from 'react'

/** Below this the page counts as still at the top, in px. */
const AT_TOP_PX = 40

/**
 * Whether the page is still at the very top.
 *
 * Used only for the proof section's peek: it is faded while the reader has not
 * moved, so the sliver below the hero reads as a hint rather than as a heading
 * accidentally clipped. A fade that persisted would be a permanent handicap on
 * real content, which is why this stops applying the moment they scroll.
 *
 * rAF-throttled, since a scroll listener that sets state on every event
 * re-renders faster than anything can use.
 */
export const useIsAtTop = (): boolean => {
  const [isAtTop, setIsAtTop] = useState(true)

  useEffect(() => {
    let isTicking = false
    const read = () => {
      isTicking = false
      setIsAtTop(window.scrollY < AT_TOP_PX)
    }
    const onScroll = () => {
      if (isTicking) return
      isTicking = true
      requestAnimationFrame(read)
    }
    read()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return isAtTop
}
