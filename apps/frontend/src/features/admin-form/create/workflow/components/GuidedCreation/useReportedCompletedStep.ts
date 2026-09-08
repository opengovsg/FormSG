import {
  completedStepNumberSelector,
  createOrEditDataSelector,
  isGuidedSetupSelector,
  useAdminWorkflowStore,
} from '../../adminWorkflowStore'
import { useIsWorkflowBuilderRedesign } from '../../hooks/useIsWorkflowBuilderRedesign'

export const useReportedCompletedStep = (): number | null => {
  const isRedesign = useIsWorkflowBuilderRedesign()
  const isGuidedSetup = useAdminWorkflowStore(isGuidedSetupSelector)
  const createOrEditData = useAdminWorkflowStore(createOrEditDataSelector)
  const completedStepNumber = useAdminWorkflowStore(completedStepNumberSelector)

  if (!isRedesign || !isGuidedSetup || createOrEditData !== null) return null
  return completedStepNumber
}
