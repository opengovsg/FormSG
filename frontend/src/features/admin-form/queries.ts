import { useQuery } from 'react-query'

import { getAdminFormView } from './AdminViewFormService'

const adminFormKeys = {
  base: ['adminForm'] as const,
  id: (id: string) => ['adminForm', id] as const,
}

export const useAdminForm = (formId: string) => {
  return useQuery(adminFormKeys.id(formId), () => getAdminFormView(formId))
}
