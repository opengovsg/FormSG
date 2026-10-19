import { PropsWithChildren } from 'react'
import { QueryClient, QueryClientProvider } from 'react-query'
import type { FormField } from '@opengovsg/formsg-sdk/dist/types'
import { renderHook, waitFor } from '@testing-library/react'

import { SubmissionMetadata } from 'formsg-shared/types'

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

vi.mock('../../StorageResponsesContext', () => ({
  useStorageResponsesContext: () => ({ secretKey: 'secret', dateRange: [] }),
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
  afterEach(() => vi.clearAllMocks())

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
