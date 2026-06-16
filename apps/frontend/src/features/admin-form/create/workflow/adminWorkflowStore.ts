import create from 'zustand'
import { devtools } from 'zustand/middleware'

import { AdminEditWorkflowState } from './types'

type AdminWorkflowStore = {
  setToCreating: () => void
  setToEditing: (stepNumber: number) => void
  setToEditingEmail: () => void
  setToInactive: () => void
  reset: () => void
  createOrEditData:
    | { state: AdminEditWorkflowState.CreatingStep }
    | { state: AdminEditWorkflowState.EditingStep; stepNumber: number }
    | { state: AdminEditWorkflowState.EditingEmailCard }
    | null
  pendingSwitchTo: number | 'email' | null
  requestSwitchTo: (target: number | 'email') => void
  completePendingSwitch: () => void
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

export const isEditingEmailSelector = (state: AdminWorkflowStore) =>
  state.createOrEditData?.state === AdminEditWorkflowState.EditingEmailCard

export const setToEditingEmailSelector = (state: AdminWorkflowStore) =>
  state.setToEditingEmail

export const pendingSwitchToSelector = (state: AdminWorkflowStore) =>
  state.pendingSwitchTo

export const requestSwitchToSelector = (state: AdminWorkflowStore) =>
  state.requestSwitchTo

export const completePendingSwitchSelector = (state: AdminWorkflowStore) =>
  state.completePendingSwitch

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
    setToEditingEmail: () =>
      set({
        createOrEditData: {
          state: AdminEditWorkflowState.EditingEmailCard,
        },
      }),
    setToInactive: () => set({ createOrEditData: null }),
    reset: () => set(INITIAL_STATE),
    requestSwitchTo: (target) => set({ pendingSwitchTo: target }),
    completePendingSwitch: () => {
      const pending = get().pendingSwitchTo
      if (pending === null) return
      if (pending === 'email') {
        set({
          createOrEditData: {
            state: AdminEditWorkflowState.EditingEmailCard,
          },
          pendingSwitchTo: null,
        })
      } else {
        set({
          createOrEditData: {
            state: AdminEditWorkflowState.EditingStep,
            stepNumber: pending,
          },
          pendingSwitchTo: null,
        })
      }
    },
  })),
)
