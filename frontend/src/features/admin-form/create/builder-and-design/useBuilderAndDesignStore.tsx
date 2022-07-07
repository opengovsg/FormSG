import { isEqual } from 'lodash'
import create from 'zustand'
import { devtools } from 'zustand/middleware'

import { FieldCreateDto, FormFieldDto } from '~shared/types/field'

export enum BuildFieldState {
  CreatingField,
  EditingField,
  EditingEndPage,
  Inactive,
}

export type BuilderAndDesignStore = {
  updateCreateState: (field: FieldCreateDto, insertionIndex: number) => void
  updateEditState: (field: FormFieldDto) => void
  setEditEndPage: () => void
  setToInactive: () => void
  stateData:
    | {
        state: BuildFieldState.CreatingField
        field: FieldCreateDto
        insertionIndex: number
      }
    | {
        state: BuildFieldState.EditingField
        field: FormFieldDto
      }
    | { state: BuildFieldState.EditingEndPage }
    | { state: BuildFieldState.Inactive }
}

export const useBuilderAndDesignStore = create<BuilderAndDesignStore>(
  devtools((set, get) => ({
    stateData: { state: BuildFieldState.Inactive },
    updateCreateState: (field, insertionIndex) => {
      // perf: prevent store update if field is the same
      const current = get()
      if (
        current.stateData.state === BuildFieldState.CreatingField &&
        current.stateData.insertionIndex === insertionIndex &&
        isEqual(current.stateData.field, field)
      ) {
        return
      }
      set({
        stateData: {
          state: BuildFieldState.CreatingField,
          field,
          insertionIndex,
        },
      })
    },
    updateEditState: (field) => {
      // perf: prevent store update if field is the same
      const current = get()
      if (
        current.stateData.state === BuildFieldState.EditingField &&
        isEqual(current.stateData.field, field)
      ) {
        return
      }
      set({
        stateData: { state: BuildFieldState.EditingField, field },
      })
    },
    setEditEndPage: () => {
      set({ stateData: { state: BuildFieldState.EditingEndPage } })
    },
    setToInactive: () => {
      set({ stateData: { state: BuildFieldState.Inactive } })
    },
  })),
)

export const stateDataSelector = (
  state: BuilderAndDesignStore,
): BuilderAndDesignStore['stateData'] => state.stateData

export const updateCreateStateSelector = (
  state: BuilderAndDesignStore,
): BuilderAndDesignStore['updateCreateState'] => state.updateCreateState

export const updateEditStateSelector = (
  state: BuilderAndDesignStore,
): BuilderAndDesignStore['updateEditState'] => state.updateEditState

export const setToInactiveSelector = (
  state: BuilderAndDesignStore,
): BuilderAndDesignStore['setToInactive'] => state.setToInactive

export const setToEditEndPageSelector = (
  state: BuilderAndDesignStore,
): BuilderAndDesignStore['setEditEndPage'] => state.setEditEndPage
