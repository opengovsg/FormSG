import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useSessionstorageState } from 'rooks'

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

export const useFetchPrefillQuery = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [storedQuery, setStoredQuery, removeStoredQuery] =
    useSessionstorageState(STORED_QUERY_KEY, {})

  useEffect(() => {
    const previouslyStoredId = searchParams.get(REDIRECTED_QUERY_KEY)
    if (
      previouslyStoredId &&
      isValidStoredQuery(previouslyStoredId, storedQuery)
    ) {
      setSearchParams(JSON.parse(storedQuery.queryString))
      removeStoredQuery()
    }
  }, [
    storedQuery,
    setStoredQuery,
    searchParams,
    setSearchParams,
    removeStoredQuery,
  ])
}
