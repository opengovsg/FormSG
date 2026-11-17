import { useEffect, useMemo, useRef, useState } from 'react'
import { useQueryClient } from 'react-query'
import { useParams } from 'react-router'
import type { FormField } from '@opengovsg/formsg-sdk/dist/types'

import { SubmissionMetadata } from 'formsg-shared/types'

import { getDecryptedSubmissionById } from '~features/admin-form/responses/AdminSubmissionsService'
import {
  adminFormResponsesKeys,
  updateDecryptedResponsesCache,
} from '~features/admin-form/responses/queries'

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
}): { isError: boolean } => {
  const { formId } = useParams()
  const { secretKey, dateRange } = useStorageResponsesContext()
  const queryClient = useQueryClient()
  // A response that fails to decrypt is not retried on every refetch.
  const dateScope = JSON.stringify(dateRange)
  const scope = useMemo(
    () => ({ tried: new Set<string>() }),
    // Retry independently when the form, key, or date scope changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [formId, secretKey, dateScope],
  )
  const activeScope = useRef(scope)
  activeScope.current = scope
  const [failures, setFailures] = useState<{
    scope: typeof scope
    ids: Set<string>
  }>()

  useEffect(() => {
    if (!enabled || !formId || !secretKey || isDecryptingAll) return

    const queryKey = adminFormResponsesKeys.decryptedResponses(
      formId,
      dateRange,
    )
    const newIds = getUndecryptedSubmissionIds(
      metadata,
      queryClient.getQueryData<Map<string, FormField[]>>(queryKey),
      scope.tried,
    )
    if (newIds.length === 0) return

    if (newIds.length > MAX_NEW_RESPONSES_TO_DECRYPT_ONE_BY_ONE) {
      // Let configured bulk retries settle. A later explicit refetch can recover.
      if (queryClient.getQueryState(queryKey)?.status === 'error') return
      void queryClient.invalidateQueries(queryKey)
      return
    }

    newIds.forEach((submissionId) => {
      scope.tried.add(submissionId)
      void getDecryptedSubmissionById({ formId, submissionId, secretKey })
        .then((submission) => {
          if (!submission) throw new Error('Response could not be decrypted')
          // A later bulk refresh can replace the cache. Successful rows may
          // need refilling; pending and failed requests remain suppressed.
          scope.tried.delete(submissionId)
          updateDecryptedResponsesCache(queryClient, queryKey, (current) =>
            new Map(current).set(submissionId, submission.responses),
          )
        })
        .catch(() => {
          setFailures((current) => {
            if (activeScope.current !== scope) return current
            return {
              scope,
              ids: new Set(current?.scope === scope ? current.ids : []).add(
                submissionId,
              ),
            }
          })
        })
    })
  }, [
    dateRange,
    enabled,
    formId,
    isDecryptingAll,
    metadata,
    queryClient,
    secretKey,
    scope,
  ])

  const decrypted = formId
    ? queryClient.getQueryData<Map<string, FormField[]>>(
        adminFormResponsesKeys.decryptedResponses(formId, dateRange),
      )
    : undefined

  return {
    isError:
      failures?.scope === scope &&
      metadata.some(
        ({ refNo }) => failures.ids.has(refNo) && !decrypted?.has(refNo),
      ),
  }
}
