import { mustWorkflowBeComplete } from 'formsg-shared/utils/workflow-step-completion'

import { useAdminForm } from '~features/admin-form/common/queries'

import { useIsWorkflowBuilderRedesign } from './useIsWorkflowBuilderRedesign'

/**
 * Whether a half-built workflow step may be saved as-is (FRM-2489).
 *
 * The policy itself lives in the shared module beside the completeness
 * predicate, so this side cannot drift from the server's answer.
 */
export const useIsWorkflowSavePermissive = (): boolean => {
  const { data: form } = useAdminForm()
  const isRedesignEnabled = useIsWorkflowBuilderRedesign()

  return !mustWorkflowBeComplete({
    formStatus: form?.status,
    isRedesignEnabled,
  })
}
