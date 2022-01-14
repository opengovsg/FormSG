import produce from 'immer'
import { merge } from 'lodash'
import create from 'zustand'
import { devtools } from 'zustand/middleware'

import { FormFieldDto } from '~shared/types/field'

export type EditFieldStoreState = {
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

export const useEditFieldStore = create<EditFieldStoreState>(
  devtools((set) => ({
    clearActiveField: () =>
      set(
        produce<Pick<EditFieldStoreState, 'activeField'>>((draft) => {
          draft.activeField = undefined
        }),
      ),
    updateActiveField: (payload) =>
      set(
        produce<Pick<EditFieldStoreState, 'activeField'>>((draft) => {
          draft.activeField = merge(draft.activeField, payload)
        }),
      ),
  })),
)
