import create from 'zustand'
import { devtools } from 'zustand/middleware'

/**
 * Where the feedback prompt was triggered from. Phase 1 only sets
 * 'field-edit'; 'publish' and 'workflow' are reserved for Phase 2.
 */
export type AdminFeedbackTriggerSource =
  | 'field-edit'
  | 'publish'
  | 'workflow'
  | null

type AdminFeedbackStore = {
  /**
   * Whether the admin has done something that makes them eligible to see the
   * feedback prompt in the current session. Resets on page reload (by design -
   * the admin would need to trigger it again).
   */
  isEligible: boolean
  /** Which action triggered the feedback prompt. Sent to backend with the rating. */
  triggerSource: AdminFeedbackTriggerSource
  /** The form the admin was working on when triggered. Sent to backend with the rating. */
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

export const resetSelector = (state: AdminFeedbackStore) => state.reset

export const useAdminFeedbackStore = create<AdminFeedbackStore>()(
  devtools((set) => ({
    ...INITIAL_STATE,
    setEligible: (source, formId) =>
      set({ isEligible: true, triggerSource: source, formId: formId ?? null }),
    reset: () => set(INITIAL_STATE),
  })),
)
