import { QueryKey, useQueryClient } from 'react-query'

import { HttpError } from '~services/ApiService'

type BlockRefetchQueryOptions = {
  refetchOnWindowFocus?: false
  refetchOnReconnect?: false
  retryOnMount?: false
}

/**
 * Returns query options that stop all automatic refetching (window focus,
 * reconnect, remount) once the query at `queryKey` has failed with a 4xx
 * HttpError, since such responses will not change without user action.
 * Manual refetches and query invalidation still refetch as usual.
 *
 * Spread the result into the query's options.
 */
export const useBlockRefetchOnClientError = (
  queryKey: QueryKey,
): BlockRefetchQueryOptions => {
  const queryClient = useQueryClient()
  const error: unknown = queryClient.getQueryState(queryKey)?.error

  if (error instanceof HttpError && error.code >= 400 && error.code < 500) {
    return {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retryOnMount: false,
    }
  }
  return {}
}
