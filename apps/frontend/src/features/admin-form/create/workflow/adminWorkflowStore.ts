import create from 'zustand'
import { devtools } from 'zustand/middleware'

import { AdminEditWorkflowState } from './types'

type AdminWorkflowStore = {
  setToCreating: () => void
  setToEditing: (stepNumber: number) => void
  setToInactive: () => void
  reset: () => void
  createOrEditData:
    | { state: AdminEditWorkflowState.CreatingStep }
    | { state: AdminEditWorkflowState.EditingStep; stepNumber: number }
    | null
  pendingSwitchTo: number | null
  requestSwitchTo: (target: number) => void
  cancelPendingSwitch: () => void
  completeSave: () => void
}

const INITIAL_STATE = {
  createOrEditData: null,
  pendingSwitchTo: null,
}

export const isCreatingStateSelector = (state: AdminWorkflowStore) =>
  state.createOrEditData?.state === AdminEditWorkflowState.CreatingStep

export const createOrEditDataSelector = (state: AdminWorkflowStore) =>
  state.createOrEditData

export const editDataSelector = (state: AdminWorkflowStore) => {
  const createOrEditData = createOrEditDataSelector(state)
  return createOrEditData?.state === AdminEditWorkflowState.EditingStep
    ? createOrEditData
    : null
}

export const setToCreatingSelector = (state: AdminWorkflowStore) =>
  state.setToCreating

export const setToEditingSelector = (state: AdminWorkflowStore) =>
  state.setToEditing

export const setToInactiveSelector = (state: AdminWorkflowStore) =>
  state.setToInactive

export const pendingSwitchToSelector = (state: AdminWorkflowStore) =>
  state.pendingSwitchTo

export const requestSwitchToSelector = (state: AdminWorkflowStore) =>
  state.requestSwitchTo

export const cancelPendingSwitchSelector = (state: AdminWorkflowStore) =>
  state.cancelPendingSwitch

export const completeSaveSelector = (state: AdminWorkflowStore) =>
  state.completeSave

export const useAdminWorkflowStore = create<AdminWorkflowStore>()(
  devtools((set, get) => ({
    createOrEditData: null,
    pendingSwitchTo: null,
    setToCreating: () =>
      set({
        createOrEditData: {
          state: AdminEditWorkflowState.CreatingStep,
        },
      }),
    setToEditing: (stepNumber) =>
      set({
        createOrEditData: {
          state: AdminEditWorkflowState.EditingStep,
          stepNumber,
        },
      }),
    setToInactive: () => set({ createOrEditData: null }),
    reset: () => set(INITIAL_STATE),
    requestSwitchTo: (target) => set({ pendingSwitchTo: target }),
    cancelPendingSwitch: () => set({ pendingSwitchTo: null }),
    // After a save (or a switch away from an untouched card): complete a
    // pending switch if one was requested, otherwise collapse the open card.
    completeSave: () => {
      const pending = get().pendingSwitchTo
      if (pending !== null) {
        set({
          createOrEditData: {
            state: AdminEditWorkflowState.EditingStep,
            stepNumber: pending,
          },
          pendingSwitchTo: null,
        })
      } else {
        set({ createOrEditData: null })
      }
    },
  })),
)
