import create from 'zustand'
import { devtools } from 'zustand/middleware'

import { LogicDto } from 'formsg-shared/types/form'

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
  pendingSwitchTo: LogicDto['_id'] | null
  requestSwitchTo: (target: LogicDto['_id']) => void
  cancelPendingSwitch: () => void
  completeSave: () => void
}

const INITIAL_STATE = {
  createOrEditData: null,
  pendingSwitchTo: null,
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

export const pendingSwitchToSelector = (state: AdminLogicStore) =>
  state.pendingSwitchTo

export const requestSwitchToSelector = (state: AdminLogicStore) =>
  state.requestSwitchTo

export const cancelPendingSwitchSelector = (state: AdminLogicStore) =>
  state.cancelPendingSwitch

export const completeSaveSelector = (state: AdminLogicStore) =>
  state.completeSave

export const useAdminLogicStore = create<AdminLogicStore>()(
  devtools((set, get) => ({
    createOrEditData: null,
    pendingSwitchTo: null,
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
    requestSwitchTo: (target) => set({ pendingSwitchTo: target }),
    cancelPendingSwitch: () => set({ pendingSwitchTo: null }),
    // Complete a pending switch if one was requested, else collapse the card.
    completeSave: () => {
      const pending = get().pendingSwitchTo
      if (pending !== null) {
        set({
          createOrEditData: {
            state: AdminEditLogicState.EditingLogic,
            logicId: pending,
          },
          pendingSwitchTo: null,
        })
      } else {
        set({ createOrEditData: null })
      }
    },
  })),
)
