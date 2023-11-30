import { useQuery, UseQueryResult } from 'react-query'
import { useParams } from 'react-router-dom'

import { StorageModeSubmissionDto } from '~shared/types'

import { ApiError } from '~typings/core'

import {
  decryptSubmission,
  getEncryptedSubmissionById,
} from './PublicFormEditService'

/**
 * @precondition Must be wrapped in a Router as `useParam` is used.
 */
export const useEncryptedSubmission = (): UseQueryResult<
  StorageModeSubmissionDto | undefined,
  ApiError
> => {
  const { formId, submissionId } = useParams()
  if (!formId) {
    throw new Error('No formId provided')
  }

  return useQuery([formId, submissionId, 'encrypted'], () =>
    submissionId
      ? getEncryptedSubmissionById({ formId, submissionId })
      : undefined,
  )
}

/**
 * @precondition Must be wrapped in a Router as `useParam` is used.
 */
export const useDecryptedSubmission = (secretKey?: string) => {
  const { data } = useEncryptedSubmission()

  const { formId, submissionId } = useParams()

  return useQuery(
    [formId, submissionId, 'decrypted'],
    () => decryptSubmission({ submission: data, secretKey }),
    { enabled: !!secretKey },
  )
}
