import { useEffect, useRef } from 'react'

export const useTimeout = (
  callback: (...args: unknown[]) => void,
  delay: number | null,
) => {
  const savedCallback = useRef(callback)

  useEffect(() => {
    if (delay == null) return

    const timeoutId = window.setTimeout(() => {
      savedCallback.current()
    }, delay)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [delay])
}
