import create from 'zustand'
import { devtools, persist } from 'zustand/middleware'

const GUIDED_MODES = [
  'intro',
  'welcome',
  'guided_step',
  'add_another',
  'email_setup',
  'workflow_complete',
  'status_toggle',
  'success_modal',
  'normal',
] as const

export type GuidedMode = (typeof GUIDED_MODES)[number]

type GuidedWorkflowStore = {
  mode: GuidedMode
  currentStepIndex: number
  currentSection: number
  completedSteps: number[]
  /** The form this guided state belongs to. Used to detect stale state. */
  formId: string | null

  // Actions
  startGuided: () => void
  startBuilding: () => void
  revealNextSection: () => void
  goBackSection: () => void
  setCurrentSection: (section: number) => void
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
  /**
   * Resume the guided flow at the first section an admin has not finished,
   * rather than restarting it or dropping them into the normal editor.
   */
  resumeAtIncompleteSection: (
    stepIndex: number,
    section: 'respondent' | 'fields',
  ) => void
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
            mode: 'welcome',
            currentStepIndex: 0,
            currentSection: 1,
          }),
        startBuilding: () =>
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
        setCurrentSection: (section) => set({ currentSection: section }),
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
        resumeAtIncompleteSection: (stepIndex, section) => {
          // Section order differs by step. Step 1 is Name, People, Fields.
          // Later steps insert What they do before Fields.
          const isFirstStep = stepIndex === 0
          const currentSection =
            section === 'respondent' ? 2 : isFirstStep ? 3 : 4
          set({
            mode: 'guided_step',
            currentStepIndex: stepIndex,
            currentSection,
          })
        },
        setFormId: (formId: string) => set({ formId }),
        reset: () => set(INITIAL_STATE),
      }),
      {
        name: 'guided-workflow-state',
        // A user mid-flow when a release changes the GuidedMode members would
        // otherwise deserialise into an unknown mode. Bump this when the union
        // changes; onRehydrateStorage is the belt to that braces.
        version: 1,
        onRehydrateStorage: () => (state) => {
          if (
            state &&
            !(GUIDED_MODES as readonly string[]).includes(state.mode)
          ) {
            state.mode = 'normal'
          }
        },
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
