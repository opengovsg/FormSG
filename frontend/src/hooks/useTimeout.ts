import { useEffect, useRef } from 'react'

export const useTimeout = (
  callback: (...args: unknown[]) => void,
  delay: number | null,
) => {
  const savedCallback = useRef(callback)

  useEffect(() => {
    if (delay == null) return

    let timeoutId: number | null = null

    timeoutId = window.setTimeout(() => {
      savedCallback.current()
    }, delay)

    return () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId)
      }
    }
  }, [delay])
}
