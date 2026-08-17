import { mustWorkflowBeComplete } from 'formsg-shared/utils/workflow-step-completion'

import { useAdminForm } from '~features/admin-form/common/queries'

import { useIsWorkflowBuilderRedesign } from './useIsWorkflowBuilderRedesign'

/**
 * Whether a half-built workflow step may be saved as-is (FRM-2489).
 *
 * Two conditions. Whether the *form* may hold an incomplete workflow is the
 * server's call, deferred to here through the shared policy. The redesign flag
 * is an additional client-side condition: the old builder keeps its existing
 * inline validation, so rolling the flag back restores the old editing
 * experience even though the server would still accept the save.
 */
export const useIsWorkflowSavePermissive = (): boolean => {
  const { data: form } = useAdminForm()
  const isRedesignEnabled = useIsWorkflowBuilderRedesign()

  return (
    isRedesignEnabled && !mustWorkflowBeComplete({ formStatus: form?.status })
  )
}
