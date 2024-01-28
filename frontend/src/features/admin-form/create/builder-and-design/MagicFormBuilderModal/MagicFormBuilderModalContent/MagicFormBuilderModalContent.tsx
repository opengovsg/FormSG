import { XMotionBox } from '~templates/MotionBox'

import {
  MagicFormBuilderFlowStates,
  useMagicFormBuilderWizard,
} from '../MagicFormBuilderWizardContext'

import { MagicFormBuilderLandingScreen } from './LandingScreen'
import { MagicFormBuilderPdfDetailsScreen } from './PdfDetailsScreen'
import { MagicFormBuilderPromptDetailsScreen } from './PromptDetailsScreen'

/**
 * @preconditions Requires MagicFormBuilderWizardProvider parent
 * Display screen content depending on the current step (with animation).
 */
export const MagicFormBuilderModalContent = () => {
  const { direction, currentStep } = useMagicFormBuilderWizard()

  return (
    <XMotionBox keyProp={currentStep} custom={direction}>
      {currentStep === MagicFormBuilderFlowStates.Landing && (
        <MagicFormBuilderLandingScreen />
      )}
      {currentStep === MagicFormBuilderFlowStates.PromptDetails && (
        <MagicFormBuilderPromptDetailsScreen />
      )}
      {currentStep === MagicFormBuilderFlowStates.PdfDetails && (
        <MagicFormBuilderPdfDetailsScreen />
      )}
    </XMotionBox>
  )
}
