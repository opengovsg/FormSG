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

export const useAdminLogicStore = create<AdminLogicStore>(
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
