import { isEqual } from 'lodash'
import create from 'zustand'
import { devtools } from 'zustand/middleware'

import { FieldCreateDto, FormFieldDto } from '~shared/types/field'

export enum FieldBuilderState {
  CreatingField,
  EditingField,
  EditingEndPage,
  Inactive,
}

export type FieldBuilderStore = {
  updateCreateState: (field: FieldCreateDto, insertionIndex: number) => void
  updateEditState: (field: FormFieldDto) => void
  setEditEndPage: () => void
  setToInactive: () => void
  isDirty: boolean
  setIsDirty: (isDirty: boolean) => void
  stateData:
    | {
        state: FieldBuilderState.CreatingField
        field: FieldCreateDto
        insertionIndex: number
      }
    | {
        state: FieldBuilderState.EditingField
        field: FormFieldDto
      }
    | { state: FieldBuilderState.EditingEndPage }
    | { state: FieldBuilderState.Inactive }
}

export const useFieldBuilderStore = create<FieldBuilderStore>(
  devtools((set, get) => ({
    stateData: { state: FieldBuilderState.Inactive },
    isDirty: false,
    setIsDirty: (isDirty: boolean) => set({ isDirty }),
    updateCreateState: (field, insertionIndex) => {
      // perf: prevent store update if field is the same
      const current = get()
      if (
        current.stateData.state === FieldBuilderState.CreatingField &&
        current.stateData.insertionIndex === insertionIndex &&
        isEqual(current.stateData.field, field)
      ) {
        return
      }
      set({
        stateData: {
          state: FieldBuilderState.CreatingField,
          field,
          insertionIndex,
        },
      })
    },
    updateEditState: (field) => {
      // perf: prevent store update if field is the same
      const current = get()
      if (
        current.stateData.state === FieldBuilderState.EditingField &&
        isEqual(current.stateData.field, field)
      ) {
        return
      }
      set({
        stateData: { state: FieldBuilderState.EditingField, field },
      })
    },
    setEditEndPage: () => {
      set({ stateData: { state: FieldBuilderState.EditingEndPage } })
    },
    setToInactive: () => {
      set({ stateData: { state: FieldBuilderState.Inactive } })
    },
  })),
)

export const stateDataSelector = (
  state: FieldBuilderStore,
): FieldBuilderStore['stateData'] => state.stateData

export const updateCreateStateSelector = (
  state: FieldBuilderStore,
): FieldBuilderStore['updateCreateState'] => state.updateCreateState

export const updateEditStateSelector = (
  state: FieldBuilderStore,
): FieldBuilderStore['updateEditState'] => state.updateEditState

export const setToInactiveSelector = (
  state: FieldBuilderStore,
): FieldBuilderStore['setToInactive'] => state.setToInactive

export const setToEditEndPageSelector = (
  state: FieldBuilderStore,
): FieldBuilderStore['setEditEndPage'] => state.setEditEndPage

export const isDirtySelector = (
  state: FieldBuilderStore,
): FieldBuilderStore['isDirty'] => state.isDirty

export const setIsDirtySelector = (
  state: FieldBuilderStore,
): FieldBuilderStore['setIsDirty'] => state.setIsDirty
