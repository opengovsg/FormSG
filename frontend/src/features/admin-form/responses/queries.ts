import { useQuery, UseQueryResult } from 'react-query'
import { useParams } from 'react-router-dom'

import { adminFormKeys } from '../common/queries'

import { countFormSubmissions } from './AdminSubmissionsService'

export const adminFormResponsesKeys = {
  base: [...adminFormKeys.base, 'responses'] as const,
  id: (id: string) => [...adminFormResponsesKeys.base, id] as const,
}

/**
 * @precondition Must be wrapped in a Router as `useParam` is used.
 */
export const useFormResponsesCount = (): UseQueryResult<number> => {
  const { formId } = useParams<{ formId: string }>()
  return useQuery(
    adminFormResponsesKeys.id(formId),
    () => countFormSubmissions({ formId }),
    { staleTime: 10 * 60 * 1000 },
  )
}
