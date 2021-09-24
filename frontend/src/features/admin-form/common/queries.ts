import { useQuery, UseQueryResult } from 'react-query'
import { useParams } from 'react-router-dom'

import { AdminFormDto } from '~shared/types/form/form'

import { ApiError } from '~typings/core'

import { getAdminFormView } from './AdminViewFormService'

const adminFormKeys = {
  base: ['adminForm'] as const,
  id: (id: string) => ['adminForm', id] as const,
}

/**
 * @precondition Must be wrapped in a Router as `useParam` is used.
 */
export const useAdminForm = (): UseQueryResult<AdminFormDto, ApiError> => {
  const { formId } = useParams<{ formId: string }>()
  return useQuery(adminFormKeys.id(formId), () => getAdminFormView(formId))
}
