import create from 'zustand'
import { devtools } from 'zustand/middleware'

import { AdminFeedbackTriggerSource } from 'formsg-shared/types'

type AdminFeedbackStore = {
  isEligible: boolean
  triggerSource: AdminFeedbackTriggerSource | null
  formId: string | null
  setEligible: (source: AdminFeedbackTriggerSource, formId?: string) => void
  reset: () => void
}

const INITIAL_STATE = {
  isEligible: false,
  triggerSource: null,
  formId: null,
}

export const isEligibleSelector = (state: AdminFeedbackStore) =>
  state.isEligible

export const triggerSourceSelector = (state: AdminFeedbackStore) =>
  state.triggerSource

export const formIdSelector = (state: AdminFeedbackStore) => state.formId

export const resetSelector = (state: AdminFeedbackStore) => state.reset

export const useAdminFeedbackStore = create<AdminFeedbackStore>()(
  devtools((set) => ({
    ...INITIAL_STATE,
    setEligible: (source, formId) =>
      set({ isEligible: true, triggerSource: source, formId: formId ?? null }),
    reset: () => set(INITIAL_STATE),
  })),
)
