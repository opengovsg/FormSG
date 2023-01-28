import { useCallback, useEffect } from 'react'

export const useNativeBlocker = (when: boolean) => {
  const listener = useCallback(
    (e: BeforeUnloadEvent) => {
      if (when) e.returnValue = ''
    },
    [when],
  )

  useEffect(() => {
    window?.addEventListener('beforeunload', listener)
    return () => {
      window?.removeEventListener('beforeunload', listener)
    }
  }, [listener])
}
