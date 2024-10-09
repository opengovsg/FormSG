import moment from 'moment'
import { err, ok, Result } from 'neverthrow'

import {
  BasicField,
  FieldResponsesV3,
  FormWorkflowStepDto,
  MultirespondentSubmissionDto,
  SubmissionType,
  WorkflowType,
} from '../../../../../shared/types'
import {
  FormFieldSchema,
  MultirespondentSubmissionData,
} from '../../../../types'
import { ParsedClearFormFieldResponsesV3 } from '../../../../types/api'
import { validateFieldV3 } from '../../../utils/field-validation'
import { FieldIdSet } from '../../../utils/logic-adaptor'
import {
  InvalidWorkflowTypeError,
  ProcessingError,
  ValidateFieldError,
} from '../submission.errors'

/**
 * Creates and returns a MultirespondentSubmissionDto object from submissionData and
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
    mrfVersion: submissionData.mrfVersion,
  }
}

export const retrieveWorkflowStepEmailAddresses = (
  step: FormWorkflowStepDto,
  responses: FieldResponsesV3,
): Result<string[], InvalidWorkflowTypeError> => {
  if (!step) return ok([]) // Not an error, just that the form has gone past its predefined workflow
  switch (step.workflow_type) {
    case WorkflowType.Static: {
      return ok(step.emails)
    }
    case WorkflowType.Dynamic: {
      const field = responses[step.field]
      if (!field || field.fieldType !== BasicField.Email) return ok([]) // Not an error, misconfigured or respondent has not filled.
      return ok([field.answer.value])
    }
    default: {
      return err(new InvalidWorkflowTypeError())
    }
  }
}

/**
 * Validates each field by individual field rules.
 * @param formId formId, used for logging
 * @param formFields all form fields in the form. Purpose: used to validate responses against the form field properties.
 * @param responses responses to validate
 * @returns initial responses if all responses are valid, else an error.
 */
export const validateMrfFieldResponses = ({
  formId,
  visibleFieldIds,
  formFields,
  responses,
}: {
  formId: string
  visibleFieldIds: FieldIdSet
  formFields: FormFieldSchema[]
  responses: ParsedClearFormFieldResponsesV3
}): Result<
  ParsedClearFormFieldResponsesV3,
  ValidateFieldError | ProcessingError
> => {
  const idToFieldMap = formFields.reduce<{
    [fieldId: string]: FormFieldSchema
  }>((acc, field) => {
    acc[field._id] = field
    return acc
  }, {})

  for (const [responseId, response] of Object.entries(responses)) {
    const formField = idToFieldMap[responseId]
    if (!formField) {
      return err(
        new ProcessingError('Response Id does not match form field Ids'),
      )
    }

    // Since Myinfo fields are not currently supported for MRF
    if (response.fieldType === BasicField.Children) {
      return err(
        new ValidateFieldError(
          'Children field type is not supported for MRF submisisons',
        ),
      )
    }

    const validateFieldV3Result = validateFieldV3({
      formId,
      formField,
      response,
      isVisible: visibleFieldIds.has(responseId),
    })
    if (validateFieldV3Result.isErr()) {
      return err(validateFieldV3Result.error)
    }
  }

  return ok(responses)
}
