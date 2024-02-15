import moment from 'moment'
import { err, ok, Result } from 'neverthrow'

import {
  BasicField,
  FieldResponsesV3,
  FormWorkflowDto,
  MultirespondentSubmissionDto,
  SubmissionType,
  WorkflowType,
} from '../../../../../shared/types'
import { MultirespondentSubmissionData } from '../../../../types'
import { InvalidWorkflowTypeError } from '../submission.errors'

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
    workflow: submissionData.workflow,

    submissionPublicKey: submissionData.submissionPublicKey,
    encryptedContent: submissionData.encryptedContent,
    encryptedSubmissionSecretKey: submissionData.encryptedSubmissionSecretKey,
    attachmentMetadata: attachmentPresignedUrls,
    version: submissionData.version,
    workflowStep: submissionData.workflowStep,
  }
}

export const retrieveWorkflowStepEmailAddresses = (
  formWorkflow: FormWorkflowDto,
  nextWorkflowStep: number,
  responses: FieldResponsesV3,
): Result<string[], InvalidWorkflowTypeError> => {
  const step = formWorkflow[nextWorkflowStep]
  if (!step) return ok([]) // Not an error, just that the form has gone past its predefined workflow
  switch (step.workflow_type) {
    case WorkflowType.Static: {
      return ok(step.emails)
    }
    case WorkflowType.Dynamic: {
      const field = responses[step.field]
      if (!field || field.fieldType !== BasicField.Email) return ok([]) // Also not an error, just misconfigured
      return ok([field.answer.value])
    }
    default: {
      return err(new InvalidWorkflowTypeError())
    }
  }
}
