import { useQuery, UseQueryResult } from 'react-query'
import { useParams } from 'react-router-dom'

import { PublicFormViewDto } from '~shared/types/form/form'

import { getPublicFormView } from './PublicFormService'

const publicFormKeys = {
  base: ['publicForm'] as const,
  id: (formId: string) => [...publicFormKeys.base, formId] as const,
}

export const usePublicFormView = (): UseQueryResult<PublicFormViewDto> => {
  const { formId } = useParams<{ formId: string }>()

  return useQuery<PublicFormViewDto>(publicFormKeys.id(formId), () =>
    getPublicFormView(formId),
  )
}
