import { PropsWithChildren } from 'react'
import { QueryClient, QueryClientProvider } from 'react-query'
import { renderHook, waitFor } from '@testing-library/react'

import { useAddAssigneesMutation } from './mutations'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock('~hooks/useToast', () => ({
  useToast: () => vi.fn(),
}))

vi.mock('../AdminSubmissionsService', () => ({
  addAssignees: () =>
    Promise.resolve({ stepNumber: 2, emails: ['new@agency.gov.sg'] }),
  stopWorkflow: vi.fn(),
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
      },
      { onSuccess },
    )

    await waitFor(() => expect(onSuccess).toHaveBeenCalled())
    expect(queryClient.invalidateQueries).toHaveBeenCalled()
  })
})
