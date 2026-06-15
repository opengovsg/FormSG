import create from 'zustand'
import { devtools, persist } from 'zustand/middleware'

type GuidedMode = 'intro' | 'guided_step' | 'add_another' | 'normal'

type GuidedWorkflowStore = {
  mode: GuidedMode
  currentStepIndex: number
  currentSection: number
  completedSteps: number[]

  // Actions
  startGuided: () => void
  revealNextSection: () => void
  completeCurrentStep: () => void
  promptAddAnother: () => void
  addAnotherStep: () => void
  finishWorkflow: () => void
  requestGuidedMode: () => void
  reset: () => void
}

const INITIAL_STATE = {
  mode: 'intro' as GuidedMode,
  currentStepIndex: 0,
  currentSection: 1,
  completedSteps: [] as number[],
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
        finishWorkflow: () =>
          set({
            mode: 'normal',
          }),
        requestGuidedMode: () =>
          set({
            currentSection: 1,
          }),
        reset: () => set(INITIAL_STATE),
      }),
      {
        name: 'guided-workflow-state',
        partialize: (state) => ({
          mode: state.mode,
          currentStepIndex: state.currentStepIndex,
          currentSection: state.currentSection,
          completedSteps: state.completedSteps,
        }),
      },
    ),
  ),
)
