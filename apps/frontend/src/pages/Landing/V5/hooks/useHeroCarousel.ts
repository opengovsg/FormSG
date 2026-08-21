import { useCallback, useEffect, useRef, useState } from 'react'

/** Slack at either end before an arrow is considered disabled, in px. */
const EDGE_SLACK_PX = 4
/** How far the reader may have scrolled down and still be offered the nudge. */
const NUDGE_MAX_SCROLL_X_PX = 2
/** Delay before the nudge, in ms. After the stamp has landed: the press is the
 *  page's opening beat, and two things moving at once would blunt both. */
const NUDGE_DELAY_MS = 1250
/** How far ahead of the form pane the iframe is armed, in px. Loading on
 *  approach rather than on arrival means the form has begun fetching by the time
 *  the pane settles, without putting a second app inside the hero's paint
 *  window for the readers who never scroll sideways — which is most of them. */
const FRAME_ARM_MARGIN_PX = 400
/** Below this vertical scroll the reader has not started down the page, so the
 *  end-of-carousel hint is still worth offering. */
const REACH_END_MAX_SCROLL_Y_PX = 60

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n)

export interface UseHeroCarouselOptions {
  /**
   * Fired once, when the reader reaches the end of the carousel without having
   * started down the page. The sideways story has run out, so the page points
   * down.
   */
  onReachEnd?: () => void
}

export interface UseHeroCarouselResult {
  /** The sheet. Carries `--lv5-p`, which the panes and controls read. */
  sheetRef: React.RefObject<HTMLDivElement>
  /** The scroller. */
  carRef: React.RefObject<HTMLDivElement>
  /** The flex track. The nudge animates this, never the scroll position. */
  trackRef: React.RefObject<HTMLDivElement>
  /** Index of the pane nearest the viewport centre. Drives the dots. */
  activeIndex: number
  canScrollPrev: boolean
  canScrollNext: boolean
  goTo: (index: number) => void
  /** True once the form pane has been approached and the iframe may load. */
  isFrameArmed: boolean
}

/**
 * Drives the hero carousel: one number, read by everything.
 *
 * `--lv5-p` is progress through the first pane. The copy's fade and the visual
 * panes' growth both read it, so they cannot drift apart the way three separate
 * listeners would.
 *
 * Progress is measured against where the builder *settles*, not against the
 * copy's own width. Those are different numbers — centring the builder needs
 * less scroll than clearing the copy entirely — and keying off the copy left the
 * headline about 23% visible at the exact moment the panel was fully grown.
 * Measured from layout rather than hardcoded, since the widths are struck from
 * `--lv5-sheetw` and move with the viewport.
 */
export const useHeroCarousel = ({
  onReachEnd,
}: UseHeroCarouselOptions = {}): UseHeroCarouselResult => {
  const sheetRef = useRef<HTMLDivElement>(null)
  const carRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)

  const [activeIndex, setActiveIndex] = useState(0)
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(true)
  const [isFrameArmed, setIsFrameArmed] = useState(false)

  /** Distance over which the first pane hands over to the builder. */
  const spanRef = useRef(1)
  const isTickingRef = useRef(false)
  const hasReachedEndRef = useRef(false)
  /** Kept in a ref so the scroll listener never needs re-attaching when the
   *  caller passes a new function identity. */
  const onReachEndRef = useRef(onReachEnd)
  onReachEndRef.current = onReachEnd

  const panes = useCallback((): HTMLElement[] => {
    const car = carRef.current
    if (!car) return []
    return Array.from(car.querySelectorAll<HTMLElement>('.lv5-hcar-pane'))
  }, [])

  const measure = useCallback(() => {
    const car = carRef.current
    const all = panes()
    if (!car || all.length < 2) return
    const builder = all[1]
    spanRef.current = Math.max(
      1,
      builder.offsetLeft - (car.clientWidth - builder.offsetWidth) / 2,
    )
  }, [panes])

  const paint = useCallback(() => {
    isTickingRef.current = false
    const car = carRef.current
    const sheet = sheetRef.current
    if (!car || !sheet) return

    const progress = clamp01(car.scrollLeft / spanRef.current)
    sheet.style.setProperty('--lv5-p', progress.toFixed(4))
    car.dataset.faded = progress > 0.9 ? 'true' : 'false'

    /* Nearest pane to the viewport centre wins the dot. Cheaper and steadier
       than an observer per pane, and it never lands between two states. */
    const mid = car.scrollLeft + car.clientWidth / 2
    let best = 0
    let bestDistance = Infinity
    panes().forEach((pane, index) => {
      const centre = pane.offsetLeft + pane.offsetWidth / 2
      const distance = Math.abs(centre - mid)
      if (distance < bestDistance) {
        bestDistance = distance
        best = index
      }
    })
    setActiveIndex(best)

    const maxScroll = car.scrollWidth - car.clientWidth
    setCanScrollPrev(car.scrollLeft >= EDGE_SLACK_PX)
    setCanScrollNext(car.scrollLeft <= maxScroll - EDGE_SLACK_PX)

    /* The sideways story has run out, so point down — once, and not if the
       reader is already heading down the page on their own. A hint for
       something they are visibly doing would be noise. */
    if (
      !hasReachedEndRef.current &&
      car.scrollLeft > maxScroll - 8 &&
      window.scrollY <= REACH_END_MAX_SCROLL_Y_PX
    ) {
      hasReachedEndRef.current = true
      onReachEndRef.current?.()
    }
  }, [panes])

  /* rAF-throttled: a scroll handler that writes a custom property on every
     event forces style recalc faster than the compositor can use it. */
  const onScroll = useCallback(() => {
    if (isTickingRef.current) return
    isTickingRef.current = true
    requestAnimationFrame(paint)
  }, [paint])

  const goTo = useCallback(
    (index: number) => {
      const car = carRef.current
      const all = panes()
      if (!car || !all.length) return
      const clamped = Math.max(0, Math.min(all.length - 1, index))
      const pane = all[clamped]
      /* The copy reads from its own left margin, while a visual centred in the
         sheet is the composition the growth is built around. */
      const left =
        clamped === 0
          ? 0
          : pane.offsetLeft - (car.clientWidth - pane.offsetWidth) / 2
      car.scrollTo({
        left,
        behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      })
    },
    [panes],
  )

  useEffect(() => {
    const car = carRef.current
    if (!car) return
    measure()
    paint()
    car.addEventListener('scroll', onScroll, { passive: true })
    const onResize = () => {
      measure()
      paint()
    }
    window.addEventListener('resize', onResize)
    return () => {
      car.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
    }
  }, [measure, onScroll, paint])

  /* Arm the iframe on approach. */
  useEffect(() => {
    const car = carRef.current
    if (!car || isFrameArmed) return
    const formPane = car.querySelector('[data-pane="form"]')
    if (!formPane || typeof IntersectionObserver === 'undefined') {
      setIsFrameArmed(true)
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsFrameArmed(true)
          observer.disconnect()
        }
      },
      {
        root: car,
        rootMargin: `0px ${FRAME_ARM_MARGIN_PX}px 0px ${FRAME_ARM_MARGIN_PX}px`,
      },
    )
    observer.observe(formPane)
    return () => observer.disconnect()
  }, [isFrameArmed])

  /* The nudge: the panel shifts and settles back once, so the reader sees that
     it moves rather than being told so in a caption. Deliberately singular — a
     loop would read as a broken animation and would keep pulling the eye off
     the headline, which is still the hero's first job. */
  useEffect(() => {
    if (prefersReducedMotion()) return
    let isCancelled = false
    const track = trackRef.current

    /* Cancelling actually cancels: dropping the class ends the animation
       wherever it is, and because it only ever moved a transform, the reader's
       scroll position was never the animation's to damage. */
    const cancel = () => {
      isCancelled = true
      track?.classList.remove('lv5-nudge')
    }
    const events: (keyof WindowEventMap)[] = [
      'pointerdown',
      'wheel',
      'touchstart',
      'keydown',
    ]
    events.forEach((event) =>
      window.addEventListener(event, cancel, { once: true, passive: true }),
    )

    const timer = setTimeout(() => {
      const car = carRef.current
      if (isCancelled || !track || !car) return
      if (car.scrollLeft > NUDGE_MAX_SCROLL_X_PX) return
      track.classList.add('lv5-nudge')
      track.addEventListener(
        'animationend',
        () => track.classList.remove('lv5-nudge'),
        { once: true },
      )
    }, NUDGE_DELAY_MS)

    return () => {
      clearTimeout(timer)
      events.forEach((event) => window.removeEventListener(event, cancel))
      track?.classList.remove('lv5-nudge')
    }
  }, [])

  return {
    sheetRef,
    carRef,
    trackRef,
    activeIndex,
    canScrollPrev,
    canScrollNext,
    goTo,
    isFrameArmed,
  }
}
