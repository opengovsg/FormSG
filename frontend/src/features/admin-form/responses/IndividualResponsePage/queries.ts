import { useQuery } from 'react-query'
import { useParams } from 'react-router-dom'

import { FormResponseMode } from '~shared/types'

import { useToast } from '~hooks/useToast'

import { useAdminForm } from '~features/admin-form/common/queries'

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
  const { data: { responseMode } = {} } = useAdminForm()

  if (!formId || !submissionId) {
    throw new Error('No formId or submissionId provided')
  }

  const { secretKey } = useStorageResponsesContext()

  return useQuery(
    adminFormResponsesKeys.individual(formId, submissionId),
    () => getDecryptedSubmissionById({ formId, submissionId, secretKey }),
    {
      staleTime:
        responseMode === FormResponseMode.Multirespondent
          ? // For MRFs, will always fetch the response.
            0
          : // Otherwise, response Will never update once fetched.
            Infinity,
      enabled: !!secretKey,
      onError: (e) => {
        toast({
          description: String(e),
        })
      },
    },
  )
}
