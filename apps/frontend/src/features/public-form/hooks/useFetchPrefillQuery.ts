import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

import { useSessionStorage } from '~hooks/useSessionStorage'

import { StoredRedirectionQuery } from './useStorePrefillQuery'

export const STORED_QUERY_KEY = 'storedQuery'
export const REDIRECTED_QUERY_KEY = 'queryId'

const isValidStoredQuery = (
  queryId: string,
  storedQuery: unknown,
): storedQuery is StoredRedirectionQuery => {
  // Check if the stored query is a valid object and has expected keys
  if (
    typeof storedQuery !== 'object' ||
    storedQuery === null ||
    !('_id' in storedQuery && 'queryString' in storedQuery)
  ) {
    return false
  }

  return queryId === (storedQuery as StoredRedirectionQuery)._id
}

/** @returns whether a stored query is about to be restored into the URL */
export const useFetchPrefillQuery = (): boolean => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [storedQuery, , removeStoredQuery] = useSessionStorage<
    StoredRedirectionQuery | undefined
  >(STORED_QUERY_KEY)

  const previouslyStoredId = searchParams.get(REDIRECTED_QUERY_KEY)
  const isRestoring =
    !!previouslyStoredId && isValidStoredQuery(previouslyStoredId, storedQuery)

  useEffect(() => {
    if (isRestoring && storedQuery) {
      setSearchParams(JSON.parse(storedQuery.queryString))
      removeStoredQuery()
    }
  }, [isRestoring, removeStoredQuery, setSearchParams, storedQuery])

  return isRestoring
}
