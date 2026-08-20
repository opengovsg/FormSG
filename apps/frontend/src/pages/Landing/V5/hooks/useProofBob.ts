import { useCallback, useRef } from 'react'

/**
 * The proof section's one-shot bob: a decaying bounce used as a nudge, to hint
 * that the page continues below the hero.
 *
 * One-shot on purpose. It is a hint, and a hint that repeats is a tic.
 *
 * Skipped entirely under `prefers-reduced-motion` rather than shortened. Unlike
 * a reveal there is no content to land — the whole gesture is the animation, so
 * the honest reduced-motion behaviour is not to run it.
 *
 * The class is removed once the animation ends so the element is left with no
 * lingering transform of its own. Apply the returned ref to a wrapper *inside*
 * the section's `Reveal`, not to the revealed element itself: both animate
 * `transform`, and sharing one element would have them overwrite each other.
 */
export const useProofBob = <T extends HTMLElement = HTMLDivElement>() => {
  const ref = useRef<T>(null)
  const hasBobbed = useRef(false)

  const bob = useCallback(() => {
    const el = ref.current
    if (!el || hasBobbed.current) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    hasBobbed.current = true
    el.classList.add('lv5-bob')
    el.addEventListener('animationend', () => el.classList.remove('lv5-bob'), {
      once: true,
    })
  }, [])

  return { ref, bob }
}
