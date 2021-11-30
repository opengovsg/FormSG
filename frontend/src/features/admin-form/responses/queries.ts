import { useQuery, UseQueryResult } from 'react-query'
import { useParams } from 'react-router-dom'

import { adminFormKeys } from '../common/queries'

import {
  countFormSubmissions,
  getFormSubmissionsMetadata,
} from './AdminSubmissionsService'

export const adminFormResponsesKeys = {
  base: [...adminFormKeys.base, 'responses'] as const,
  id: (id: string) => [...adminFormResponsesKeys.base, id] as const,
  count: (id: string) => [...adminFormResponsesKeys.base, id, 'count'] as const,
}

/**
 * @precondition Must be wrapped in a Router as `useParam` is used.
 */
export const useFormResponsesCount = (): UseQueryResult<number> => {
  const { formId } = useParams()
  if (!formId) throw new Error('No formId provided')

  return useQuery(
    adminFormResponsesKeys.count(formId),
    () => countFormSubmissions({ formId }),
    { staleTime: 10 * 60 * 1000 },
  )
}

/**
 * @precondition Must be wrapped in a Router as `useParam` is used.
 */
export const useFormResponses = (): UseQueryResult<any> => {
  const { formId } = useParams()
  if (!formId) throw new Error('No formId provided')

  return useQuery(
    adminFormResponsesKeys.id(formId),
    () => getFormSubmissionsMetadata(formId),
    { staleTime: 10 * 60 * 1000 },
  )
}

export const downloadResponses = (formId: string, secretKey: string): any => {
  return ['Here']
}
