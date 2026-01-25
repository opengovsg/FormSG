import create from 'zustand'
import { devtools } from 'zustand/middleware'

import { AdminEditWorkflowState } from './types'

type WorkflowStateData =
  | { state: AdminEditWorkflowState.CreatingStep }
  | { state: AdminEditWorkflowState.EditingStep; stepNumber: number }
  | null

type AdminWorkflowStore = {
  setToCreating: (holding?: boolean) => void
  setToEditing: (stepNumber: number, holding?: boolean) => void
  setToInactive: (holding?: boolean) => void
  reset: () => void
  createOrEditData: WorkflowStateData
  // Used when there is a dirty state and we want to hold the next state to be set.
  // Will be used to set createOrEditData if user confirms discarding changes.
  holdingStateData: WorkflowStateData
  clearHoldingStateData: () => void
  moveFromHolding: () => void
}

const INITIAL_STATE = {
  createOrEditData: null,
  holdingStateData: null,
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

export const holdingStateDataSelector = (state: AdminWorkflowStore) =>
  state.holdingStateData

export const clearHoldingStateDataSelector = (state: AdminWorkflowStore) =>
  state.clearHoldingStateData

export const moveFromHoldingSelector = (state: AdminWorkflowStore) =>
  state.moveFromHolding

export const useAdminWorkflowStore = create<AdminWorkflowStore>()(
  devtools((set, get) => ({
    createOrEditData: null,
    holdingStateData: null,
    clearHoldingStateData: () => set({ holdingStateData: null }),
    moveFromHolding: () => {
      const holdingStateData = get().holdingStateData
      if (holdingStateData === undefined) return
      set({
        createOrEditData: holdingStateData,
        holdingStateData: null,
      })
    },
    setToCreating: (holding?: boolean) => {
      const stateData: WorkflowStateData = {
        state: AdminEditWorkflowState.CreatingStep,
      }
      if (holding) {
        set({ holdingStateData: stateData })
      } else {
        set({ createOrEditData: stateData })
      }
    },
    setToEditing: (stepNumber, holding?: boolean) => {
      const stateData: WorkflowStateData = {
        state: AdminEditWorkflowState.EditingStep,
        stepNumber,
      }
      if (holding) {
        set({ holdingStateData: stateData })
      } else {
        set({ createOrEditData: stateData })
      }
    },
    setToInactive: (holding?: boolean) => {
      if (holding) {
        set({ holdingStateData: null })
      } else {
        set({ createOrEditData: null })
      }
    },
    reset: () => set(INITIAL_STATE),
  })),
)
