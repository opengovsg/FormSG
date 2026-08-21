import { useEffect, useRef } from 'react'

import { useInViewFlag } from './useInViewFlag'

/** Enough of the canvas on screen for the drag to be worth running. */
const IN_VIEW_THRESHOLD = 0.4
/** Field margin-bottom, in px. Part of the travel: a card has to clear its
 *  neighbour's box *and* the gap to land where the neighbour was. */
const FIELD_GAP_PX = 4
/** Beat after the field lifts, before it starts moving. */
const LIFT_MS = 420
/** How long it sits in the swapped position. */
const SWAPPED_MS = 950
/** How long it sits back home, still lifted. */
const RETURNED_MS = 650
/** How long the canvas rests before the drag repeats. */
const HOLD_MS = 2600

export interface UseBuilderDragResult {
  containerRef: React.RefObject<HTMLDivElement>
  firstFieldRef: React.RefObject<HTMLDivElement>
  secondFieldRef: React.RefObject<HTMLDivElement>
}

/**
 * Actually performs the drag the row's headline claims.
 *
 * The row's claim is "drag-and-drop", and a static grab handle was the only
 * thing carrying it while the workflow illustration next door moved. So the
 * first field is dragged past its neighbour and then returned, rather than left
 * in the new order: the field numbering is fixed, so a permanent swap would
 * leave the canvas reading "2." above "1.".
 *
 * Imperative rather than state-driven, unlike the workflow stack, because the
 * travel has to be *measured*. The two fields are different heights, and the
 * selected one changes height again when its actions row is present, so
 * hardcoding the offsets would drift the moment the mock's copy changes.
 *
 * Skipped entirely under `prefers-reduced-motion`. The static grab handle is
 * the reduced-motion state — it still says "draggable" without moving.
 */
export const useBuilderDrag = (): UseBuilderDragResult => {
  const { ref: containerRef, isInView } =
    useInViewFlag<HTMLDivElement>(IN_VIEW_THRESHOLD)
  const firstFieldRef = useRef<HTMLDivElement>(null)
  const secondFieldRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isInView) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const first = firstFieldRef.current
    const second = secondFieldRef.current
    if (!first || !second) return

    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined
    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        timer = setTimeout(resolve, ms)
      })

    const run = async () => {
      for (;;) {
        const firstTravel = first.offsetHeight + FIELD_GAP_PX
        const secondTravel = second.offsetHeight + FIELD_GAP_PX

        first.classList.add('lv5-field-lift')
        first.style.transform = 'rotate(-0.6deg)'
        await wait(LIFT_MS)
        if (cancelled) return

        first.style.transform = `translateY(${secondTravel}px) rotate(-0.6deg)`
        second.style.transform = `translateY(${-firstTravel}px)`
        await wait(SWAPPED_MS)
        if (cancelled) return

        first.style.transform = 'rotate(-0.6deg)'
        second.style.transform = ''
        await wait(RETURNED_MS)
        if (cancelled) return

        first.classList.remove('lv5-field-lift')
        first.style.transform = ''
        await wait(HOLD_MS)
        if (cancelled) return
      }
    }
    void run()

    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
      /* Leave the mock in its resting state, or a scroll-away mid-drag would
         freeze a field halfway across its neighbour. */
      first.classList.remove('lv5-field-lift')
      first.style.transform = ''
      second.style.transform = ''
    }
  }, [isInView])

  return { containerRef, firstFieldRef, secondFieldRef }
}
