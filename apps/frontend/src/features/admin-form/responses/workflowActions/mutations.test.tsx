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

const mockToast = vi.fn()
const mockSendBackWorkflow = vi.fn()

vi.mock('~hooks/useToast', () => ({
  useToast: () => mockToast,
}))

vi.mock('../AdminSubmissionsService', () => ({
  addAssignees: () =>
    Promise.resolve({ stepNumber: 2, emails: ['new@agency.gov.sg'] }),
  stopWorkflow: vi.fn(),
  sendBackWorkflow: (params: unknown) => mockSendBackWorkflow(params),
}))

const renderWithQueryClient = <T,>(hook: () => T) => {
  const queryClient = new QueryClient()
  vi.spyOn(queryClient, 'invalidateQueries').mockResolvedValue()
  const wrapper = ({ children }: PropsWithChildren) => (
    // @ts-expect-error missing FC type in old version
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return { queryClient, ...renderHook(hook, { wrapper }) }
}

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

describe('useSendBackWorkflowMutation', () => {
  const params = {
    submissionId: 'submission-id',
    targetStepNumber: 2,
    expectedStepNumber: 3,
    submissionSecretKey: 'key',
    remarks: 'Fix the dates',
  }

  afterEach(() => {
    mockToast.mockReset()
    mockSendBackWorkflow.mockReset()
  })

  it('sends back and refreshes the response', async () => {
    mockSendBackWorkflow.mockResolvedValue({
      stepNumber: 2,
      emails: ['lead@agency.gov.sg'],
    })
    const { result, queryClient } = renderWithQueryClient(() =>
      useSendBackWorkflowMutation('form-id'),
    )

    result.current.mutate(params)

    await waitFor(() =>
      expect(queryClient.invalidateQueries).toHaveBeenCalled(),
    )
    expect(mockSendBackWorkflow).toHaveBeenCalledWith({
      formId: 'form-id',
      ...params,
    })
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'success' }),
    )
  })

  it("shows the server's message when the send back fails", async () => {
    mockSendBackWorkflow.mockRejectedValue(
      new Error(
        'This workflow is no longer pending. Refresh to see its latest status.',
      ),
    )
    const { result } = renderWithQueryClient(() =>
      useSendBackWorkflowMutation('form-id'),
    )

    result.current.mutate(params)

    await waitFor(() =>
      expect(mockToast).toHaveBeenCalledWith({
        status: 'danger',
        description:
          'This workflow is no longer pending. Refresh to see its latest status.',
      }),
    )
  })
})
