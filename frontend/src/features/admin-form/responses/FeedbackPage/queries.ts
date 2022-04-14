import { useQuery, UseQueryResult } from 'react-query'
import { useParams } from 'react-router-dom'

import { FormFeedbackDto } from '~shared/types/form'

import { adminFormKeys } from '../../common/queries'

import { getFormFeedback } from './FeedbackService'

export const adminFormFeedbackKeys = {
  base: [...adminFormKeys.base, 'feedback'] as const,
  id: (id: string) => [...adminFormFeedbackKeys.base, id] as const,
}

/**
 * @precondition Must be wrapped in a Router as `useParam` is used.
 */
export const useFormFeedback = (): UseQueryResult<FormFeedbackDto> => {
  const { formId } = useParams()
  if (!formId) throw new Error('No formId provided')

  return useQuery(
    adminFormFeedbackKeys.id(formId),
    () => getFormFeedback({ formId }),
    { staleTime: 10 * 60 * 1000 },
  )
}
