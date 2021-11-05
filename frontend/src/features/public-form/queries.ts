import { useQuery, UseQueryResult } from 'react-query'
import { useParams } from 'react-router-dom'

import { PublicFormViewDto } from '~shared/types/form/form'

import { ApiError } from '~typings/core'

import { getPublicFormView } from './PublicFormService'

const publicFormKeys = {
  // All keys map to either an array or function returning an array for
  // consistency
  base: ['publicForm'] as const,
  id: (formId: string) => [...publicFormKeys.base, formId] as const,
}

export const usePublicFormView = (): UseQueryResult<
  PublicFormViewDto,
  ApiError
> => {
  const { formId } = useParams()
  if (!formId) throw new Error('No formId provided')

  return useQuery<PublicFormViewDto, ApiError>(publicFormKeys.id(formId), () =>
    getPublicFormView(formId),
  )
}

export const usePublicForm = () => {
  const { data, ...rest } = usePublicFormView()
  return {
    data: data?.form,
    ...rest,
  }
}
