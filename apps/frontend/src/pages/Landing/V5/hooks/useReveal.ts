import { useEffect, useRef } from 'react'

/**
 * Fraction of the element that must be visible before it reveals. Matches the
 * prototype. Low enough that a tall section starts rising as soon as its top
 * edge is comfortably in view, rather than waiting to be half on screen.
 */
const REVEAL_THRESHOLD = 0.15

/**
 * Reveals an element once it scrolls into view, and then stops watching it.
 *
 * Sets `data-revealed="true"` rather than returning state, so a page with
 * twenty reveals does not re-render twenty components while the reader
 * scrolls. The transition itself lives in `landing-v5.css`.
 *
 * One observer per element. A single shared observer would be marginally
 * cheaper, but it needs module-level state that has to be torn down correctly
 * across route changes, and at this page's scale (roughly twenty elements)
 * that complexity buys nothing measurable.
 */
export const useReveal = <T extends HTMLElement = HTMLDivElement>() => {
  const ref = useRef<T>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Reveal immediately where IntersectionObserver is unavailable, so the
    // content is never left at opacity 0 with nothing to flip it.
    if (typeof IntersectionObserver === 'undefined') {
      el.dataset.revealed = 'true'
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          ;(entry.target as HTMLElement).dataset.revealed = 'true'
          observer.unobserve(entry.target)
        }
      },
      { threshold: REVEAL_THRESHOLD },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return ref
}
