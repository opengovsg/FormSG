import { Box, Container, ModalCloseButton } from '@chakra-ui/react'

import { ProgressIndicator } from '~components/ProgressIndicator/ProgressIndicator'
import { XMotionBox } from '~templates/MotionBox'

import {
  CreateFormFlowStates,
  useCreateFormWizard,
} from '../CreateFormWizardContext'

import { CreateFormDetailsScreen } from './CreateFormDetailsScreen'
import { CreateFormOriginScreen } from './CreateFormOriginScreen'
import { CreateFormStorageModeScreen } from './CreateFormStorageModeScreen'
import {
  EmailModeCreationScreen,
  EmailModeFeedbackScreen,
} from './EmailModeFeedbackAndCreateScreen'
import { SaveSecretKeyScreen } from './SaveSecretKeyScreen'

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

/**
 * @preconditions Requires CreateFormWizardProvider parent
 * Display screen content depending on the current step (with animation).
 */
export const CreateFormModalContent = () => {
  const {
    direction,
    currentStep,
    isPaperTrackingSetUpPageEnabled,
    isLegacySetup,
  } = useCreateFormWizard()

  const progressSteps = isLegacySetup ? LEGACY_STEPS : PAPER_TRACKING_STEPS
  const progressStepIdx = progressSteps.indexOf(currentStep)
  const showProgressBar =
    isPaperTrackingSetUpPageEnabled && progressStepIdx !== -1

  return (
    <>
      {currentStep !== CreateFormFlowStates.Landing && <ModalCloseButton />}
      {showProgressBar && (
        <Box px="1.5rem" pt="1.5rem">
          <Container maxW="45rem" p={0}>
            <ProgressIndicator
              numIndicators={progressSteps.length}
              currActiveIdx={progressStepIdx}
              // Set-up steps are not freely navigable, so the dots are display-only.
              onClick={() => undefined}
            />
          </Container>
        </Box>
      )}
      <XMotionBox keyProp={currentStep} custom={direction}>
        {currentStep === CreateFormFlowStates.Details && (
          <CreateFormDetailsScreen />
        )}
        {currentStep === CreateFormFlowStates.Origin && (
          <CreateFormOriginScreen />
        )}
        {currentStep === CreateFormFlowStates.StorageModeDetails && (
          <CreateFormStorageModeScreen />
        )}
        {currentStep === CreateFormFlowStates.Landing && (
          <SaveSecretKeyScreen />
        )}
        {/* TODO: (Kill Email Mode) Remove this route after kill email mode is fully implemented. */}
        {currentStep === CreateFormFlowStates.EmailFeedback && (
          <EmailModeFeedbackScreen />
        )}
        {currentStep === CreateFormFlowStates.EmailModeCreation && (
          <EmailModeCreationScreen />
        )}
      </XMotionBox>
    </>
  )
}
