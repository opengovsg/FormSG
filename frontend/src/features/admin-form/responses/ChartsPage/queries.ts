import { useQuery } from 'react-query'
import { useParams } from 'react-router-dom'
import { useToast } from '@opengovsg/design-system-react'

import { DateString } from '~shared/types'

import { getAllDecryptedSubmission } from '../AdminSubmissionsService'
import { adminFormResponsesKeys } from '../queries'
import { useStorageResponsesContext } from '../ResponsesPage/storage'

/**
 * @precondition Must be wrapped in a Router as `useParam` is used.
 */
export const useAllSubmissionData = (dateRange?: DateString[]) => {
  const [startDate, endDate] = dateRange ?? []
  const toast = useToast({
    status: 'error',
  })

  const { formId } = useParams()
  if (!formId) {
    throw new Error('No formId or submissionId provided')
  }

  const { secretKey } = useStorageResponsesContext()

  return useQuery(
    [adminFormResponsesKeys.id(formId), dateRange],
    () => getAllDecryptedSubmission({ formId, secretKey, startDate, endDate }),
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
