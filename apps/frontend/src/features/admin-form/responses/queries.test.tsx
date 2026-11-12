import { PropsWithChildren } from 'react'
import { QueryClient, QueryClientProvider } from 'react-query'
import type { FormField } from '@opengovsg/formsg-sdk/dist/types'
import { act, renderHook, waitFor } from '@testing-library/react'

import { getAllDecryptedSubmission } from './AdminSubmissionsService'
import { useDecryptedResponsesBySubmissionId } from './queries'

vi.mock('react-router', () => ({
  useParams: () => ({ formId: 'form-id' }),
}))
vi.mock('./ResponsesPage/storage/StorageResponsesContext', () => ({
  useStorageResponsesContext: () => ({ secretKey: 'secret', dateRange: [] }),
}))
vi.mock('./AdminSubmissionsService', () => ({
  getAllDecryptedSubmission: vi.fn(),
}))

it.each(['success', 'error'])(
  'keeps bulk decryption pending while publishing partial answers, then ends with %s',
  async (outcome) => {
    let publish!: NonNullable<
      Parameters<typeof getAllDecryptedSubmission>[0]['onSubmissionDecrypted']
    >
    let finish!: () => void
    vi.mocked(getAllDecryptedSubmission).mockImplementation(
      ({ onSubmissionDecrypted }) => {
        publish = onSubmissionDecrypted!
        return new Promise((resolve, reject) => {
          finish = () =>
            outcome === 'success'
              ? resolve([])
              : reject(new Error('Bulk decrypt failed'))
        })
      },
    )
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const wrapper = ({ children }: PropsWithChildren) => (
      // @ts-expect-error missing FC type in old version
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    )
    const { result } = renderHook(() => useDecryptedResponsesBySubmissionId(), {
      wrapper,
    })
    await waitFor(() => expect(typeof publish).toBe('function'))
    // Ensure the first partial publication crosses the existing throttle.
    const now = vi.spyOn(performance, 'now').mockReturnValue(1000)
    act(() => publish({ submissionId: 'first', responses: [] as FormField[] }))
    now.mockRestore()
    await waitFor(() => expect(result.current.data?.has('first')).toBe(true))
    expect(result.current.isFetching).toBe(true)
    const expectedError =
      outcome === 'error'
        ? vi.spyOn(console, 'error').mockImplementation(() => undefined)
        : undefined
    await act(async () => finish())
    await waitFor(() => expect(result.current.isFetching).toBe(false))
    expect(result.current.isSuccess).toBe(outcome === 'success')
    expect(result.current.isError).toBe(outcome === 'error')
    expect(result.current.data?.has('first')).toBe(true)
    expectedError?.mockRestore()
    client.clear()
  },
)
