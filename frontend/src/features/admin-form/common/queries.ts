import { useQuery, UseQueryResult } from 'react-query'
import { useParams } from 'react-router-dom'

import { AdminFormDto } from '~shared/types/form/form'

import { ApiError } from '~typings/core'

import { getAdminFormView, getFreeSmsQuota } from './AdminViewFormService'

export const adminFormKeys = {
  base: ['adminForm'] as const,
  id: (id: string) => ['adminForm', id] as const,
  freeSmsCount: (id: string) =>
    [...adminFormKeys.id(id), 'freeSmsCount'] as const,
}

/**
 * @precondition Must be wrapped in a Router as `useParam` is used.
 */
export const useAdminForm = (): UseQueryResult<AdminFormDto, ApiError> => {
  const { formId } = useParams()
  if (!formId) throw new Error('No formId provided')

  return useQuery(adminFormKeys.id(formId), () => getAdminFormView(formId))
}

export const useFreeSmsQuota = () => {
  const { formId } = useParams()
  if (!formId) throw new Error('No formId provided')

  return useQuery(adminFormKeys.freeSmsCount(formId), () =>
    getFreeSmsQuota(formId),
  )
}
