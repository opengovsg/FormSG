import { useEffect, useRef, useState } from 'react'

/**
 * Tracks whether an element is currently in view, as a piece of state.
 *
 * Distinct from `useReveal`, which fires once and stops watching. The two
 * looping illustrations on this page need the opposite: a flag that keeps
 * updating, so a loop can idle while its illustration is off screen instead of
 * animating to nobody.
 *
 * Falls open when IntersectionObserver is unavailable, so the loops run rather
 * than stall.
 */
export const useInViewFlag = <T extends HTMLElement = HTMLDivElement>(
  threshold: number,
) => {
  const ref = useRef<T>(null)
  const [isInView, setIsInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      setIsInView(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => setIsInView(entry.isIntersecting))
      },
      { threshold },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])

  return { ref, isInView }
}
