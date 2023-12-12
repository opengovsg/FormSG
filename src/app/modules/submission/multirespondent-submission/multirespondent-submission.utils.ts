import moment from 'moment'

import {
  MultirespondentSubmissionDto,
  SubmissionType,
} from '../../../../../shared/types'
import { MultirespondentSubmissionData } from '../../../../types'

/**
 * Creates and returns a StorageModeSubmissionDto object from submissionData and
 * attachment presigned urls.
 */
export const createMultirespondentSubmissionDto = (
  submissionData: MultirespondentSubmissionData,
  attachmentPresignedUrls: Record<string, string>,
): MultirespondentSubmissionDto => {
  return {
    submissionType: SubmissionType.Multirespondent,
    refNo: submissionData._id,
    submissionTime: moment(submissionData.created)
      .tz('Asia/Singapore')
      .format('ddd, D MMM YYYY, hh:mm:ss A'),

    form_fields: submissionData.form_fields,
    form_logics: submissionData.form_logics,

    submissionPublicKey: submissionData.submissionPublicKey,
    encryptedContent: submissionData.encryptedContent,
    encryptedSubmissionSecretKey: submissionData.encryptedSubmissionSecretKey,
    attachmentMetadata: attachmentPresignedUrls,
    version: submissionData.version,
  }
}
