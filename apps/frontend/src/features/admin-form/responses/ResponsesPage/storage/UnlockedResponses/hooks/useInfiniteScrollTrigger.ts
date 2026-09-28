import { useCallback, useEffect, useRef } from 'react'

export const useInfiniteScrollTrigger = <T extends HTMLElement>({
  onTrigger,
  enabled,
  rootMargin = '400px',
}: {
  onTrigger: () => void
  enabled: boolean
  rootMargin?: string
}) => {
  const sentinelRef = useRef<T>(null)
  const onTriggerRef = useRef(onTrigger)

  useEffect(() => {
    onTriggerRef.current = onTrigger
  }, [onTrigger])

  const observe = useCallback(
    (node: T) => {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            onTriggerRef.current()
          }
        },
        { rootMargin },
      )
      observer.observe(node)
      return observer
    },
    [rootMargin],
  )

  useEffect(() => {
    const node = sentinelRef.current
    if (!enabled || !node) return
    const observer = observe(node)
    return () => observer.disconnect()
  }, [enabled, observe])

  return sentinelRef
}
