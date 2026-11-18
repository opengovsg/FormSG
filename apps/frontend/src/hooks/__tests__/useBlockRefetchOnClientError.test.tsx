import { PropsWithChildren } from 'react'
import { hashQueryKey, QueryClient, QueryClientProvider } from 'react-query'
import { renderHook } from '@testing-library/react'

import { HttpError } from '~services/ApiService'

import { useBlockRefetchOnClientError } from '../useBlockRefetchOnClientError'

const QUERY_KEY = ['test-key']

const setup = (error?: unknown) => {
  const queryClient = new QueryClient()
  if (error !== undefined) {
    const query = queryClient.getQueryCache().build(queryClient, {
      queryKey: QUERY_KEY,
      queryHash: hashQueryKey(QUERY_KEY),
    })
    query.setState({ ...query.state, error, status: 'error' })
  }
  const wrapper = ({ children }: PropsWithChildren) => (
    // @ts-expect-error missing FC type in old version
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return renderHook(() => useBlockRefetchOnClientError(QUERY_KEY), { wrapper })
}

describe('useBlockRefetchOnClientError', () => {
  it('returns no overrides when the query has no error', () => {
    const { result } = setup()
    expect(result.current).toEqual({})
  })

  it('blocks automatic refetching after a 4xx HttpError', () => {
    const { result } = setup(new HttpError('Forbidden', 403))
    expect(result.current).toEqual({
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retryOnMount: false,
    })
  })

  it('returns no overrides for a 5xx HttpError', () => {
    const { result } = setup(new HttpError('Server error', 500))
    expect(result.current).toEqual({})
  })

  it('returns no overrides for a non-HTTP error', () => {
    const { result } = setup(new Error('boom'))
    expect(result.current).toEqual({})
  })
})
