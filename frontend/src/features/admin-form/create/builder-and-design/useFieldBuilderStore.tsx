import { isEqual, pick } from 'lodash'
import create from 'zustand'
import { devtools } from 'zustand/middleware'

import { BasicField, FieldCreateDto, FormFieldDto } from '~shared/types/field'

import { getFieldCreationMeta } from './utils/fieldCreation'

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
  changeFieldType: (fieldTypeToChangeTo: BasicField) => void
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

/*
 * Used to generate the required new field properties when changing between basic field types.
 * Note that the new field values includes all current values including properties not required by the new field type.
 * This allows us to retain user-defined values for subsequent field type changes.
 * For example, suppose a user-defined options for radio field type and then changes the field type to short text,
 * the user-defined options is retained so if the user changes to checkbox next, the options will be retained and applied to the checkbox field.
 */
const getChangedFieldValues = ({
  existingFieldValues,
  fieldTypeToChangeTo,
  _id,
}: {
  existingFieldValues: FieldCreateDto | FormFieldDto
  fieldTypeToChangeTo: BasicField
  _id?: string
}): FormFieldDto => {
  const newFieldMeta = getFieldCreationMeta(fieldTypeToChangeTo)

  return {
    ...newFieldMeta,
    ...existingFieldValues,
    fieldType: fieldTypeToChangeTo,
    _id,
  } as FormFieldDto
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
    changeFieldType: (fieldTypeToChangeTo) => {
      const current = get()

      if (current.stateData.state === FieldBuilderState.CreatingField) {
        const changedField = getChangedFieldValues({
          existingFieldValues: current.stateData.field,
          fieldTypeToChangeTo,
        })

        set({
          stateData: {
            state: FieldBuilderState.CreatingField,
            field: changedField,
            insertionIndex: current.stateData.insertionIndex,
          },
        })
      } else if (current.stateData.state === FieldBuilderState.EditingField) {
        const changedField = getChangedFieldValues({
          existingFieldValues: current.stateData.field,
          fieldTypeToChangeTo,
          _id: current.stateData.field._id,
        })
        set({
          stateData: {
            state: FieldBuilderState.EditingField,
            field: changedField,
          },
        })
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

export const fieldTypeSelector = (
  state: FieldBuilderStore,
): BasicField | undefined => {
  if (
    state.stateData.state === FieldBuilderState.CreatingField ||
    state.stateData.state === FieldBuilderState.EditingField
  ) {
    return state.stateData.field.fieldType
  }
  return undefined
}

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

export const changeFieldTypeSelector = (
  state: FieldBuilderStore,
): FieldBuilderStore['changeFieldType'] => state.changeFieldType
