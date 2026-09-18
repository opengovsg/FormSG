import { act } from '@testing-library/react'

import { useAdminWorkflowStore } from './adminWorkflowStore'
import { AdminEditWorkflowState } from './types'

const store = () => useAdminWorkflowStore.getState()

describe('the step draft that survives a trip to the field builder', () => {
  afterEach(() =>
    act(() => {
      store().clearStepDraft()
      store().reset()
    }),
  )

  it('outlives the reset the workflow tab runs when it unmounts', () => {
    act(() => {
      store().setToCreating()
      store().stashStepDraft({ step_name: 'Approval', edit: [] })
      store().reset()
    })

    expect(store().createOrEditData).toBeNull()
    expect(store().stepDraft?.inputs).toEqual({
      step_name: 'Approval',
      edit: [],
    })
  })

  it('reopens the card it was stashed from', () => {
    act(() => {
      store().setToEditing(1)
      store().stashStepDraft({ step_name: 'Approval' })
      store().reset()
      store().restoreStepDraft()
    })

    expect(store().createOrEditData).toEqual({
      state: AdminEditWorkflowState.EditingStep,
      stepNumber: 1,
    })
  })

  it('has nothing to stash when no card is open', () => {
    act(() => {
      store().stashStepDraft({ step_name: 'Approval' })
    })

    expect(store().stepDraft).toBeNull()
  })

  it('is dropped once a card is opened or closed in its own right', () => {
    act(() => {
      store().setToCreating()
      store().stashStepDraft({ step_name: 'Approval' })
      store().setToInactive()
    })
    expect(store().stepDraft).toBeNull()

    act(() => {
      store().setToEditing(0)
      store().stashStepDraft({ step_name: 'Approval' })
      store().setToEditing(1)
    })
    expect(store().stepDraft).toBeNull()
  })

  it('is dropped when a save completes', () => {
    act(() => {
      store().setToCreating()
      store().stashStepDraft({ step_name: 'Approval' })
      store().completeSave()
    })

    expect(store().stepDraft).toBeNull()
  })
})
