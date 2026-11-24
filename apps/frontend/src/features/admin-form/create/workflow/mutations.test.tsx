import { PropsWithChildren } from 'react'
import { QueryClient, QueryClientProvider } from 'react-query'
import { act, renderHook } from '@testing-library/react'

import { FormResponseMode } from 'formsg-shared/types'

import { adminFormKeys } from '~features/admin-form/common/queries'

import { useAdminWorkflowStore } from './adminWorkflowStore'
import { useWorkflowMutations } from './mutations'
import { GuidedWrapUp } from './types'

const FORM_ID = 'form-id'
const usesStepLoginRules = { value: false }

vi.mock('react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router')>()),
  useParams: () => ({ formId: FORM_ID }),
}))
vi.mock('./hooks/useUsesStepLoginRules', () => ({
  useUsesStepLoginRules: () => usesStepLoginRules.value,
}))
vi.mock('./hooks/useAdminFormWorkflow', () => ({
  useAdminFormWorkflow: () => ({ formWorkflow: [], formFields: [] }),
}))
vi.mock('./FormWorkflowService', () => ({
  deleteWorkflowStep: vi.fn().mockResolvedValue([]),
  deleteWorkflow: vi.fn().mockResolvedValue([]),
}))

const renderMutations = () => {
  const queryClient = new QueryClient()
  queryClient.setQueryData(adminFormKeys.id(FORM_ID), {
    responseMode: FormResponseMode.Multirespondent,
    workflow: [{}, {}],
  })
  const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
  const wrapper = ({ children }: PropsWithChildren) => (
    // @ts-expect-error missing FC type in old version
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  const { result } = renderHook(() => useWorkflowMutations(), { wrapper })
  return { result, invalidate }
}

describe('useWorkflowMutations', () => {
  it('refetches the form after a step delete under step login rules, which may delete login fields', async () => {
    // Flag off, but the form already has a later-step login
    usesStepLoginRules.value = true
    const { result, invalidate } = renderMutations()

    await act(() =>
      result.current.deleteStepMutation.mutateAsync({ stepNumber: 1 }),
    )

    expect(invalidate).toHaveBeenCalledWith(adminFormKeys.id(FORM_ID))
  })

  it('only patches the workflow without step login rules, as before', async () => {
    usesStepLoginRules.value = false
    const { result, invalidate } = renderMutations()

    await act(() =>
      result.current.deleteStepMutation.mutateAsync({ stepNumber: 1 }),
    )

    expect(invalidate).not.toHaveBeenCalled()
  })

  it('restarts the guided wrap-up once the workflow is deleted', async () => {
    useAdminWorkflowStore.getState().setGuidedWrapUp(GuidedWrapUp.Done)
    const { result } = renderMutations()

    await act(() =>
      result.current.deleteWorkflowMutation.mutateAsync(undefined),
    )

    expect(useAdminWorkflowStore.getState().guidedWrapUp).toBe(
      GuidedWrapUp.None,
    )
  })
})
