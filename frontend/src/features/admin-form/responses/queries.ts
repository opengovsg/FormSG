import { useQuery, UseQueryResult } from 'react-query'
import { useParams } from 'react-router-dom'

import { FormFeedbackMetaDto } from '~shared/types'
import { StorageModeSubmissionMetadataList } from '~shared/types/submission'

import { adminFormKeys } from '../common/queries'

import { getFormFeedback } from './FeedbackPage/FeedbackService'
import {
  countFormSubmissions,
  getFormSubmissionsMetadata,
} from './AdminSubmissionsService'

export const adminFormResponsesKeys = {
  base: [...adminFormKeys.base, 'responses'] as const,
  id: (id: string) => [...adminFormResponsesKeys.base, id] as const,
  count: (id: string) => [...adminFormResponsesKeys.id(id), 'count'] as const,
}

export const adminFormFeedbackKeys = {
  base: [...adminFormKeys.base, 'feedback'] as const,
  id: (id: string) => [...adminFormFeedbackKeys.base, id] as const,
}

/**
 * @precondition Must be wrapped in a Router as `useParam` is used.
 */
export const useFormResponsesCount = (): UseQueryResult<number> => {
  const { formId } = useParams()
  if (!formId) throw new Error('No formId provided')

  return useQuery(adminFormResponsesKeys.count(formId), () =>
    countFormSubmissions({ formId }),
  )
}

/**
 * @precondition Must be wrapped in a Router as `useParam` is used.
 */
export const useFormResponses =
  (): UseQueryResult<StorageModeSubmissionMetadataList> => {
    const { formId } = useParams()
    if (!formId) throw new Error('No formId provided')

    return useQuery(
      adminFormResponsesKeys.id(formId),
      () => getFormSubmissionsMetadata(formId),
      { staleTime: 10 * 60 * 1000 },
    )
  }

/**
 * @precondition Must be wrapped in a Router as `useParam` is used.
 */
export const useFormFeedback = (): UseQueryResult<FormFeedbackMetaDto> => {
  const { formId } = useParams()
  if (!formId) throw new Error('No formId provided')

  return useQuery(adminFormFeedbackKeys.id(formId), () =>
    getFormFeedback(formId),
  )
}
