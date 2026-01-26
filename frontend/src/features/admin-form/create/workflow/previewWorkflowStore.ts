import create from 'zustand'
import { devtools } from 'zustand/middleware'

import { EditStepInputs } from './types'

type PreviewWorkflowStore = {
  previewData: Partial<EditStepInputs> | null
  stepNumber: number | null
  setPreviewData: (stepNumber: number, data: Partial<EditStepInputs>) => void
  clearPreviewData: () => void
  clearIfNotStep: (stepNumber: number) => void
}

// Safe selector with stepNumber validation
export const previewDataSelector =
  (currentStepNumber: number) => (state: PreviewWorkflowStore) =>
    state.stepNumber === currentStepNumber ? state.previewData : null

export const setPreviewDataSelector = (state: PreviewWorkflowStore) =>
  state.setPreviewData

export const clearPreviewDataSelector = (state: PreviewWorkflowStore) =>
  state.clearPreviewData

export const usePreviewWorkflowStore = create<PreviewWorkflowStore>()(
  devtools((set, get) => ({
    previewData: null,
    stepNumber: null,

    setPreviewData: (stepNumber, data) =>
      set({
        stepNumber,
        previewData: data,
      }),

    clearPreviewData: () =>
      set({
        previewData: null,
        stepNumber: null,
      }),

    // Safety: Clear if stepNumber doesn't match
    clearIfNotStep: (stepNumber) => {
      const state = get()
      if (state.stepNumber !== stepNumber) {
        set({ previewData: null, stepNumber: null })
      }
    },
  })),
)
