import { FormField } from '@opengovsg/formsg-sdk/dist/types'

const MAX_ANSWER_LENGTH = 50

/**
 * PROTOTYPE (attachments-v2): names a response's folder in the bulk download
 * zip, e.g. "Tan Ah Kow - RefNo 6a98…". Falls back to "RefNo 6a98…".
 */
export const getResponseFolderName = ({
  submissionId,
  responses,
  fieldId,
}: {
  submissionId: string
  responses?: FormField[]
  fieldId?: string
}): string => {
  const refNo = `RefNo ${submissionId}`
  const answer = (responses?.find((r) => r._id === fieldId)?.answer ?? '')
    // Characters Windows or macOS won't allow in a file or folder name.
    .replace(/[/\\:*?"<>|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    // Keeps paths well inside Windows' 260-character limit.
    .slice(0, MAX_ANSWER_LENGTH)
    .trim()
  return answer ? `${answer} - ${refNo}` : refNo
}
