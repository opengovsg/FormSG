import { useQuery } from 'react-query'
import { useParams } from 'react-router-dom'

import { useToast } from '~hooks/useToast'

import { useUser } from '~features/user/queries'

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
  const { user } = useUser()
  const displayWorkflow = user?.betaFlags?.mrf

  if (!formId || !submissionId) {
    throw new Error('No formId or submissionId provided')
  }

  const { secretKey } = useStorageResponsesContext()

  return useQuery(
    adminFormResponsesKeys.individual(formId, submissionId),
    () => getDecryptedSubmissionById({ formId, submissionId, secretKey }),
    {
      // For users with MRF enabled, will always fetch the response. Otherwise, response Will never update once fetched.
      staleTime: displayWorkflow ? 0 : Infinity,
      enabled: !!secretKey,
      onError: (e) => {
        toast({
          description: String(e),
        })
      },
    },
  )
}
