import create from 'zustand'
import { devtools } from 'zustand/middleware'

import { FieldCreateDto, FormFieldDto } from '~shared/types/field'

export enum BuildFieldState {
  CreatingField,
  EditingField,
  Inactive,
}

export type BuilderAndDesignStore = {
  fields: FormFieldDto[] | null
  setFields: (fields: FormFieldDto[]) => void
  updateCreateState: (field: FieldCreateDto, insertionIndex: number) => void
  updateEditState: (field: FormFieldDto) => void
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
    | { state: BuildFieldState.Inactive }
}

export const useBuilderAndDesignStore = create<BuilderAndDesignStore>(
  devtools((set) => ({
    fields: null,
    setFields: (fields) => set(() => ({ fields })),
    stateData: { state: BuildFieldState.Inactive },
    updateCreateState: (field, insertionIndex) => {
      set({
        stateData: {
          state: BuildFieldState.CreatingField,
          field,
          insertionIndex,
        },
      })
    },
    updateEditState: (field) => {
      set({
        stateData: { state: BuildFieldState.EditingField, field },
      })
    },
    setToInactive: () => {
      set({ stateData: { state: BuildFieldState.Inactive } })
    },
  })),
)

export const fieldsSelector = (
  state: BuilderAndDesignStore,
): BuilderAndDesignStore['fields'] => state.fields

export const setFieldsSelector = (
  state: BuilderAndDesignStore,
): BuilderAndDesignStore['setFields'] => state.setFields

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
