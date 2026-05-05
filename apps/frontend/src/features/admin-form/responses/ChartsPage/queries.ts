import { useQuery, UseQueryResult } from 'react-query'
import { useParams } from 'react-router-dom'
import { DecryptedContent } from '@opengovsg/formsg-sdk'

import { DateString } from 'formsg-shared/types'

import { useToast } from '~hooks/useToast'

import { getAllDecryptedSubmission } from '../AdminSubmissionsService'
import { adminFormResponsesKeys } from '../queries'
import { useStorageResponsesContext } from '../ResponsesPage/storage'

import { CHART_MAX_SUBMISSION_RESULTS } from './constants'

/**
 * @precondition Must be wrapped in a Router as `useParam` is used.
 */
export const useAllSubmissionData = (
  dateRange?: DateString[],
): UseQueryResult<DecryptedContent[]> => {
  const [startDate, endDate] = dateRange ?? []
  const toast = useToast({
    status: 'danger',
  })

  const { formId } = useParams()
  if (!formId) {
    throw new Error('No formId or submissionId provided')
  }

  const { secretKey } = useStorageResponsesContext()
  if (!secretKey) {
    throw new Error('No secret key provided')
  }

  return useQuery(
    [adminFormResponsesKeys.id(formId), dateRange],
    () =>
      getAllDecryptedSubmission({
        formId,
        secretKey,
        startDate,
        endDate,
        downloadAttachments: false,
        isSortByLatest: true,
        limit: CHART_MAX_SUBMISSION_RESULTS,
      }),
    {
      // Will never update once fetched, unless daterange changes
      staleTime: Infinity,
      enabled: !!secretKey,
      onError: (e) => {
        toast({
          description: String(e),
        })
      },
    },
  )
}
