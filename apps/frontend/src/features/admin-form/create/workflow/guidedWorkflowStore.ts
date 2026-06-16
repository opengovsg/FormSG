import create from 'zustand'
import { devtools, persist } from 'zustand/middleware'

type GuidedMode =
  | 'intro'
  | 'guided_step'
  | 'add_another'
  | 'email_setup'
  | 'workflow_complete'
  | 'status_toggle'
  | 'success_modal'
  | 'normal'

type GuidedWorkflowStore = {
  mode: GuidedMode
  currentStepIndex: number
  currentSection: number
  completedSteps: number[]
  /** The form this guided state belongs to. Used to detect stale state. */
  formId: string | null

  // Actions
  startGuided: () => void
  revealNextSection: () => void
  goBackSection: () => void
  completeCurrentStep: () => void
  promptAddAnother: () => void
  addAnotherStep: () => void
  finishWorkflow: () => void
  startEmailSetup: () => void
  completeEmailSetup: () => void
  completeWorkflowPeek: () => void
  completeStatusToggle: () => void
  completeSuccessModal: () => void
  cancelCurrentStep: () => void
  requestGuidedMode: () => void
  /** Set the form this guided state belongs to */
  setFormId: (formId: string) => void
  reset: () => void
}

const INITIAL_STATE = {
  mode: 'intro' as GuidedMode,
  currentStepIndex: 0,
  currentSection: 1,
  completedSteps: [] as number[],
  formId: null as string | null,
}

// Selectors
export const guidedModeSelector = (state: GuidedWorkflowStore) => state.mode

export const currentStepIndexSelector = (state: GuidedWorkflowStore) =>
  state.currentStepIndex

export const currentSectionSelector = (state: GuidedWorkflowStore) =>
  state.currentSection

export const completedStepsSelector = (state: GuidedWorkflowStore) =>
  state.completedSteps

export const useGuidedWorkflowStore = create<GuidedWorkflowStore>()(
  devtools(
    persist(
      (set) => ({
        ...INITIAL_STATE,
        startGuided: () =>
          set({
            mode: 'guided_step',
            currentStepIndex: 0,
            currentSection: 1,
          }),
        revealNextSection: () =>
          set((state) => ({
            currentSection: state.currentSection + 1,
          })),
        goBackSection: () =>
          set((state) => ({
            currentSection: Math.max(1, state.currentSection - 1),
          })),
        completeCurrentStep: () =>
          set((state) => ({
            completedSteps: [...state.completedSteps, state.currentStepIndex],
            mode: 'add_another',
          })),
        promptAddAnother: () =>
          set({
            mode: 'add_another',
          }),
        addAnotherStep: () =>
          set((state) => ({
            currentStepIndex: state.currentStepIndex + 1,
            currentSection: 1,
            mode: 'guided_step',
          })),
        cancelCurrentStep: () =>
          set((state) => ({
            currentStepIndex: Math.max(0, state.currentStepIndex - 1),
            currentSection: 1,
            mode: 'add_another',
          })),
        startEmailSetup: () =>
          set({
            mode: 'email_setup',
          }),
        completeEmailSetup: () =>
          set({
            mode: 'workflow_complete',
          }),
        completeWorkflowPeek: () =>
          set({
            mode: 'status_toggle',
          }),
        completeStatusToggle: () =>
          set({
            mode: 'success_modal',
          }),
        completeSuccessModal: () =>
          set({
            mode: 'normal',
          }),
        finishWorkflow: () =>
          set({
            mode: 'normal',
          }),
        requestGuidedMode: () =>
          set({
            currentSection: 1,
          }),
        setFormId: (formId: string) => set({ formId }),
        reset: () => set(INITIAL_STATE),
      }),
      {
        name: 'guided-workflow-state',
        partialize: (state) => ({
          mode: state.mode,
          currentStepIndex: state.currentStepIndex,
          currentSection: state.currentSection,
          completedSteps: state.completedSteps,
          formId: state.formId,
        }),
      },
    ),
  ),
)
