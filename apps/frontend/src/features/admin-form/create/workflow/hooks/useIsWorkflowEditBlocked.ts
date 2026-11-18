import { FormStatus } from 'formsg-shared/types'

import { useAdminForm } from '~features/admin-form/common/queries'

export const useIsWorkflowEditBlocked = (): boolean => {
  const { data: form } = useAdminForm()

  return form?.status === FormStatus.Public
}
