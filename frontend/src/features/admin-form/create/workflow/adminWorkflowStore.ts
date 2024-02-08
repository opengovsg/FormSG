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
}

const INITIAL_STATE = {
  createOrEditData: null,
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

export const useAdminWorkflowStore = create<AdminWorkflowStore>()(
  devtools((set) => ({
    createOrEditData: null,
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
  })),
)
