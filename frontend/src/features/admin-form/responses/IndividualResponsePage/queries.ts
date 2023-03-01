import { useQuery } from 'react-query'
import { useParams } from 'react-router-dom'

import { useToast } from '~hooks/useToast'

import {
  getDecryptedSubmissionById,
  getPaymentSubmissionBySubmissionId,
} from '../AdminSubmissionsService'
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

/**
 * @precondition Must be wrapped in a Router as `useParam` is used.
 */
export const useIndividualPaymentSubmission = () => {
  const toast = useToast({
    status: 'danger',
  })

  const { formId, submissionId } = useParams()
  if (!formId || !submissionId) {
    throw new Error('No formId or submissionId provided')
  }

  const { secretKey } = useStorageResponsesContext()

  return useQuery(
    adminFormResponsesKeys.payment(formId, submissionId),
    () => getPaymentSubmissionBySubmissionId({ formId, submissionId }),
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
