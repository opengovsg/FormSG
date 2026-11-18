import {
  isGuidedSetupSelector,
  useAdminWorkflowStore,
} from '../adminWorkflowStore'

export const useIsWorkflowGuidedMode = (): boolean =>
  useAdminWorkflowStore(isGuidedSetupSelector)
