import { mustWorkflowBeComplete } from 'formsg-shared/utils/workflow-step-completion'

import { useAdminForm } from '~features/admin-form/common/queries'

import { useIsWorkflowBuilderRedesign } from './useIsWorkflowBuilderRedesign'

/**
 * Whether a half-built workflow step may be saved as-is (FRM-2489). Defers to
 * the shared server policy, gated additionally on the redesign flag being on.
 */
export const useIsWorkflowSavePermissive = (): boolean => {
  const { data: form } = useAdminForm()
  const isRedesignEnabled = useIsWorkflowBuilderRedesign()

  return (
    isRedesignEnabled && !mustWorkflowBeComplete({ formStatus: form?.status })
  )
}
