import { ModalCloseButton } from '@chakra-ui/react'

import { XMotionBox } from '~templates/MotionBox'

import {
  CreateFormFlowStates,
  useCreateFormWizard,
} from '../CreateFormWizardContext'

import { CreateFormDetailsScreen } from './CreateFormDetailsScreen'
import { CreateFormOriginScreen } from './CreateFormOriginScreen'
import { CreateFormProgressBar } from './CreateFormProgressBar'
import { CreateFormStorageModeScreen } from './CreateFormStorageModeScreen'
import {
  EmailModeCreationScreen,
  EmailModeFeedbackScreen,
} from './EmailModeFeedbackAndCreateScreen'
import { SaveSecretKeyScreen } from './SaveSecretKeyScreen'

const PROGRESS_STEP_ORDER = [
  CreateFormFlowStates.Details,
  CreateFormFlowStates.Origin,
  CreateFormFlowStates.Landing,
]

/**
 * @preconditions Requires CreateFormWizardProvider parent
 * Display screen content depending on the current step (with animation).
 */
export const CreateFormModalContent = () => {
  const { direction, currentStep, isPaperTrackingSetUpPageEnabled } =
    useCreateFormWizard()

  const progressStepIdx = PROGRESS_STEP_ORDER.indexOf(currentStep)
  const showProgressBar =
    isPaperTrackingSetUpPageEnabled && progressStepIdx !== -1

  return (
    <>
      {currentStep !== CreateFormFlowStates.Landing && <ModalCloseButton />}
      {showProgressBar && (
        <CreateFormProgressBar
          currentStepIdx={progressStepIdx}
          numSteps={PROGRESS_STEP_ORDER.length}
        />
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
