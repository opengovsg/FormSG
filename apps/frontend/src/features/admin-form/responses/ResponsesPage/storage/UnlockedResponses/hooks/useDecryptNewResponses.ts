import { useEffect, useRef } from 'react'
import { useQueryClient } from 'react-query'
import { useParams } from 'react-router-dom'
import type { FormField } from '@opengovsg/formsg-sdk/dist/types'

import { SubmissionMetadata } from 'formsg-shared/types'

import { getDecryptedSubmissionById } from '~features/admin-form/responses/AdminSubmissionsService'
import { adminFormResponsesKeys } from '~features/admin-form/responses/queries'

import { useStorageResponsesContext } from '../../StorageResponsesContext'

/**
 * Past this many new responses, decrypting the table again in bulk is cheaper
 * than fetching each one.
 */
export const MAX_NEW_RESPONSES_TO_DECRYPT_ONE_BY_ONE = 20

/** Rows the table lists that the decrypted answers do not have yet. */
export const getUndecryptedSubmissionIds = (
  metadata: Pick<SubmissionMetadata, 'refNo'>[],
  decrypted: Map<string, unknown> | undefined,
  alreadyTried: Set<string>,
): string[] =>
  decrypted
    ? metadata
        .map(({ refNo }) => refNo)
        .filter((refNo) => !decrypted.has(refNo) && !alreadyTried.has(refNo))
    : []

/**
 * The table's rows refetch whenever the admin returns to the tab, but its
 * answers are decrypted once, so a response submitted since then shows as an
 * empty row. Decrypts just those responses, as the response drawer does, and
 * adds them to the table's answers.
 */
export const useDecryptNewResponses = ({
  metadata,
  isDecryptingAll,
  enabled,
}: {
  metadata: SubmissionMetadata[]
  isDecryptingAll: boolean
  enabled: boolean
}): void => {
  const { formId } = useParams()
  const { secretKey, dateRange } = useStorageResponsesContext()
  const queryClient = useQueryClient()
  // A response that fails to decrypt is not retried on every refetch.
  const alreadyTried = useRef(new Set<string>())

  useEffect(() => {
    if (!enabled || !formId || !secretKey || isDecryptingAll) return

    const queryKey = adminFormResponsesKeys.decryptedResponses(
      formId,
      dateRange,
    )
    const newIds = getUndecryptedSubmissionIds(
      metadata,
      queryClient.getQueryData<Map<string, FormField[]>>(queryKey),
      alreadyTried.current,
    )
    if (newIds.length === 0) return

    if (newIds.length > MAX_NEW_RESPONSES_TO_DECRYPT_ONE_BY_ONE) {
      void queryClient.invalidateQueries(queryKey)
      return
    }

    newIds.forEach((submissionId) => {
      alreadyTried.current.add(submissionId)
      void getDecryptedSubmissionById({ formId, submissionId, secretKey })
        .then((submission) => {
          if (!submission) return
          queryClient.setQueryData<Map<string, FormField[]>>(
            queryKey,
            (current) =>
              new Map(current).set(submissionId, submission.responses),
          )
        })
        .catch(() => undefined)
    })
  }, [
    dateRange,
    enabled,
    formId,
    isDecryptingAll,
    metadata,
    queryClient,
    secretKey,
  ])
}
