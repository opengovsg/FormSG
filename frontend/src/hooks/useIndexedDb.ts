import { useCallback, useEffect, useState } from 'react'

const DB_NAME = 'FormSG'
const DB_VERSION = 1
const STORE_NAME = 'keyValueStore'

// Initialize IndexedDB
const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('IndexedDB not available'))
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' })
      }
    }
  })
}

// Get value from IndexedDB
const getFromIndexedDB = async (key: string): Promise<unknown> => {
  try {
    const db = await initDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.get(key)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const result = request.result
        resolve(result ? result.value : undefined)
      }
    })
  } catch (error) {
    console.error('Error reading from IndexedDB:', error)
    return undefined
  }
}

// Set value in IndexedDB
const setInIndexedDB = async (key: string, value: unknown): Promise<void> => {
  try {
    const db = await initDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.put({ key, value })

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  } catch (error) {
    console.error('Error writing to IndexedDB:', error)
    throw error
  }
}

// Remove value from IndexedDB
const removeFromIndexedDB = async (key: string): Promise<void> => {
  try {
    const db = await initDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.delete(key)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  } catch (error) {
    console.error('Error removing from IndexedDB:', error)
    throw error
  }
}

export const useIndexedDb = <T>(
  key: string | null,
  initialValue?: T,
): readonly [
  T | undefined,
  (value?: T) => Promise<void>,
  () => Promise<void>,
] => {
  const [storedValue, setStoredValue] = useState<T | undefined>(initialValue)

  // Read value from IndexedDB
  const readValue = useCallback(async () => {
    if (typeof window === 'undefined' || !key) {
      return initialValue
    }

    try {
      const value = await getFromIndexedDB(key)
      return value !== undefined ? value : initialValue
    } catch (error) {
      console.error('Error reading from IndexedDB:', error)
      return initialValue
    }
  }, [initialValue, key])

  // Set value in IndexedDB
  const setValue = useCallback(
    async (value?: T) => {
      if (typeof window === 'undefined' || !key) {
        return
      }

      try {
        if (value === undefined) {
          await removeFromIndexedDB(key)
          setStoredValue(undefined)
        } else {
          await setInIndexedDB(key, value)
          setStoredValue(value)
        }
      } catch (error) {
        console.error('Error setting value in IndexedDB:', error)
      }
    },
    [key],
  )

  // Remove value from IndexedDB
  const removeValue = useCallback(async () => {
    if (typeof window === 'undefined' || !key) {
      return
    }

    try {
      await removeFromIndexedDB(key)
      setStoredValue(undefined)
    } catch (error) {
      console.error('Error removing value from IndexedDB:', error)
    }
  }, [key])

  // Initialize value on mount
  useEffect(() => {
    const loadValue = async () => {
      const value = await readValue()
      setStoredValue(value as T | undefined)
    }
    loadValue()
  }, [readValue])

  return [storedValue, setValue, removeValue] as const
}
