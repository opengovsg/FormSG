import create from 'zustand'
import { devtools } from 'zustand/middleware'

import { LogicDto } from '~shared/types/form'

import { AdminEditLogicState } from './types'

type AdminLogicStore = {
  setToCreating: () => void
  setToEditing: (logicId: LogicDto['_id']) => void
  setToInactive: () => void
  reset: () => void
  createOrEditData:
    | {
        state: AdminEditLogicState.CreatingLogic
      }
    | { state: AdminEditLogicState.EditingLogic; logicId: LogicDto['_id'] }
    | null
}

const INITIAL_STATE = {
  createOrEditData: null,
}

export const isCreatingStateSelector = (state: AdminLogicStore) =>
  state.createOrEditData?.state === AdminEditLogicState.CreatingLogic

export const createOrEditDataSelector = (state: AdminLogicStore) =>
  state.createOrEditData

export const editDataSelector = (state: AdminLogicStore) => {
  const createOrEditData = createOrEditDataSelector(state)
  return createOrEditData?.state === AdminEditLogicState.EditingLogic
    ? createOrEditData
    : null
}

export const setToEditingSelector = (state: AdminLogicStore) =>
  state.setToEditing

export const setToInactiveSelector = (state: AdminLogicStore) =>
  state.setToInactive

export const useAdminLogicStore = create<AdminLogicStore>()(
  devtools((set) => ({
    createOrEditData: null,
    setToCreating: () =>
      set({
        createOrEditData: {
          state: AdminEditLogicState.CreatingLogic,
        },
      }),
    setToEditing: (logicId) =>
      set({
        createOrEditData: {
          state: AdminEditLogicState.EditingLogic,
          logicId,
        },
      }),
    setToInactive: () => set({ createOrEditData: null }),
    reset: () => set(INITIAL_STATE),
  })),
)
