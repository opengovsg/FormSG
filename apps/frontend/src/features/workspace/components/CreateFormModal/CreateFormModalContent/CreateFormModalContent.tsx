import { ModalCloseButton } from '@chakra-ui/react'

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
import { StorageModeOriginScreen } from './StorageModeOriginScreen'

/**
 * @preconditions Requires CreateFormWizardProvider parent
 * Display screen content depending on the current step (with animation).
 */
export const CreateFormModalContent = () => {
  const { direction, currentStep } = useCreateFormWizard()

  return (
    <>
      {currentStep !== CreateFormFlowStates.Landing && <ModalCloseButton />}
      <XMotionBox keyProp={currentStep} custom={direction}>
        {currentStep === CreateFormFlowStates.Details && (
          <CreateFormDetailsScreen />
        )}
        {currentStep === CreateFormFlowStates.Origin && (
          <CreateFormOriginScreen />
        )}
        {currentStep === CreateFormFlowStates.StorageModeOrigin && (
          <StorageModeOriginScreen />
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
