import { mustWorkflowBeComplete } from 'formsg-shared/utils/workflow-step-completion'

import { useAdminForm } from '~features/admin-form/common/queries'

export const useIsWorkflowSavePermissive = (): boolean => {
  const { data: form } = useAdminForm()

  return !mustWorkflowBeComplete({ formStatus: form?.status })
}
