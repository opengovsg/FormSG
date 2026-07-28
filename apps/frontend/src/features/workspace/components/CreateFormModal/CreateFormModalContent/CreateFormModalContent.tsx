import { Box, Container, ModalCloseButton } from '@chakra-ui/react'

import { ProgressIndicator } from '~components/ProgressIndicator/ProgressIndicator'
import { XMotionBox } from '~templates/MotionBox'

import {
  CreateFormFlowStates,
  useCreateFormWizard,
} from '../CreateFormWizardContext'

import { CreateFormDetailsScreen } from './CreateFormDetailsScreen'
import { CreateFormOriginScreen } from './CreateFormOriginScreen'
import { getCreateFormProgress } from './createFormProgress'
import { CreateFormStorageModeScreen } from './CreateFormStorageModeScreen'
import {
  EmailModeCreationScreen,
  EmailModeFeedbackScreen,
} from './EmailModeFeedbackAndCreateScreen'
import { SaveSecretKeyScreen } from './SaveSecretKeyScreen'

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

  const {
    show: showProgressIndicator,
    numIndicators,
    currActiveIdx,
  } = getCreateFormProgress({
    currentStep,
    isLegacySetup,
    isPaperTrackingSetUpPageEnabled,
  })

  return (
    <>
      {currentStep !== CreateFormFlowStates.Landing && <ModalCloseButton />}
      {showProgressIndicator && (
        <Box px="1.5rem" pt="1.5rem">
          <Container maxW="45rem" p={0}>
            <ProgressIndicator
              numIndicators={numIndicators}
              currActiveIdx={currActiveIdx}
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
