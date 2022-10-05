import type { Dispatch, SetStateAction } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

// Modified from rooks/useSessionstorageStage
// https://github.com/imbhargav5/rooks/blob/main/src/hooks/useSessionstorageState.ts
// Fixing the issue of the hook setting undefined string as the value when none is provided.

function getValueFromSessionStorage(key: string) {
  if (typeof sessionStorage === 'undefined') {
    return null
  }
  const storedValue = sessionStorage.getItem(key) ?? 'null'
  try {
    return JSON.parse(storedValue)
  } catch (error) {
    console.error(error)
  }

  return storedValue
}

function saveValueToSessionStorage<S>(key: string, value: S) {
  if (typeof sessionStorage === 'undefined' || value === undefined) {
    return null
  }
  return sessionStorage.setItem(key, JSON.stringify(value))
}

/**
 * @param key Key of the sessionStorage object
 * @param initialState Default initial value
 */
function initialize<S>(key: string, initialState: S) {
  const valueLoadedFromSessionStorage = getValueFromSessionStorage(key)

  if (valueLoadedFromSessionStorage === null) {
    return initialState
  } else {
    return valueLoadedFromSessionStorage
  }
}

type UseSessionstorateStateReturnValue<S> = [
  S,
  Dispatch<SetStateAction<S>>,
  () => void,
]
type BroadcastCustomEvent<S> = CustomEvent<{ newValue: S }>
/**
 * useSessionStorage hook
 * Tracks a value within sessionStorage and updates it
 *
 * @param {string} key - Key of the sessionStorage object
 * @param {any} initialState - Default initial value
 */
export function useSessionStorage<S>(
  key: string,
  initialState?: S | (() => S),
): UseSessionstorateStateReturnValue<S> {
  const [value, setValue] = useState(() => initialize(key, initialState))

  const isUpdateFromCrossDocumentListener = useRef(false)
  const isUpdateFromWithinDocumentListener = useRef(false)
  const customEventTypeName = useMemo(() => {
    return `rooks-${key}-sessionstorage-update`
  }, [key])
  useEffect(() => {
    /**
     * We need to ensure there is no loop of
     * storage events fired. Hence we are using a ref
     * to keep track of whether setValue is from another
     * storage event
     */
    if (!isUpdateFromCrossDocumentListener.current && value !== undefined) {
      saveValueToSessionStorage(key, value)
    }
  }, [key, value])

  const listenToCrossDocumentStorageEvents = useCallback(
    (event: StorageEvent) => {
      if (event.storageArea === sessionStorage && event.key === key) {
        try {
          isUpdateFromCrossDocumentListener.current = true
          const newValue = JSON.parse(event.newValue ?? 'null')
          if (value !== newValue) {
            setValue(newValue)
          }
        } catch (error) {
          console.log(error)
        }
      }
    },
    [key, value],
  )

  // check for changes across windows
  useEffect(() => {
    // eslint-disable-next-line no-negated-condition
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', listenToCrossDocumentStorageEvents)

      return () => {
        window.removeEventListener(
          'storage',
          listenToCrossDocumentStorageEvents,
        )
      }
    } else {
      console.warn('[useSessionstorageState] window is undefined.')

      // eslint-disable-next-line @typescript-eslint/no-empty-function
      return () => {}
    }
  }, [listenToCrossDocumentStorageEvents])

  const listenToCustomEventWithinDocument = useCallback(
    (event: BroadcastCustomEvent<S>) => {
      try {
        isUpdateFromWithinDocumentListener.current = true
        const { newValue } = event.detail
        if (value !== newValue) {
          setValue(newValue)
        }
      } catch (error) {
        console.log(error)
      }
    },
    [value],
  )

  // check for changes within document
  useEffect(() => {
    // eslint-disable-next-line no-negated-condition
    if (typeof document !== 'undefined') {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      document.addEventListener(
        customEventTypeName,
        listenToCustomEventWithinDocument,
      )

      return () => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        document.removeEventListener(
          customEventTypeName,
          listenToCustomEventWithinDocument,
        )
      }
    } else {
      console.warn('[useSessionstorageState] document is undefined.')

      // eslint-disable-next-line @typescript-eslint/no-empty-function
      return () => {}
    }
  }, [customEventTypeName, listenToCustomEventWithinDocument])

  const broadcastValueWithinDocument = useCallback(
    (newValue: S) => {
      // eslint-disable-next-line no-negated-condition
      if (typeof document !== 'undefined') {
        const event: BroadcastCustomEvent<S> = new CustomEvent(
          customEventTypeName,
          { detail: { newValue } },
        )
        document.dispatchEvent(event)
      } else {
        console.warn('[useSessionstorageState] document is undefined.')
      }
    },
    [customEventTypeName],
  )

  const set = useCallback(
    (newValue: S) => {
      isUpdateFromCrossDocumentListener.current = false
      isUpdateFromWithinDocumentListener.current = false
      setValue(newValue)
      broadcastValueWithinDocument(newValue)
    },
    [broadcastValueWithinDocument],
  )

  const remove = useCallback(() => {
    sessionStorage.removeItem(key)
  }, [key])

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return [value, set, remove]
}
