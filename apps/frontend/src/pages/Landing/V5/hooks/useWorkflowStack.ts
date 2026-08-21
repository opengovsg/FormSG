import { useEffect, useState } from 'react'

import { useInViewFlag } from './useInViewFlag'

/** Enough of the stack on screen to be worth animating to. */
const IN_VIEW_THRESHOLD = 0.3
/** Beat before the first card drops, so the sequence reads as starting. */
const LEAD_IN_MS = 600
/** Card lands, then a beat before its stamp comes down. */
const LAND_TO_STAMP_MS = 650
/** Stamp lands, then a beat before the next card. */
const STAMP_TO_NEXT_MS = 450
/** How long the finished stack is left up before the loop restarts. */
const HOLD_MS = 2600

export interface UseWorkflowStackResult {
  ref: React.RefObject<HTMLDivElement>
  /** How many cards have landed. */
  landedCount: number
  /** How many of those have been stamped. */
  stampedCount: number
}

/**
 * Drives the stamped stack: cards drop in one at a time and each gets stamped
 * once it has settled.
 *
 * Runs only while the stack is on screen, and restarts from the top each time
 * it comes back into view. The prototype achieved that by polling a visibility
 * flag every 500ms; gating the effect on the flag instead means no timers run
 * at all while the illustration is away.
 *
 * Under `prefers-reduced-motion` the finished stack is rendered directly. The
 * three stamped steps are the content; only the dropping is decoration.
 */
const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

export const useWorkflowStack = (cardCount: number): UseWorkflowStackResult => {
  const { ref, isInView } = useInViewFlag<HTMLDivElement>(IN_VIEW_THRESHOLD)
  /* Seeded lazily rather than set from an effect. Under reduced motion the
     finished stack has to be correct on the very first paint: seeding zero and
     correcting afterwards would play the one transition the setting exists to
     prevent. */
  const [landedCount, setLandedCount] = useState(() =>
    prefersReducedMotion() ? cardCount : 0,
  )
  const [stampedCount, setStampedCount] = useState(() =>
    prefersReducedMotion() ? cardCount : 0,
  )

  useEffect(() => {
    if (prefersReducedMotion()) return
    if (!isInView) return

    /* The loop is unbounded, so it needs a way out. Without both the flag and
       the cleared timer, an unmounted component keeps setting state. */
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined
    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        timer = setTimeout(resolve, ms)
      })

    const run = async () => {
      for (;;) {
        setLandedCount(0)
        setStampedCount(0)
        await wait(LEAD_IN_MS)
        if (cancelled) return
        for (let i = 0; i < cardCount; i++) {
          setLandedCount(i + 1)
          await wait(LAND_TO_STAMP_MS)
          if (cancelled) return
          setStampedCount(i + 1)
          await wait(STAMP_TO_NEXT_MS)
          if (cancelled) return
        }
        await wait(HOLD_MS)
        if (cancelled) return
      }
    }
    void run()

    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [cardCount, isInView])

  return { ref, landedCount, stampedCount }
}
