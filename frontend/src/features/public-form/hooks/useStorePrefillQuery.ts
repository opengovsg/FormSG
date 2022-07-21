import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useSessionstorage } from 'rooks'

const STORED_QUERY_KEY = 'storedQuery'
const REDIRECTED_QUERY_KEY = 'queryId'

type StoredRedirectionQuery = {
  _id: string
  queryString: string
}

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

export const useStorePrefillQuery = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [storedQuery, setStoredQuery, removeStoredQuery] = useSessionstorage(
    STORED_QUERY_KEY,
    {},
  )

  useEffect(() => {
    const previouslyStoredId = searchParams.get(REDIRECTED_QUERY_KEY)
    if (
      previouslyStoredId &&
      isValidStoredQuery(previouslyStoredId, storedQuery)
    ) {
      setSearchParams(storedQuery.queryString)
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
