import { useQuery } from 'react-query'
import { useParams } from 'react-router-dom'
import { useFeatureIsOn } from '@growthbook/growthbook-react'

import { featureFlags } from 'formsg-shared/constants'
import { FormResponseMode } from 'formsg-shared/types'

import { useToast } from '~hooks/useToast'

import { useAdminForm } from '~features/admin-form/common/queries'

import { getDecryptedSubmissionById } from '../AdminSubmissionsService'
import { adminFormResponsesKeys } from '../queries'
import { useStorageResponsesContext } from '../ResponsesPage/storage'

/**
 * @precondition Must be wrapped in a Router as `useParam` is used.
 */
export const useIndividualSubmission = () => {
  const { formId, submissionId } = useParams()

  if (!formId || !submissionId) {
    throw new Error('No formId or submissionId provided')
  }

  return useGetIndividualDecryptedSubmission({ formId, submissionId })
}

export const useGetIndividualDecryptedSubmission = ({
  formId,
  submissionId,
}: {
  formId: string
  submissionId: string
}) => {
  const toast = useToast({
    status: 'danger',
  })
  const { secretKey } = useStorageResponsesContext()
  const { data: { responseMode } = {} } = useAdminForm()
  const useV4 = useFeatureIsOn(featureFlags.answerObjectDecryption)

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
