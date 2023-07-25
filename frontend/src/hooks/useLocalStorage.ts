// Retrieved from https://usehooks-typescript.com/react-hook/use-local-storage

import { useCallback, useEffect, useState } from 'react'

import { LOCAL_STORAGE_EVENT } from '~/constants/localStorage'

export const useLocalStorage = <T>(
  key: string | null,
  initialValue?: T,
): readonly [T | undefined, (value?: T) => void] => {
  // Get from local storage then
  // parse stored json or return initialValue
  const readValue = useCallback(() => {
    // Prevent build error "window is undefined" and keep it working
    if (typeof window === 'undefined') {
      return initialValue
    }
    if (!key) {
      return
    }
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      return initialValue
    }
  }, [initialValue, key])
  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState(readValue)
  // Return a wrapped version of useState's setter function that ...
  // ... persists the new value to localStorage.
  const setValue = (value?: T) => {
    if (!key) {
      return
    }
    try {
      // Allow value to be a function so we have the same API as useState
      const newValue = value instanceof Function ? value(storedValue) : value

      if (value === undefined) {
        window.localStorage.removeItem(key)
      } else {
        // Save to local storage
        window.localStorage.setItem(key, JSON.stringify(newValue))
        // Save state
      }
      setStoredValue(newValue)
      // We dispatch a custom event so every useLocalStorage hook are notified
      window.dispatchEvent(new Event(LOCAL_STORAGE_EVENT))
      // eslint-disable-next-line no-empty
    } catch {
      // TODO (#2640) Pass in some sort of logger here.
    }
  }
  useEffect(() => {
    setStoredValue(readValue())
  }, [readValue])
  useEffect(() => {
    const handleStorageChange = () => {
      setStoredValue(readValue())
    }
    // this only works for other documents, not the current one
    window.addEventListener('storage', handleStorageChange)
    // this is a custom event, triggered in writeValueToLocalStorage
    window.addEventListener(LOCAL_STORAGE_EVENT, handleStorageChange)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener(LOCAL_STORAGE_EVENT, handleStorageChange)
    }
  }, [readValue])
  return [storedValue, setValue] as const
}
