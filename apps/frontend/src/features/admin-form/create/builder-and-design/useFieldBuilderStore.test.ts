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
    // The reason this slot exists. Opening the builder from another tab mounts
    // BuilderAndDesignContent, which calls setToInactive as it mounts. A field
    // written to stateData before the trip would be gone on arrival.
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
