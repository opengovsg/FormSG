import { XMotionBox } from '~templates/MotionBox'

import { useAdminFormCollaborators } from '../../queries'

import { CollaboratorListScreen } from './CollaboratorListScreen'
import {
  CollaboratorFlowStates,
  useCollaboratorWizard,
} from './CollaboratorWizardContext'
import { TransferOwnershipScreen } from './TransferOwnershipScreen'
import { ViewOnlyCollaboratorListScreen } from './ViewOnlyCollaboratorListScreen'

/**
 * @preconditions Requires CollaboratorWizardProvider parent
 * Display screen content depending on the current step (with animation).
 */
export const CollaboratorModalContent = () => {
  const { direction, currentStep } = useCollaboratorWizard()
  const { canEditCollaborators } = useAdminFormCollaborators()

  if (!canEditCollaborators) {
    return <ViewOnlyCollaboratorListScreen />
  }

  return (
    <XMotionBox keyProp={currentStep} direction={direction}>
      {currentStep === CollaboratorFlowStates.List && (
        <CollaboratorListScreen />
      )}
      {currentStep === CollaboratorFlowStates.TransferOwner && (
        <TransferOwnershipScreen />
      )}
    </XMotionBox>
  )
}
