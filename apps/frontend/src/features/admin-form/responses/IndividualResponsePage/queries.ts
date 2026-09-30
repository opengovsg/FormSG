import { useQuery } from 'react-query'
import { useParams } from 'react-router-dom'

import { FormResponseMode } from 'formsg-shared/types'

import { useToast } from '~hooks/useToast'

import { useAdminForm } from '~features/admin-form/common/queries'

import { getDecryptedSubmissionById } from '../AdminSubmissionsService'
import { individualFor, localQuery } from '../prototype/adapters'
import { isWorkflowPrototype } from '../prototype/config'
import { useOptionalPrototypeStore } from '../prototype/context'
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
  const prototype = useOptionalPrototypeStore()
  const toast = useToast({
    status: 'danger',
  })
  const { secretKey } = useStorageResponsesContext()
  const { data: { responseMode } = {} } = useAdminForm()

  const query = useQuery(
    adminFormResponsesKeys.individual(formId, submissionId),
    () => getDecryptedSubmissionById({ formId, submissionId, secretKey }),
    {
      staleTime:
        responseMode === FormResponseMode.Multirespondent
          ? // For MRFs, will always fetch the response.
            0
          : // Otherwise, response Will never update once fetched.
            Infinity,
      enabled: !isWorkflowPrototype && !!secretKey,
      onError: (e) => {
        toast({
          description: String(e),
        })
      },
    },
  )
  const response = prototype?.responses.find((r) => r.id === submissionId)
  return response ? localQuery(query, individualFor(response)) : query
}
