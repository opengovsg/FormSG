import { XMotionBox } from '~templates/MotionBox'

import {
  CreateFormFlowStates,
  useCreateFormWizard,
} from '../CreateFormWizardContext'

import { CreateFormDetailsScreen } from './CreateFormDetailsScreen'
import { SaveSecretKeyScreen } from './SaveSecretKeyScreen'

/**
 * @preconditions Requires CreateFormWizardProvider parent
 * Display screen content depending on the current step (with animation).
 */
export const CreateFormModalContent = () => {
  const { direction, currentStep } = useCreateFormWizard()

  return (
    <XMotionBox keyProp={currentStep} custom={direction}>
      {currentStep === CreateFormFlowStates.Details && (
        <CreateFormDetailsScreen />
      )}
      {currentStep === CreateFormFlowStates.Landing && <SaveSecretKeyScreen />}
    </XMotionBox>
  )
}
