import { useSearchParams } from 'react-router-dom'
import cuid from 'cuid'
import { isEmpty } from 'lodash'
import { useSessionstorageState } from 'rooks'

import { REDIRECTED_QUERY_KEY, STORED_QUERY_KEY } from './useFetchPrefillQuery'

export type StoredRedirectionQuery = {
  _id: string
  queryString: string
}

export const useStorePrefillQuery = () => {
  const [searchParams] = useSearchParams()
  const [, setStoredQuery] = useSessionstorageState(STORED_QUERY_KEY)

  const storePrefillQuery = () => {
    // Do nothing if key is already query key. Might result in infinite loop if handled.
    if (searchParams.get(REDIRECTED_QUERY_KEY)) return

    const queryParams = Object.fromEntries([...searchParams])
    if (!isEmpty(queryParams)) {
      const queryId = cuid()
      const encodedQuery = btoa(`${REDIRECTED_QUERY_KEY}=${queryId}`)
      const store: StoredRedirectionQuery = {
        _id: queryId,
        queryString: JSON.stringify(queryParams),
      }
      // Store search params otherwise.
      setStoredQuery(store)
      return encodedQuery
    }
  }

  return {
    storePrefillQuery,
  }
}
