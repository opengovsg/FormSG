import { CreateFormFlowStates } from '../CreateFormWizardContext'

// Set-up pages the progress indicator spans, in order, per subflow. The legacy
// subflow is its own 2-step sequence; the paper-tracking flow is 3 steps. Both
// end on Landing, so the sequence is chosen by isLegacySetup rather than the
// current step.
const PAPER_TRACKING_STEPS = [
  CreateFormFlowStates.Details,
  CreateFormFlowStates.Origin,
  CreateFormFlowStates.Landing,
]
const LEGACY_STEPS = [
  CreateFormFlowStates.StorageModeDetails,
  CreateFormFlowStates.Landing,
]

export interface CreateFormProgress {
  /** Whether the progress indicator should render at all. */
  show: boolean
  /** Number of steps (dots) in the active subflow. */
  numIndicators: number
  /** Zero-based index of the current step within the active subflow. */
  currActiveIdx: number
}

/**
 * Resolves the progress-indicator state for the create-form set-up wizard.
 * Gated behind the paper-tracking flag; the legacy subflow has its own shorter
 * sequence than the paper-tracking flow.
 */
export const getCreateFormProgress = ({
  currentStep,
  isLegacySetup,
  isPaperTrackingSetUpPageEnabled,
}: {
  currentStep: CreateFormFlowStates
  isLegacySetup?: boolean
  isPaperTrackingSetUpPageEnabled: boolean
}): CreateFormProgress => {
  const steps = isLegacySetup ? LEGACY_STEPS : PAPER_TRACKING_STEPS
  const currActiveIdx = steps.indexOf(currentStep)
  const show =
    isPaperTrackingSetUpPageEnabled &&
    currActiveIdx >= 0 &&
    currActiveIdx < steps.length

  // currActiveIdx is only meaningful when shown; default to 0 otherwise so a
  // consumer that ignores `show` can never read -1.
  return {
    show,
    numIndicators: steps.length,
    currActiveIdx: show ? currActiveIdx : 0,
  }
}
