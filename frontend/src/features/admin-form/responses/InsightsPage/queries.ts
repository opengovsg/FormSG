import { useQuery } from 'react-query'
import { useParams } from 'react-router-dom'

import { useToast } from '~hooks/useToast'

import { getAllEncryptedSubmission } from '../AdminSubmissionsService'
import { adminFormResponsesKeys } from '../queries'
import { useStorageResponsesContext } from '../ResponsesPage/storage'

/**
 * @precondition Must be wrapped in a Router as `useParam` is used.
 */
export const useAllSubmissionData = () => {
  const toast = useToast({
    status: 'danger',
  })

  const { formId } = useParams()
  if (!formId) {
    throw new Error('No formId or submissionId provided')
  }

  const { secretKey } = useStorageResponsesContext()

  return useQuery(
    adminFormResponsesKeys.id(formId),
    () => getAllEncryptedSubmission({ formId }),
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
