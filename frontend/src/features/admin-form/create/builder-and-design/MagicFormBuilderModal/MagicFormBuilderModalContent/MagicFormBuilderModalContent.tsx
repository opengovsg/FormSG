import { XMotionBox } from '~templates/MotionBox'

import {
  MagicFormBuilderFlowStates,
  useMagicFormBuilderWizard,
} from '../MagicFormBuilderWizardContext'

import { MagicFormBuilderGifLoadingScreen } from './GifLoadingScreen'
import { MagicFormBuilderLandingScreen } from './LandingScreen'
import { MagicFormBuilderPdfDetailsScreen } from './PdfDetailsScreen'
import { MagicFormBuilderPromptDetailsScreen } from './PromptDetailsScreen'

/**
 * @preconditions Requires MagicFormBuilderWizardProvider parent
 * Display screen content depending on the current step (with animation).
 */
export const MagicFormBuilderModalContent = ({
  onClose,
}: {
  onClose: () => void
}) => {
  const { direction, currentStep, isLoading } = useMagicFormBuilderWizard()

  return isLoading ? (
    <MagicFormBuilderGifLoadingScreen />
  ) : (
    <XMotionBox keyProp={currentStep} custom={direction}>
      {currentStep === MagicFormBuilderFlowStates.Landing && (
        <MagicFormBuilderLandingScreen onClose={onClose} />
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
