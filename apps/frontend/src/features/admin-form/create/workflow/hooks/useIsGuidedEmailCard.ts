import {
  completedStepNumberSelector,
  isEditingEmailCardSelector,
  isGuidedSetupSelector,
  useAdminWorkflowStore,
} from '../adminWorkflowStore'

export const useIsGuidedEmailCard = (): boolean => {
  const isGuidedSetup = useAdminWorkflowStore(isGuidedSetupSelector)
  const isEditingEmailCard = useAdminWorkflowStore(isEditingEmailCardSelector)
  const completedStepNumber = useAdminWorkflowStore(completedStepNumberSelector)

  return isGuidedSetup && isEditingEmailCard && completedStepNumber !== null
}
