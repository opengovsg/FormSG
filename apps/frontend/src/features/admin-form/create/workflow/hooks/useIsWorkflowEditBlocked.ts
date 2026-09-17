import { FormStatus } from 'formsg-shared/types'

import { useAdminForm } from '~features/admin-form/common/queries'

import { useIsWorkflowBuilderRedesign } from './useIsWorkflowBuilderRedesign'

export const useIsWorkflowEditBlocked = (): boolean => {
  const { data: form } = useAdminForm()
  const isRedesign = useIsWorkflowBuilderRedesign()

  return isRedesign && form?.status === FormStatus.Public
}
