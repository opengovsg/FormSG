import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'

import { useToast } from '~hooks/useToast'

import { getDecryptedSubmissionById } from '../AdminSubmissionsService'
import { adminFormResponsesKeys } from '../queries'
import { useStorageResponsesContext } from '../ResponsesPage/storage'

/**
 * @precondition Must be wrapped in a Router as `useParam` is used.
 */
export const useIndividualSubmission = () => {
  const toast = useToast({
    status: 'danger',
  })

  const { formId, submissionId } = useParams()
  if (!formId || !submissionId) {
    throw new Error('No formId or submissionId provided')
  }

  const { secretKey } = useStorageResponsesContext()

  return useQuery(
    adminFormResponsesKeys.individual(formId, submissionId),
    () => getDecryptedSubmissionById({ formId, submissionId, secretKey }),
    {
      // Will never update once fetched.
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
