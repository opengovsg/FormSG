import {
  completedStepNumberSelector,
  createOrEditDataSelector,
  useAdminWorkflowStore,
} from '../../adminWorkflowStore'
import { useIsWorkflowBuilderRedesign } from '../../hooks/useIsWorkflowBuilderRedesign'

export const useReportedCompletedStep = (): number | null => {
  const isRedesign = useIsWorkflowBuilderRedesign()
  const createOrEditData = useAdminWorkflowStore(createOrEditDataSelector)
  const completedStepNumber = useAdminWorkflowStore(completedStepNumberSelector)

  if (!isRedesign || createOrEditData !== null) return null
  return completedStepNumber
}
