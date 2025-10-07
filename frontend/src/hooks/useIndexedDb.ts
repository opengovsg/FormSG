import { useCallback, useEffect, useState } from 'react'

// For testing, use a different database name to avoid conflicts with the main database.
const isTest = import.meta.env.STORYBOOK_NODE_ENV === 'test'
export const DB_NAME = isTest ? 'TestFormSG' : 'FormSG'
const DB_VERSION = 1 // Update this version when you make changes to the database schema

const initDB = ({ storeName }: { storeName: string }): Promise<IDBDatabase> => {
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
      // If DB does not exist or version upgrades and the store name is not found, create new empty store.
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName, { keyPath: 'key' })
      }
    }
  })
}

const getFromIndexedDB = async ({
  key,
  storeName,
}: {
  key: string
  storeName: string
}): Promise<unknown> => {
  try {
    const db = await initDB({ storeName })
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
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

export const _getFromIndexedDBForTest = getFromIndexedDB

const setInIndexedDB = async ({
  key,
  value,
  storeName,
}: {
  key: string
  value: unknown
  storeName: string
}): Promise<void> => {
  try {
    const db = await initDB({ storeName })
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.put({ key, value })

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  } catch (error) {
    console.error('Error writing to IndexedDB:', error)
    throw error
  }
}

const removeFromIndexedDB = async ({
  key,
  storeName,
}: {
  key: string
  storeName: string
}): Promise<void> => {
  try {
    const db = await initDB({ storeName })
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.delete(key)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  } catch (error) {
    console.error('Error removing from IndexedDB:', error)
    throw error
  }
}

export const _removeFromIndexedDBForTest = removeFromIndexedDB

export const useIndexedDb = <T>({
  key,
  initialValue,
  storeName,
}: {
  key: string | null
  /**
   * @note Warning: If the initial value is a object reference, it will cause re-renders.
   */
  initialValue?: T
  storeName: string
}): readonly [
  T | undefined,
  (value?: T) => Promise<void>,
  () => Promise<void>,
] => {
  const [storedValue, setStoredValue] = useState<T | undefined>(initialValue)

  const readValue = useCallback(async () => {
    if (typeof window === 'undefined' || !key) {
      return initialValue
    }

    try {
      const value = await getFromIndexedDB({ key, storeName })
      return value !== undefined ? value : initialValue
    } catch (error) {
      console.error('Error reading from IndexedDB:', error)
      return initialValue
    }
  }, [initialValue, key, storeName])

  const setValue = useCallback(
    async (value?: T) => {
      if (typeof window === 'undefined' || !key) {
        return
      }

      try {
        if (value === undefined) {
          await removeFromIndexedDB({ key, storeName })
          setStoredValue(undefined)
        } else {
          await setInIndexedDB({ key, value, storeName })
          setStoredValue(value)
        }
      } catch (error) {
        console.error('Error setting value in IndexedDB:', error)
      }
    },
    [key, storeName],
  )

  const removeValue = useCallback(async () => {
    if (typeof window === 'undefined' || !key) {
      return
    }

    try {
      await removeFromIndexedDB({ key, storeName })
      setStoredValue(undefined)
    } catch (error) {
      console.error('Error removing value from IndexedDB:', error)
    }
  }, [key, storeName])

  useEffect(() => {
    const loadValue = async () => {
      const value = await readValue()
      setStoredValue(value as T | undefined)
    }
    loadValue()
  }, [readValue])

  return [storedValue, setValue, removeValue] as const
}
