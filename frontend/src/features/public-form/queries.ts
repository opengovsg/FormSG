import { useQuery, UseQueryResult } from 'react-query'
import { useParams } from 'react-router-dom'

import { PublicFormViewDto } from '~shared/types/form/form'

import { ApiError } from '~typings/core'

import { PublicFormParam } from '~constants/routes'

import { getPublicFormView } from './PublicFormService'

const publicFormKeys = {
  base: ['publicForm'] as const,
  id: (formId: string) => [...publicFormKeys.base, formId] as const,
}

export const usePublicFormView = (): UseQueryResult<
  PublicFormViewDto,
  ApiError
> => {
  const { formId } = useParams<PublicFormParam>()

  return useQuery<PublicFormViewDto, ApiError>(publicFormKeys.id(formId), () =>
    getPublicFormView(formId),
  )
}
