import produce from 'immer'
import { extend } from 'lodash'
import create from 'zustand'
import { devtools } from 'zustand/middleware'

import { BasicField, FormFieldDto } from '~shared/types/field'

import { PENDING_CREATE_FIELD_ID } from './constants'

export type EditFieldStoreState = {
  fieldToCreate?: {
    fieldType: BasicField
    insertionIndex: number
  }
  setFieldToCreate: (fieldType: BasicField, insertionIndex: number) => void
  clearFieldToCreate: () => void
  activeField?: FormFieldDto
  updateActiveField: (field: Partial<FormFieldDto>) => void
  clearActiveField: () => void
}

export const activeFieldSelector = (
  state: EditFieldStoreState,
): EditFieldStoreState['activeField'] => state.activeField

export const activeFieldIdSelector = (
  state: EditFieldStoreState,
): string | undefined => state.activeField?._id

export const clearActiveFieldSelector = (
  state: EditFieldStoreState,
): EditFieldStoreState['clearActiveField'] => state.clearActiveField

export const updateFieldSelector = (
  state: EditFieldStoreState,
): EditFieldStoreState['updateActiveField'] => state.updateActiveField

export const setFieldToCreateSelector = (
  state: EditFieldStoreState,
): EditFieldStoreState['setFieldToCreate'] => state.setFieldToCreate

export const useEditFieldStore = create<EditFieldStoreState>(
  devtools((set) => ({
    setFieldToCreate: (fieldType: BasicField, insertionIndex: number) => {
      set((state) =>
        produce(state, (draft) => {
          draft.fieldToCreate = { fieldType, insertionIndex }
        }),
      )
    },
    clearFieldToCreate: () => {
      return set(
        produce<Pick<EditFieldStoreState, 'fieldToCreate'>>((draft) => {
          draft.fieldToCreate = undefined
        }),
      )
    },
    clearActiveField: () => {
      return set(
        produce<Pick<EditFieldStoreState, 'activeField' | 'fieldToCreate'>>(
          (draft) => {
            draft.activeField = undefined
            draft.fieldToCreate = undefined
          },
        ),
      )
    },
    updateActiveField: (payload) => {
      return set(
        produce<Pick<EditFieldStoreState, 'activeField' | 'fieldToCreate'>>(
          (draft) => {
            // Clear the fieldToCreate if the active field is updated and is not a field creation.
            draft.activeField = extend(draft.activeField, payload)
            // Only clear fieldToCreate if _id changes
            if (payload._id && payload._id !== PENDING_CREATE_FIELD_ID) {
              draft.fieldToCreate = undefined
            }
          },
        ),
      )
    },
  })),
)
