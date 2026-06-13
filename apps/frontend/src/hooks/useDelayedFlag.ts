import { useEffect, useState } from 'react'

/**
 * Returns `true` only once `active` has stayed `true` continuously for at least
 * `delayMs`. Resets to `false` the moment `active` becomes `false`.
 *
 * Useful for avoiding a flash-of-loading-state: gate a skeleton/spinner behind
 * this so fast operations (that finish before `delayMs`) never render it, while
 * genuinely slow ones still do.
 */
export const useDelayedFlag = (active: boolean, delayMs: number): boolean => {
  const [isElapsed, setIsElapsed] = useState(false)

  useEffect(() => {
    if (!active) {
      setIsElapsed(false)
      return
    }

    const timeoutId = window.setTimeout(() => setIsElapsed(true), delayMs)
    return () => window.clearTimeout(timeoutId)
  }, [active, delayMs])

  return active && isElapsed
}
