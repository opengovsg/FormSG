import {
  isGuidedSetupSelector,
  useAdminWorkflowStore,
} from '../adminWorkflowStore'
import { useIsWorkflowBuilderRedesign } from './useIsWorkflowBuilderRedesign'

export const useIsWorkflowGuidedMode = (): boolean => {
  const isRedesign = useIsWorkflowBuilderRedesign()
  const isGuidedSetup = useAdminWorkflowStore(isGuidedSetupSelector)

  return isRedesign && isGuidedSetup
}
