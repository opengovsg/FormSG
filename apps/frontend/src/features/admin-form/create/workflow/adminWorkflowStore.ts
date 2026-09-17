import create from 'zustand'
import { devtools } from 'zustand/middleware'

import {
  AdminEditWorkflowState,
  CreateOrEditData,
  EditStepInputs,
  StepDraft,
} from './types'

type AdminWorkflowStore = {
  setToCreating: () => void
  setToEditing: (stepNumber: number) => void
  setToEditingEmailCard: () => void
  continueToEmailCard: () => void
  setToInactive: () => void
  reset: () => void
  createOrEditData: CreateOrEditData | null
  pendingSwitchTo: CreateOrEditData | null
  requestSwitchTo: (stepNumber: number) => void
  requestSwitchToEmailCard: () => void
  requestSwitchToCreating: () => void
  cancelPendingSwitch: () => void
  completeSave: () => void
  completedStepNumber: number | null
  setCompletedStep: (stepNumber: number) => void
  dismissCompletedStep: () => void
  isGuidedSetup: boolean
  setGuidedSetup: (isGuidedSetup: boolean) => void
  isOnWelcomeCard: boolean
  showWelcomeCard: () => void
  startBuildingFromWelcome: () => void
  hasReachedCompletionEmail: boolean
  hasSavedCompletionEmail: boolean
  markCompletionEmailSaved: () => void
  stepDraft: StepDraft | null
  stashStepDraft: (inputs: Partial<EditStepInputs>) => void
  restoreStepDraft: () => void
  clearStepDraft: () => void
}

export const DEFAULT_IS_GUIDED_SETUP = true

const INITIAL_STATE = {
  createOrEditData: null,
  pendingSwitchTo: null,
  completedStepNumber: null,
  isOnWelcomeCard: false,
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

export const isEditingEmailCardSelector = (state: AdminWorkflowStore) =>
  state.createOrEditData?.state === AdminEditWorkflowState.EditingEmailCard

export const setToEditingEmailCardSelector = (state: AdminWorkflowStore) =>
  state.setToEditingEmailCard

export const continueToEmailCardSelector = (state: AdminWorkflowStore) =>
  state.continueToEmailCard

export const setToInactiveSelector = (state: AdminWorkflowStore) =>
  state.setToInactive

export const pendingSwitchToSelector = (state: AdminWorkflowStore) =>
  state.pendingSwitchTo

export const requestSwitchToSelector = (state: AdminWorkflowStore) =>
  state.requestSwitchTo

export const requestSwitchToEmailCardSelector = (state: AdminWorkflowStore) =>
  state.requestSwitchToEmailCard

export const requestSwitchToCreatingSelector = (state: AdminWorkflowStore) =>
  state.requestSwitchToCreating

export const cancelPendingSwitchSelector = (state: AdminWorkflowStore) =>
  state.cancelPendingSwitch

export const completeSaveSelector = (state: AdminWorkflowStore) =>
  state.completeSave

export const completedStepNumberSelector = (state: AdminWorkflowStore) =>
  state.completedStepNumber

export const setCompletedStepSelector = (state: AdminWorkflowStore) =>
  state.setCompletedStep

export const dismissCompletedStepSelector = (state: AdminWorkflowStore) =>
  state.dismissCompletedStep

export const isGuidedSetupSelector = (state: AdminWorkflowStore) =>
  state.isGuidedSetup

export const setGuidedSetupSelector = (state: AdminWorkflowStore) =>
  state.setGuidedSetup

export const isOnWelcomeCardSelector = (state: AdminWorkflowStore) =>
  state.isOnWelcomeCard

export const showWelcomeCardSelector = (state: AdminWorkflowStore) =>
  state.showWelcomeCard

export const startBuildingFromWelcomeSelector = (state: AdminWorkflowStore) =>
  state.startBuildingFromWelcome

export const hasReachedCompletionEmailSelector = (state: AdminWorkflowStore) =>
  state.hasReachedCompletionEmail

export const hasSavedCompletionEmailSelector = (state: AdminWorkflowStore) =>
  state.hasSavedCompletionEmail

export const markCompletionEmailSavedSelector = (state: AdminWorkflowStore) =>
  state.markCompletionEmailSaved

export const stepDraftSelector = (state: AdminWorkflowStore) => state.stepDraft

export const stashStepDraftSelector = (state: AdminWorkflowStore) =>
  state.stashStepDraft

export const restoreStepDraftSelector = (state: AdminWorkflowStore) =>
  state.restoreStepDraft

export const clearStepDraftSelector = (state: AdminWorkflowStore) =>
  state.clearStepDraft

export const useAdminWorkflowStore = create<AdminWorkflowStore>()(
  devtools((set, get) => ({
    createOrEditData: null,
    pendingSwitchTo: null,
    completedStepNumber: null,
    isGuidedSetup: DEFAULT_IS_GUIDED_SETUP,
    isOnWelcomeCard: false,
    stepDraft: null,
    hasReachedCompletionEmail: false,
    hasSavedCompletionEmail: false,
    markCompletionEmailSaved: () => set({ hasSavedCompletionEmail: true }),
    setToCreating: () =>
      set({
        createOrEditData: {
          state: AdminEditWorkflowState.CreatingStep,
        },
        completedStepNumber: null,
        stepDraft: null,
      }),
    setToEditing: (stepNumber) =>
      set({
        createOrEditData: {
          state: AdminEditWorkflowState.EditingStep,
          stepNumber,
        },
        completedStepNumber: null,
        stepDraft: null,
      }),
    setToEditingEmailCard: () =>
      set({
        createOrEditData: {
          state: AdminEditWorkflowState.EditingEmailCard,
        },
        completedStepNumber: null,
        stepDraft: null,
      }),
    continueToEmailCard: () =>
      set({
        createOrEditData: {
          state: AdminEditWorkflowState.EditingEmailCard,
        },
        hasReachedCompletionEmail: true,
      }),
    setCompletedStep: (stepNumber) => set({ completedStepNumber: stepNumber }),
    dismissCompletedStep: () => set({ completedStepNumber: null }),
    setGuidedSetup: (isGuidedSetup) => set({ isGuidedSetup }),
    showWelcomeCard: () => set({ isOnWelcomeCard: true }),
    startBuildingFromWelcome: () =>
      set({
        isOnWelcomeCard: false,
        createOrEditData: { state: AdminEditWorkflowState.CreatingStep },
      }),
    setToInactive: () => set({ createOrEditData: null, stepDraft: null }),
    reset: () => set(INITIAL_STATE),
    requestSwitchTo: (stepNumber) =>
      set({
        pendingSwitchTo: {
          state: AdminEditWorkflowState.EditingStep,
          stepNumber,
        },
      }),
    requestSwitchToEmailCard: () =>
      set({
        pendingSwitchTo: { state: AdminEditWorkflowState.EditingEmailCard },
      }),
    requestSwitchToCreating: () =>
      set({
        pendingSwitchTo: { state: AdminEditWorkflowState.CreatingStep },
      }),
    cancelPendingSwitch: () => set({ pendingSwitchTo: null }),
    stashStepDraft: (inputs) => {
      const createOrEditData = get().createOrEditData
      if (!createOrEditData) return
      set({ stepDraft: { target: createOrEditData, inputs } })
    },
    restoreStepDraft: () => {
      const stepDraft = get().stepDraft
      if (!stepDraft) return
      set({ createOrEditData: stepDraft.target })
    },
    clearStepDraft: () => set({ stepDraft: null }),
    completeSave: () => {
      const pendingSwitchTo = get().pendingSwitchTo
      set({
        createOrEditData: pendingSwitchTo,
        pendingSwitchTo: null,
        stepDraft: null,
        ...(pendingSwitchTo ? { completedStepNumber: null } : {}),
      })
    },
  })),
)
