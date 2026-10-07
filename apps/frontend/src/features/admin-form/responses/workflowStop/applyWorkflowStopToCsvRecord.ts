import { MRF_STATUS } from '../common/utils/mrfSubmissionView'
import {
  MRF_PENDING_RESPONSE_AT_LABEL,
  MRF_WORKFLOW_STATUS_LABEL,
} from '../constants'
import { DecryptedSubmissionData } from '../ResponsesPage/storage/types'

import { getWorkflowStop } from './previewStore'

/**
 * Makes a stopped submission's CSV row read "Stopped" instead of "Pending",
 * with no pending step, matching the results table and drawer.
 *
 * Runs on the main thread because CSV rows are built in a web worker, which
 * cannot read the design-preview store.
 * TODO(workflow-stop): once the backend returns the stop on the submission
 * metadata, set this inside CsvRecord and delete this helper.
 */
export const applyWorkflowStopToCsvRecord = (
  submissionData: DecryptedSubmissionData,
): DecryptedSubmissionData => {
  if (!submissionData.mrfMeta) return submissionData
  if (!getWorkflowStop(submissionData.submissionId)) {
    return submissionData
  }

  return {
    ...submissionData,
    record: submissionData.record.map((column) => {
      const { _id, question, fieldType } = column
      // Both columns are single-answer text columns written by CsvRecord.
      switch (question) {
        case MRF_WORKFLOW_STATUS_LABEL:
          return { _id, question, fieldType, answer: MRF_STATUS.STOPPED }
        case MRF_PENDING_RESPONSE_AT_LABEL:
          return { _id, question, fieldType, answer: '-' }
        default:
          return column
      }
    }),
  }
}
