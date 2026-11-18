import {
  completedStepNumberSelector,
  createOrEditDataSelector,
  isGuidedSetupSelector,
  useAdminWorkflowStore,
} from '../../adminWorkflowStore'

export const useReportedCompletedStep = (): number | null => {
  const isGuidedSetup = useAdminWorkflowStore(isGuidedSetupSelector)
  const createOrEditData = useAdminWorkflowStore(createOrEditDataSelector)
  const completedStepNumber = useAdminWorkflowStore(completedStepNumberSelector)

  if (!isGuidedSetup || createOrEditData !== null) return null
  return completedStepNumber
}
