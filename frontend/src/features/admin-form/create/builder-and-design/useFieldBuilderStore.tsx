import { isEqual } from 'lodash'
import create from 'zustand'
import { devtools } from 'zustand/middleware'

import { FieldCreateDto, FormFieldDto } from '~shared/types/field'

export enum FieldBuilderState {
  CreatingField,
  EditingField,
  Inactive,
}

type FieldBuilderCreateEditStateData =
  | {
      state: FieldBuilderState.CreatingField
      field: FieldCreateDto
      insertionIndex: number
    }
  | {
      state: FieldBuilderState.EditingField
      field: FormFieldDto
    }

export type FieldBuilderStore = {
  updateCreateState: (
    field: FieldCreateDto,
    insertionIndex: number,
    holding?: boolean,
  ) => void
  updateEditState: (field: FormFieldDto, holding?: boolean) => void
  setToInactive: (holding?: boolean) => void
  stateData:
    | FieldBuilderCreateEditStateData
    | { state: FieldBuilderState.Inactive }
  // Used when there is a dirty state and we want to hold the next state to be set.
  // Will be used to set stateData if user confirms discarding changes.
  holdingStateData:
    | FieldBuilderCreateEditStateData
    | { state: FieldBuilderState.Inactive }
    | null
  clearHoldingStateData: () => void
  moveFromHolding: () => void
}

export const useFieldBuilderStore = create<FieldBuilderStore>()(
  devtools((set, get) => ({
    stateData: { state: FieldBuilderState.Inactive },
    holdingStateData: null,
    clearHoldingStateData: () => set({ holdingStateData: null }),
    moveFromHolding: () => {
      const holdingStateData = get().holdingStateData
      if (!holdingStateData) return
      set({
        stateData: holdingStateData,
        holdingStateData: null,
      })
    },
    updateCreateState: (field, insertionIndex, holding) => {
      // perf: prevent store update if field is the same
      const current = get()
      const shouldIgnore =
        current.stateData.state === FieldBuilderState.CreatingField &&
        current.stateData.insertionIndex === insertionIndex &&
        isEqual(current.stateData.field, field)
      if (shouldIgnore && !holding) {
        return
      }
      const stateData: FieldBuilderCreateEditStateData = {
        state: FieldBuilderState.CreatingField,
        field,
        insertionIndex,
      }
      if (holding) {
        set({ holdingStateData: stateData })
      } else {
        set({ stateData })
      }
    },
    updateEditState: (field, holding) => {
      // perf: prevent store update if field is the same
      const current = get()
      const shouldIgnore =
        current.stateData.state === FieldBuilderState.EditingField &&
        isEqual(current.stateData.field, field)
      if (shouldIgnore && !holding) {
        return
      }
      const stateData: FieldBuilderCreateEditStateData = {
        state: FieldBuilderState.EditingField,
        field,
      }
      if (holding) {
        set({ holdingStateData: stateData })
      } else {
        set({ stateData })
      }
    },
    setToInactive: (holding?: boolean) => {
      const nextState: FieldBuilderStore['holdingStateData'] = {
        state: FieldBuilderState.Inactive,
      }
      if (holding) {
        set({ holdingStateData: nextState })
      } else {
        set({ stateData: nextState })
      }
    },
  })),
)

export const stateDataSelector = (
  state: FieldBuilderStore,
): FieldBuilderStore['stateData'] => state.stateData

export const fieldBuilderStateSelector = (
  state: FieldBuilderStore,
): FieldBuilderStore['stateData']['state'] => state.stateData.state

export const updateCreateStateSelector = (
  state: FieldBuilderStore,
): FieldBuilderStore['updateCreateState'] => state.updateCreateState

export const updateEditStateSelector = (
  state: FieldBuilderStore,
): FieldBuilderStore['updateEditState'] => state.updateEditState

export const setToInactiveSelector = (
  state: FieldBuilderStore,
): FieldBuilderStore['setToInactive'] => state.setToInactive
