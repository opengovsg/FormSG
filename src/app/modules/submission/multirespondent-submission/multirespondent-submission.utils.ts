import moment from 'moment'
import { err, ok, Result } from 'neverthrow'

import {
  BasicField,
  FieldResponsesV3,
  FormFieldDto,
  FormWorkflowStepDto,
  MultirespondentSubmissionDto,
  PublicMultirespondentSubmissionDto,
  SubmissionType,
  WorkflowType,
} from '../../../../../shared/types'
import { stripDropdownFieldOptionsToRecipientsMap } from '../../../../../shared/utils/strip-dropdown-field-optionsToRecipientsMap'
import { stripWorkflowEmails } from '../../../../../shared/utils/strip-workflow-emails'
import {
  FormFieldSchema,
  MultirespondentSubmissionData,
} from '../../../../types'
import { ParsedClearFormFieldResponsesV3 } from '../../../../types/api'
import { AutoReplyMailData } from '../../../services/mail/mail.types'
import { validateFieldV3 } from '../../../utils/field-validation'
import { FieldIdSet } from '../../../utils/logic-adaptor'
import {
  InvalidWorkflowTypeError,
  ProcessingError,
  ValidateFieldErrorV3,
} from '../submission.errors'
import { buildMrfMetadata } from '../submission.utils'

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
    verifiedContent: submissionData.verifiedContent,
    encryptedSubmissionSecretKey: submissionData.encryptedSubmissionSecretKey,
    attachmentMetadata: attachmentPresignedUrls,
    version: submissionData.version,
    workflowStep: submissionData.workflowStep,
    mrfVersion: submissionData.mrfVersion,
    mrfMeta: buildMrfMetadata({
      workflow: submissionData.workflow,
      workflowStep: submissionData.workflowStep,
      submittedSteps: submissionData.submittedSteps,
    }),
  }
}

/**
 * Strips sensitive information from multirespondent submission data for public view
 * @param submissionData Multirespondent submission data to strip sensitive information from
 * @param attachmentPresignedUrls Attachment presigned URLs to include in the public multirespondent submission data
 * @returns Public multirespondent submission data with stripped sensitive information
 */
export const createPublicMultirespondentSubmissionDto = (
  submissionData: MultirespondentSubmissionData,
  attachmentPresignedUrls: Record<string, string>,
): PublicMultirespondentSubmissionDto => {
  const multirespondentSubmissionDto = createMultirespondentSubmissionDto(
    submissionData,
    attachmentPresignedUrls,
  )
  return {
    ...multirespondentSubmissionDto,
    form_fields: stripDropdownFieldOptionsToRecipientsMap(
      submissionData.form_fields,
    ),
    workflow: stripWorkflowEmails(submissionData.workflow),
  }
}

export const getEmailFromResponses = (
  fieldId: string,
  responses: FieldResponsesV3,
): string | null => {
  const field = responses[fieldId]
  if (!field || field.fieldType !== BasicField.Email) return null // Not an error, misconfigured or respondent has not filled.
  return field.answer.value
}

const getConditionalFieldEmailRecipient = (
  form_fields: FormFieldSchema[] | FormFieldDto[],
  fieldId: string,
  responses: FieldResponsesV3,
): string[] => {
  const conditionalField = form_fields.find(
    (field) => field._id.toString() === fieldId.toString(),
  )
  const conditionalFieldResponse = responses[fieldId]

  const isFieldValid =
    !!conditionalField &&
    conditionalField.fieldType === BasicField.Dropdown &&
    !!conditionalField.optionsToRecipientsMap

  const isResponseValid =
    !!conditionalFieldResponse &&
    conditionalFieldResponse.fieldType === BasicField.Dropdown

  if (!isFieldValid || !isResponseValid) {
    return [] // Not an error, misconfigured or respondent has not filled.
  }

  const emailRecipients =
    conditionalField?.optionsToRecipientsMap?.[
    conditionalFieldResponse.answer
    ] ?? []

  return emailRecipients
}

export const retrieveWorkflowStepEmailAddresses = (
  form: { form_fields: FormFieldSchema[] | FormFieldDto[] },
  step: FormWorkflowStepDto,
  responses: FieldResponsesV3,
): Result<string[], InvalidWorkflowTypeError> => {
  if (!step) return ok([]) // Not an error, just that the form has gone past its predefined workflow
  switch (step.workflow_type) {
    case WorkflowType.Static: {
      return ok(step.emails)
    }
    case WorkflowType.Dynamic: {
      const email = getEmailFromResponses(step.field, responses)
      if (!email) return ok([])
      return ok([email])
    }
    case WorkflowType.Conditional: {
      return ok(
        getConditionalFieldEmailRecipient(
          form.form_fields,
          step.conditional_field,
          responses,
        ),
      )
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
  previousResponses,
}: {
  formId: string
  visibleFieldIds: FieldIdSet
  formFields: FormFieldDto[]
  responses: ParsedClearFormFieldResponsesV3
  previousResponses?: ParsedClearFormFieldResponsesV3
}): Result<
  ParsedClearFormFieldResponsesV3,
  ValidateFieldErrorV3 | ProcessingError
> => {
  const idToFieldMap = formFields.reduce<{
    [fieldId: string]: FormFieldDto
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
        new ValidateFieldErrorV3(
          'Children field type is not supported for MRF submisisons',
        ),
      )
    }

    const validateFieldV3Result = validateFieldV3({
      formId,
      formField,
      response,
      prevResponse: previousResponses?.[responseId],
      isVisible: visibleFieldIds.has(responseId),
    })
    if (validateFieldV3Result.isErr()) {
      return err(validateFieldV3Result.error)
    }
  }

  return ok(responses)
}

/**
 * Extracts email data to be sent respondent copies to from a multirespondent submission.
 * @param responses - The multirespondent submission's field responses.
 * @param formFields - The schema of the form fields present in the form.
 * @param currentStepActiveFields - The active field Ids assigned in the current step.
 * @returns AutoReplyMailData[] - list of email data to be sent respondent copies to.
 */
export const extractRespondentCopyEmailDatas = ({
  responses,
  formFields,
  currentStepActiveFields,
}: {
  responses: FieldResponsesV3
  formFields: FormFieldSchema[] | FormFieldDto[]
  currentStepActiveFields: string[]
}): AutoReplyMailData[] => {
  return currentStepActiveFields.flatMap((fieldId) => {
    const fieldIdString = fieldId.toString()
    const field = formFields.find((f) => f._id.toString() === fieldIdString)
    const response = responses[fieldIdString]

    if (
      // checks if field is an email field
      field &&
      field.fieldType === BasicField.Email &&
      field.autoReplyOptions?.hasAutoReply &&
      response &&
      // checks if response has an answer (email)
      typeof response.answer === 'object' &&
      'value' in response.answer &&
      typeof response.answer.value === 'string'
    ) {
      const { autoReplyMessage, autoReplySubject, autoReplySender, includeFormSummary } = field.autoReplyOptions
      return [
        {
          email: response.answer.value,
          subject: autoReplySubject,
          sender: autoReplySender,
          body: autoReplyMessage,
          includeFormSummary
        },
      ]
    }
    return [] // no respondent copy emails found
  })
}
