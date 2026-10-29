import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { useAdminWorkflowStore } from '../../../adminWorkflowStore'

import { NewStepBlock } from './NewStepBlock'

const state = vi.hoisted(() => ({
  workflow: [] as { _id: string; edit: string[] }[],
  create: vi.fn(),
  update: vi.fn(),
  restrictions: vi.fn(),
}))
vi.mock('../../CloseFormToEditModal', () => ({
  CloseFormToEditModal: () => null,
}))
vi.mock('../../../hooks/useAdminFormWorkflow', () => ({
  useAdminFormWorkflow: () => ({
    formWorkflow: state.workflow,
    isPaymentEnabled: false,
    isLegacyWebhookEnabled: false,
  }),
}))
vi.mock('../../../hooks/useIsWorkflowEditBlocked', () => ({
  useIsWorkflowEditBlocked: () => false,
}))
vi.mock('../../../mutations', () => ({
  useWorkflowMutations: () => ({
    createStepMutation: { mutateAsync: state.create, isLoading: false },
    updateStepMutation: { mutateAsync: state.update, isLoading: false },
  }),
}))
vi.mock('../EditStepBlock', () => ({
  EditStepBlock: ({
    onSubmit,
    stepNumber,
  }: {
    onSubmit: (step: unknown, afterSave: () => Promise<void>) => Promise<void>
    stepNumber: number
  }) => (
    <button
      onClick={() =>
        void onSubmit({ edit: [] }, state.restrictions).catch(() => undefined)
      }
    >
      Save step {stepNumber + 1}
    </button>
  ),
}))

afterEach(() => act(() => useAdminWorkflowStore.getState().reset()))
it('updates the already-created step when restrictions failed, retaining its original step number', async () => {
  state.workflow = []
  state.create.mockReset().mockImplementation(async () => {
    state.workflow = [{ _id: 'saved', edit: [] }]
    return state.workflow
  })
  state.update.mockReset().mockResolvedValue(undefined)
  state.restrictions
    .mockReset()
    .mockRejectedValueOnce(new Error('Upload failed'))
    .mockResolvedValueOnce(undefined)
  act(() => useAdminWorkflowStore.getState().setToCreating())
  const user = userEvent.setup()
  const { rerender } = render(<NewStepBlock />)
  await user.click(screen.getByRole('button', { name: 'Save step 1' }))
  await waitFor(() => expect(state.restrictions).toHaveBeenCalledTimes(1))
  rerender(<NewStepBlock />)
  await user.click(screen.getByRole('button', { name: 'Save step 1' }))
  await waitFor(() => expect(state.update).toHaveBeenCalledTimes(1))
  expect(state.create).toHaveBeenCalledTimes(1)
  expect(state.update).toHaveBeenCalledWith({
    stepNumber: 0,
    updateStepBody: { _id: 'saved', edit: [] },
  })
})
