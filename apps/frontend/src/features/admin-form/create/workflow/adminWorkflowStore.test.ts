import { useAdminWorkflowStore } from './adminWorkflowStore'

describe('reset', () => {
  afterEach(() => {
    useAdminWorkflowStore.getState().reset()
    useAdminWorkflowStore.getState().setGuidedSetup(true)
  })

  // reset() runs every time the workflow tab unmounts. It used to put guided
  // mode back on however the admin had left the switch.
  it('leaves the guided mode choice alone', () => {
    const { setGuidedSetup, reset } = useAdminWorkflowStore.getState()

    setGuidedSetup(false)
    reset()

    expect(useAdminWorkflowStore.getState().isGuidedSetup).toBe(false)
  })

  it('still clears the per-visit step state', () => {
    const { setToEditing, setCompletedStep, reset } =
      useAdminWorkflowStore.getState()

    setToEditing(1)
    setCompletedStep(1)
    reset()

    const state = useAdminWorkflowStore.getState()
    expect(state.createOrEditData).toBeNull()
    expect(state.completedStepNumber).toBeNull()
  })
})
