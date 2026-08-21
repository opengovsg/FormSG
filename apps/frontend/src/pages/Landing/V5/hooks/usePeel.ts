import { useCallback, useEffect, useRef } from 'react'

import { foldShadowOpacity } from '../utils/foldShadowOpacity'

/**
 * Below this the tween is close enough to be finished. Without a floor the lerp
 * approaches the target asymptotically and the loop never stops.
 */
const SETTLE_EPSILON_PX = 0.4

/**
 * The auto-open observer wants the card properly in view, not merely touched by
 * the viewport edge — the fold is the section's one big gesture and should not
 * happen off to the side. Deliberately stricter than `useReveal`'s 0.15.
 */
const AUTO_OPEN_THRESHOLD = 0.5

export interface UsePeelOptions {
  /** Cut length at rest, in px. A sealed corner is 0. */
  rest: number
  /** Cut length when open, in px. */
  open: number
  /**
   * Fraction of the remaining distance covered each frame. Higher is snappier;
   * the prototype uses 0.055 for the big security fold and 0.085 for the small
   * hover peels, so a longer travel is also a slower one.
   */
  speed: number
  /**
   * When set, the peel opens itself the first time it scrolls into view, after
   * this delay. The pause matters: opening the instant the card appears reads
   * as a page-load artefact rather than as something happening.
   */
  autoOpenDelayMs?: number
}

/**
 * The corner peel: one value on a dial, tweened per frame.
 *
 * Ported from the prototype's `makePeel`. Writes two custom properties onto the
 * host element on every frame — `--lv5-c`, the cut length, which drives the
 * clip-path and the blade's size, and `--lv5-sh`, the crease shadow's opacity.
 * Because both are written together they cannot fall out of step.
 *
 * Under `prefers-reduced-motion` the peel snaps straight to its target instead
 * of being skipped. What the fold uncovers is content, so suppressing it would
 * withhold the point; only the travel is decoration.
 */
export const usePeel = <T extends HTMLElement = HTMLDivElement>({
  rest,
  open,
  speed,
  autoOpenDelayMs,
}: UsePeelOptions) => {
  const ref = useRef<T>(null)
  const current = useRef(rest)
  const target = useRef(rest)
  const frame = useRef<number | null>(null)

  const apply = useCallback(
    (value: number) => {
      const el = ref.current
      if (!el) return
      el.style.setProperty('--lv5-c', `${value.toFixed(1)}px`)
      el.style.setProperty(
        '--lv5-sh',
        foldShadowOpacity(value, open).toFixed(3),
      )
    },
    [open],
  )

  const tick = useCallback(() => {
    current.current += (target.current - current.current) * speed
    if (Math.abs(target.current - current.current) < SETTLE_EPSILON_PX) {
      current.current = target.current
      apply(current.current)
      frame.current = null
      return
    }
    apply(current.current)
    frame.current = requestAnimationFrame(tick)
  }, [apply, speed])

  const go = useCallback(
    (value: number) => {
      target.current = value
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        current.current = value
        apply(value)
        return
      }
      if (frame.current === null) {
        frame.current = requestAnimationFrame(tick)
      }
    },
    [apply, tick],
  )

  /* Paint the resting state on mount. Without this the card's first frame has
     no `--lv5-c` of its own and falls back to the @property initial value of
     0px, so a card that rests half-cut would flash sealed. */
  useEffect(() => {
    apply(current.current)
  }, [apply])

  useEffect(
    () => () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current)
    },
    [],
  )

  useEffect(() => {
    const el = ref.current
    if (!el || autoOpenDelayMs === undefined) return
    if (typeof IntersectionObserver === 'undefined') {
      go(open)
      return
    }

    let timer: ReturnType<typeof setTimeout> | undefined
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          observer.unobserve(el)
          timer = setTimeout(() => go(open), autoOpenDelayMs)
        })
      },
      { threshold: AUTO_OPEN_THRESHOLD },
    )
    observer.observe(el)

    return () => {
      observer.disconnect()
      if (timer) clearTimeout(timer)
    }
  }, [autoOpenDelayMs, go, open])

  return {
    ref,
    /** Pointer handlers, ready to spread onto the host element. */
    handlers: {
      onMouseEnter: () => go(open),
      onMouseLeave: () => go(rest),
      onClick: () => go(target.current === open ? rest : open),
    },
  }
}
