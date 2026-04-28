import { useQuery } from 'react-query'
import { useParams } from 'react-router-dom'

import { FormResponseMode } from 'formsg-shared/types'

import { useToast } from '~hooks/useToast'

import { useAdminForm } from '~features/admin-form/common/queries'

import { getDecryptedSubmissionById } from '../AdminSubmissionsService'
import { adminFormResponsesKeys } from '../queries'
import { useStorageResponsesContext } from '../ResponsesPage/storage'

/**
 * @precondition Must be wrapped in a Router as `useParam` is used.
 */
export const useIndividualSubmission = ({
  useV4,
}: { useV4?: boolean } = {}) => {
  const { formId, submissionId } = useParams()

  if (!formId || !submissionId) {
    throw new Error('No formId or submissionId provided')
  }

  return useGetIndividualDecryptedSubmission({ formId, submissionId, useV4 })
}

export const useGetIndividualDecryptedSubmission = ({
  formId,
  submissionId,
  useV4,
}: {
  formId: string
  submissionId: string
  useV4?: boolean
}) => {
  const toast = useToast({
    status: 'danger',
  })
  const { secretKey } = useStorageResponsesContext()
  const { data: { responseMode } = {} } = useAdminForm()

  return useQuery(
    adminFormResponsesKeys.individual(formId, submissionId, useV4),
    () =>
      getDecryptedSubmissionById({ formId, submissionId, secretKey, useV4 }),
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
