import { FormResponseMode } from '~shared/types'

import { useAdminForm } from '~features/admin-form/common/queries'

export const useAdminFormWorkflow = () => {
  const { data: form, isLoading } = useAdminForm()

  return {
    isLoading,
    formFields: form?.form_fields,
    formWorkflow:
      form?.responseMode !== FormResponseMode.Multirespondent
        ? undefined
        : form?.workflow,
  }
}
