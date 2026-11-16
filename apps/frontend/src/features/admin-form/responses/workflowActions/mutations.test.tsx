import { PropsWithChildren } from 'react'
import { QueryClient, QueryClientProvider } from 'react-query'
import { renderHook, waitFor } from '@testing-library/react'

import {
  useAddAssigneesMutation,
  useSendBackWorkflowMutation,
} from './mutations'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

const { mockToast, mockSendBack } = vi.hoisted(() => ({
  mockToast: vi.fn(),
  mockSendBack: vi.fn(),
}))
vi.mock('~hooks/useToast', () => ({ useToast: () => mockToast }))

vi.mock('../AdminSubmissionsService', () => ({
  addAssignees: () =>
    Promise.resolve({ stepNumber: 2, emails: ['new@agency.gov.sg'] }),
  stopWorkflow: vi.fn(),
  sendBackWorkflow: mockSendBack,
}))

describe('useAddAssigneesMutation', () => {
  it('closes the modal without waiting for the responses to refetch', async () => {
    const queryClient = new QueryClient()
    vi.spyOn(queryClient, 'invalidateQueries').mockReturnValue(
      new Promise(() => undefined),
    )
    const wrapper = ({ children }: PropsWithChildren) => (
      // @ts-expect-error missing FC type in old version
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
    const { result } = renderHook(() => useAddAssigneesMutation('form-id'), {
      wrapper,
    })
    const onSuccess = vi.fn()

    result.current.mutate(
      {
        submissionId: 'submission-id',
        emails: ['new@agency.gov.sg'],
        submissionSecretKey: 'key',
        expectedStepNumber: 2,
      },
      { onSuccess },
    )

    await waitFor(() => expect(onSuccess).toHaveBeenCalled())
    expect(queryClient.invalidateQueries).toHaveBeenCalled()
  })
})

describe('send back errors', () => {
  it.each([
    [
      409,
      'This workflow is no longer pending. Refresh to see its latest status.',
    ],
    [403, 'You do not have permission.'],
    [0, 'Network unavailable'],
  ])(
    'refreshes after error %s without retrying or replacing its explanation',
    async (status, message) => {
      mockSendBack.mockReset().mockRejectedValue({ status, message })
      mockToast.mockClear()
      const queryClient = new QueryClient({
        defaultOptions: { mutations: { retry: false } },
      })
      const invalidate = vi
        .spyOn(queryClient, 'invalidateQueries')
        .mockResolvedValue()
      const wrapper = ({ children }: PropsWithChildren) => (
        // @ts-expect-error missing FC type in old version
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      )
      const { result } = renderHook(
        () => useSendBackWorkflowMutation('form-id'),
        { wrapper },
      )
      result.current.mutate({
        submissionId: 'submission-id',
        targetStepNumber: 1,
        expectedStepNumber: 2,
        submissionSecretKey: 'key',
        clearResponses: false,
      })
      await waitFor(() => expect(result.current.isError).toBe(true))
      expect(mockSendBack).toHaveBeenCalledTimes(1)
      expect(mockToast).toHaveBeenCalledWith({
        status: 'danger',
        description: message,
      })
      expect(invalidate).toHaveBeenCalled()
    },
  )
})
