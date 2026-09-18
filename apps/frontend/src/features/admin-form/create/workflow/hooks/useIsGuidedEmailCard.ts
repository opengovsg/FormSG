import {
  completedStepNumberSelector,
  isEditingEmailCardSelector,
  isGuidedSetupSelector,
  useAdminWorkflowStore,
} from '../adminWorkflowStore'
import { useIsWorkflowBuilderRedesign } from './useIsWorkflowBuilderRedesign'

export const useIsGuidedEmailCard = (): boolean => {
  const isRedesign = useIsWorkflowBuilderRedesign()
  const isGuidedSetup = useAdminWorkflowStore(isGuidedSetupSelector)
  const isEditingEmailCard = useAdminWorkflowStore(isEditingEmailCardSelector)
  const completedStepNumber = useAdminWorkflowStore(completedStepNumberSelector)

  return (
    isRedesign &&
    isGuidedSetup &&
    isEditingEmailCard &&
    completedStepNumber !== null
  )
}
