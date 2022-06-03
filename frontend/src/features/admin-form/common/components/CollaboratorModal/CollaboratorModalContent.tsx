import { XMotionBox } from '~templates/MotionBox'

import { RemoveSelfScreen } from './RemoveSelfScreen/RemoveSelfScreen'
import { CollaboratorListScreen } from './CollaboratorListScreen'
import {
  CollaboratorFlowStates,
  useCollaboratorWizard,
} from './CollaboratorWizardContext'
import { TransferOwnershipScreen } from './TransferOwnershipScreen'

/**
 * @preconditions Requires CollaboratorWizardProvider parent
 * Display screen content depending on the current step (with animation).
 */
export const CollaboratorModalContent = () => {
  const { direction, currentStep } = useCollaboratorWizard()

  return (
    <XMotionBox keyProp={currentStep} direction={direction}>
      {currentStep === CollaboratorFlowStates.List && (
        <CollaboratorListScreen />
      )}
      {currentStep === CollaboratorFlowStates.TransferOwner && (
        <TransferOwnershipScreen />
      )}
      {currentStep === CollaboratorFlowStates.RemoveSelf && (
        <RemoveSelfScreen />
      )}
    </XMotionBox>
  )
}
