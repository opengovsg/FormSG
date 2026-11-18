import { PropsWithChildren } from 'react'
import { QueryClient, QueryClientProvider, useQuery } from 'react-query'
import type { FormField } from '@opengovsg/formsg-sdk/dist/types'
import { act, renderHook, waitFor } from '@testing-library/react'

import { DateString, SubmissionMetadata } from 'formsg-shared/types'

import { getDecryptedSubmissionById } from '~features/admin-form/responses/AdminSubmissionsService'
import { adminFormResponsesKeys } from '~features/admin-form/responses/queries'

import {
  getUndecryptedSubmissionIds,
  MAX_NEW_RESPONSES_TO_DECRYPT_ONE_BY_ONE,
  useDecryptNewResponses,
} from './useDecryptNewResponses'

vi.mock('react-router-dom', () => ({
  useParams: () => ({ formId: 'form-id' }),
}))

let mockDateRange: DateString[] = []

vi.mock('../../StorageResponsesContext', () => ({
  useStorageResponsesContext: () => ({
    secretKey: 'secret',
    dateRange: mockDateRange,
  }),
}))

vi.mock('~features/admin-form/responses/AdminSubmissionsService', () => ({
  getDecryptedSubmissionById: vi.fn(),
}))

const mockDecrypt = vi.mocked(getDecryptedSubmissionById)
const QUERY_KEY = adminFormResponsesKeys.decryptedResponses('form-id', [])

const answers = (answer: string) =>
  [
    { _id: 'name', question: 'Name', fieldType: 'textfield', answer },
  ] as FormField[]
const row = (refNo: string) => ({ refNo }) as SubmissionMetadata

const setup = (decrypted: Map<string, FormField[]>) => {
  const queryClient = new QueryClient()
  queryClient.setQueryData(QUERY_KEY, decrypted)
  const wrapper = ({ children }: PropsWithChildren) => (
    // @ts-expect-error missing FC type in old version
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return { queryClient, wrapper }
}

describe('getUndecryptedSubmissionIds', () => {
  it('lists the rows the decrypted answers do not have', () => {
    expect(
      getUndecryptedSubmissionIds(
        [row('old'), row('new')],
        new Map([['old', []]]),
        new Set(),
      ),
    ).toEqual(['new'])
  })

  it('skips rows already tried', () => {
    expect(
      getUndecryptedSubmissionIds([row('new')], new Map(), new Set(['new'])),
    ).toEqual([])
  })

  it('waits until there are decrypted answers to compare against', () => {
    expect(
      getUndecryptedSubmissionIds([row('new')], undefined, new Set()),
    ).toEqual([])
  })
})

describe('useDecryptNewResponses', () => {
  afterEach(() => {
    vi.clearAllMocks()
    mockDateRange = []
  })

  it('reports a failed new-response decryption rather than loading forever', async () => {
    mockDecrypt.mockRejectedValue(new Error('cannot decrypt'))
    const { wrapper } = setup(new Map())
    const { result } = renderHook(
      () =>
        useDecryptNewResponses({
          metadata: [row('bad')],
          isDecryptingAll: false,
          enabled: true,
        }),
      { wrapper },
    )
    await waitFor(() => expect(result.current).toEqual({ isError: true }))
  })

  it('clears the failed state when a later bulk decrypt restores the missing answer', async () => {
    mockDecrypt.mockRejectedValue(new Error('cannot decrypt'))
    const { queryClient, wrapper } = setup(new Map())
    const { result, rerender } = renderHook(
      () =>
        useDecryptNewResponses({
          metadata: [row('bad')],
          isDecryptingAll: false,
          enabled: true,
        }),
      { wrapper },
    )
    await waitFor(() => expect(result.current.isError).toBe(true))
    queryClient.setQueryData(
      QUERY_KEY,
      new Map([['bad', answers('Recovered')]]),
    )
    rerender()
    expect(result.current.isError).toBe(false)
  })

  it('retains the current date failure when an older date request fails later', async () => {
    let rejectOld!: (reason: Error) => void
    let rejectCurrent!: (reason: Error) => void
    mockDecrypt
      .mockImplementationOnce(
        () =>
          new Promise((_, reject) => {
            rejectOld = reject
          }),
      )
      .mockImplementationOnce(
        () =>
          new Promise((_, reject) => {
            rejectCurrent = reject
          }),
      )
    const { queryClient, wrapper } = setup(new Map())
    const { result, rerender } = renderHook(
      () =>
        useDecryptNewResponses({
          metadata: [row('bad')],
          isDecryptingAll: false,
          enabled: true,
        }),
      { wrapper },
    )
    mockDateRange = ['2026-10-01', '2026-10-07'] as DateString[]
    queryClient.setQueryData(
      adminFormResponsesKeys.decryptedResponses('form-id', mockDateRange),
      new Map(),
    )
    rerender()
    await act(async () => rejectCurrent(new Error('current scope failed')))
    expect(result.current.isError).toBe(true)
    await act(async () => rejectOld(new Error('old scope failed')))
    expect(result.current.isError).toBe(true)
  })

  it('refills successful answers later replaced by a bulk result without duplicating pending requests', async () => {
    let resolveFirst!: (
      value: Awaited<ReturnType<typeof getDecryptedSubmissionById>>,
    ) => void
    mockDecrypt
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveFirst = resolve
          }),
      )
      .mockResolvedValue({ responses: answers('Refilled') } as Awaited<
        ReturnType<typeof getDecryptedSubmissionById>
      >)
    const { queryClient, wrapper } = setup(new Map())
    const { rerender } = renderHook(
      () =>
        useDecryptNewResponses({
          metadata: [row('new')],
          isDecryptingAll: false,
          enabled: true,
        }),
      { wrapper },
    )
    rerender()
    expect(mockDecrypt).toHaveBeenCalledTimes(1)
    await act(async () =>
      resolveFirst({ responses: answers('First') } as Awaited<
        ReturnType<typeof getDecryptedSubmissionById>
      >),
    )
    queryClient.setQueryData(QUERY_KEY, new Map())
    rerender()
    await waitFor(() =>
      expect(
        queryClient
          .getQueryData<Map<string, FormField[]>>(QUERY_KEY)
          ?.get('new'),
      ).toEqual(answers('Refilled')),
    )
    expect(mockDecrypt).toHaveBeenCalledTimes(2)
  })

  it("adds a new response's answers to the table", async () => {
    mockDecrypt.mockResolvedValue({
      responses: answers('Tan'),
    } as Awaited<ReturnType<typeof getDecryptedSubmissionById>>)
    const { queryClient, wrapper } = setup(new Map([['old', answers('Lim')]]))

    renderHook(
      () =>
        useDecryptNewResponses({
          metadata: [row('new'), row('old')],
          isDecryptingAll: false,
          enabled: true,
        }),
      { wrapper },
    )

    await waitFor(() =>
      expect(
        queryClient
          .getQueryData<Map<string, FormField[]>>(QUERY_KEY)
          ?.get('new'),
      ).toEqual(answers('Tan')),
    )
    expect(mockDecrypt).toHaveBeenCalledTimes(1)
    expect(mockDecrypt).toHaveBeenCalledWith({
      formId: 'form-id',
      submissionId: 'new',
      secretKey: 'secret',
    })
  })

  it('waits while the table is still decrypting in bulk', () => {
    const { wrapper } = setup(new Map())

    renderHook(
      () =>
        useDecryptNewResponses({
          metadata: [row('new')],
          isDecryptingAll: true,
          enabled: true,
        }),
      { wrapper },
    )

    expect(mockDecrypt).not.toHaveBeenCalled()
  })

  it('decrypts the table again when many responses arrived', () => {
    const { queryClient, wrapper } = setup(new Map())
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
    const metadata = Array.from(
      { length: MAX_NEW_RESPONSES_TO_DECRYPT_ONE_BY_ONE + 1 },
      (_, i) => row(`new-${i}`),
    )

    renderHook(
      () =>
        useDecryptNewResponses({
          metadata,
          isDecryptingAll: false,
          enabled: true,
        }),
      { wrapper },
    )

    expect(invalidate).toHaveBeenCalledWith(QUERY_KEY)
    expect(mockDecrypt).not.toHaveBeenCalled()
  })

  it('does not retry a response that failed to decrypt', async () => {
    mockDecrypt.mockRejectedValue(new Error('cannot decrypt'))
    const { wrapper } = setup(new Map())
    const { rerender } = renderHook(
      ({ metadata }) =>
        useDecryptNewResponses({
          metadata,
          isDecryptingAll: false,
          enabled: true,
        }),
      { wrapper, initialProps: { metadata: [row('bad')] } },
    )

    await waitFor(() => expect(mockDecrypt).toHaveBeenCalledTimes(1))
    rerender({ metadata: [row('bad')] })

    expect(mockDecrypt).toHaveBeenCalledTimes(1)
  })
})

describe('new-response writes during bulk query lifecycle', () => {
  afterEach(() => {
    vi.clearAllMocks()
    mockDateRange = []
  })

  it.each(['success', 'error'])(
    'keeps an overlapping bulk fetch pending when an individual answer finishes, then settles %s',
    async (outcome) => {
      let finishIndividual!: (
        value: Awaited<ReturnType<typeof getDecryptedSubmissionById>>,
      ) => void
      let finishBulk!: () => void
      mockDecrypt.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finishIndividual = resolve
          }),
      )
      const bulkFetch = () =>
        new Promise<Map<string, FormField[]>>((resolve, reject) => {
          finishBulk = () =>
            outcome === 'success'
              ? resolve(new Map([['new', answers('Bulk')]]))
              : reject(new Error('bulk failure'))
        })
      const { wrapper } = setup(new Map())
      const metadata = [row('new')]
      const { result } = renderHook(
        () => {
          const bulk = useQuery(QUERY_KEY, bulkFetch, {
            enabled: false,
            retry: false,
          })
          useDecryptNewResponses({
            metadata,
            isDecryptingAll: bulk.isFetching,
            enabled: true,
          })
          return bulk
        },
        { wrapper },
      )
      act(() => {
        void result.current.refetch()
      })
      await waitFor(() => expect(result.current.isFetching).toBe(true))
      await act(async () =>
        finishIndividual({ responses: answers('Individual') } as Awaited<
          ReturnType<typeof getDecryptedSubmissionById>
        >),
      )
      await waitFor(() =>
        expect(result.current.data?.get('new')).toEqual(answers('Individual')),
      )
      expect(result.current.isFetching).toBe(true)
      const expectedError =
        outcome === 'error'
          ? vi.spyOn(console, 'error').mockImplementation(() => undefined)
          : undefined
      await act(async () => finishBulk())
      await waitFor(() => expect(result.current.isFetching).toBe(false))
      expect(result.current.isError).toBe(outcome === 'error')
      expect(result.current.data?.has('new')).toBe(true)
      expectedError?.mockRestore()
    },
  )

  it('settles a failed automatic bulk refresh once and lets an explicit refresh recover', async () => {
    const metadata = [
      row('existing'),
      ...Array.from(
        { length: MAX_NEW_RESPONSES_TO_DECRYPT_ONE_BY_ONE + 1 },
        (_, i) => row(`new-${i}`),
      ),
    ]
    const complete = new Map(
      metadata.map(({ refNo }) => [refNo, answers('Recovered')]),
    )
    const bulkFetch = vi
      .fn()
      .mockRejectedValueOnce(new Error('bulk failure'))
      .mockImplementation(() => new Promise(() => undefined))
    const { wrapper } = setup(new Map([['existing', answers('Old')]]))
    const expectedError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)
    const { result, rerender } = renderHook(
      () => {
        const bulk = useQuery<Map<string, FormField[]>>(QUERY_KEY, bulkFetch, {
          staleTime: Infinity,
          retry: false,
        })
        useDecryptNewResponses({
          metadata: [...metadata],
          isDecryptingAll: bulk.isFetching,
          enabled: true,
        })
        return bulk
      },
      { wrapper },
    )
    await waitFor(() =>
      expect(result.current).toMatchObject({
        isError: true,
        isFetching: false,
      }),
    )
    rerender()
    expect(result.current.isFetching).toBe(false)
    expect(result.current.data?.get('existing')).toEqual(answers('Old'))
    expect(bulkFetch).toHaveBeenCalledTimes(1)
    bulkFetch.mockResolvedValue(complete)
    await act(async () => {
      await result.current.refetch()
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.isFetching).toBe(false)
    expect(result.current.data?.size).toBe(22)
    expect(bulkFetch).toHaveBeenCalledTimes(2)
    expectedError.mockRestore()
  })
})
