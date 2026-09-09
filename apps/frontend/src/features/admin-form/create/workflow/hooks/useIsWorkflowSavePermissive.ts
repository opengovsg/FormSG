import { mustWorkflowBeComplete } from 'formsg-shared/utils/workflow-step-completion'

import { useAdminForm } from '~features/admin-form/common/queries'

import { useIsWorkflowBuilderRedesign } from './useIsWorkflowBuilderRedesign'

export const useIsWorkflowSavePermissive = (): boolean => {
  const { data: form } = useAdminForm()
  const isRedesignEnabled = useIsWorkflowBuilderRedesign()

  return (
    isRedesignEnabled && !mustWorkflowBeComplete({ formStatus: form?.status })
  )
}
