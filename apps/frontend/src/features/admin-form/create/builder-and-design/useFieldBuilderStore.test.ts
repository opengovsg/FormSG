import { BasicField } from 'formsg-shared/types'

import { getFieldCreationMeta } from './utils/fieldCreation'
import { FieldBuilderState, useFieldBuilderStore } from './useFieldBuilderStore'

const emailField = getFieldCreationMeta(BasicField.Email)

const reset = () =>
  useFieldBuilderStore.setState({
    stateData: { state: FieldBuilderState.Inactive },
    holdingStateData: null,
    pendingFieldCreation: null,
  })

beforeEach(reset)

describe('pendingFieldCreation', () => {
  it('survives setToInactive', () => {
    const { stageFieldCreation, setToInactive } =
      useFieldBuilderStore.getState()

    stageFieldCreation(emailField, 3)
    setToInactive()

    expect(useFieldBuilderStore.getState().pendingFieldCreation).toEqual({
      field: emailField,
      insertionIndex: 3,
    })
  })

  it('opens the builder on the staged field once consumed', () => {
    const { stageFieldCreation, consumePendingFieldCreation } =
      useFieldBuilderStore.getState()

    stageFieldCreation(emailField, 3)
    consumePendingFieldCreation()

    expect(useFieldBuilderStore.getState().stateData).toEqual({
      state: FieldBuilderState.CreatingField,
      field: emailField,
      insertionIndex: 3,
    })
  })

  it('can be cleared without touching stateData, for trips that stage nothing', () => {
    const { stageFieldCreation, clearPendingFieldCreation } =
      useFieldBuilderStore.getState()

    stageFieldCreation(emailField, 3)
    clearPendingFieldCreation()

    expect(useFieldBuilderStore.getState().pendingFieldCreation).toBeNull()
    expect(useFieldBuilderStore.getState().stateData).toEqual({
      state: FieldBuilderState.Inactive,
    })
  })

  it('clears itself on consumption, so a later mount does not reopen it', () => {
    const { stageFieldCreation, consumePendingFieldCreation, setToInactive } =
      useFieldBuilderStore.getState()

    stageFieldCreation(emailField, 3)
    consumePendingFieldCreation()
    setToInactive()
    consumePendingFieldCreation()

    expect(useFieldBuilderStore.getState().stateData).toEqual({
      state: FieldBuilderState.Inactive,
    })
  })

  it('leaves state alone when nothing was staged', () => {
    const { consumePendingFieldCreation } = useFieldBuilderStore.getState()

    consumePendingFieldCreation()

    expect(useFieldBuilderStore.getState().stateData).toEqual({
      state: FieldBuilderState.Inactive,
    })
  })
})
