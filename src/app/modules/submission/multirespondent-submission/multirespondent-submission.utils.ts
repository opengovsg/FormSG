import moment from 'moment'
import { err, ok, Result } from 'neverthrow'

import { CLIENT_CHECKBOX_OTHERS_INPUT_VALUE } from '../../../../../shared/constants/form'
import {
  BasicField,
  FieldResponsesV3,
  FormFieldDto,
  FormWorkflowStepDto,
  MultirespondentSubmissionDto,
  NdiResponseV3,
  SignatureFieldWebhookResponseV3,
  SubmissionType,
  WorkflowType,
} from '../../../../../shared/types'
import { handleAddressResponseDisplay } from '../../../../../shared/utils/address'
import { SIGNATURE_CAPTURED_STRING } from '../../../../../shared/utils/signature'
import { VerifiedKeys } from '../../../../../shared/utils/verified-content'
import {
  FormFieldSchema,
  MultirespondentSubmissionData,
} from '../../../../types'
import {
  ParsedClearFormFieldResponsesV3,
  ParsedClearFormFieldResponseV3,
} from '../../../../types/api'
import { validateFieldV3 } from '../../../utils/field-validation'
import { FieldIdSet } from '../../../utils/logic-adaptor'
import { QuestionAnswer } from '../../../views/templates/MrfWorkflowCompletionEmail'
import { startsWithSPCPFieldTitle } from '../../spcp/spcp.util'
import {
  CpVerifiedContent,
  SpVerifiedContent,
  VerifiedContent,
} from '../../verified-content/verified-content.types'
import {
  InvalidWorkflowTypeError,
  ProcessingError,
  ValidateFieldErrorV3,
} from '../submission.errors'
import { buildMrfMetadata } from '../submission.utils'

import { StrippedAttachmentResponseV3 } from './multirespondent-submission.types'

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

/*
 * Extracts question-answer pairs from form fields and responses.
 * @param formFields - The form fields schema
 * @param responses - The responses to the form fields
 * @returns An array of QuestionAnswer objects
 */
export const getQuestionTitleAnswerString = ({
  formFields,
  responses,
}: {
  formFields: FormFieldSchema[] | FormFieldDto[]
  responses: FieldResponsesV3
}): QuestionAnswer[] => {
  const questionAnswerPair = []
  if (!formFields || !responses) {
    return []
  }
  for (const formField of formFields) {
    const MyInfoPrefix = 'myInfo' in formField ? '[MyInfo] ' : ''
    const questionTitle = `${MyInfoPrefix}${formField.title}`
    const response = responses[formField._id]

    if (!response || !questionTitle) continue

    let answer = ''
    let answerArray: string[] = []
    switch (response.fieldType) {
      case BasicField.Attachment:
        answer = response.answer.answer
        questionAnswerPair.push({
          question: `[Attachment] ${questionTitle}`,
          answer,
        })
        continue
      case BasicField.Address: {
        const {
          postalCode,
          blockNumber,
          streetName,
          buildingName,
          levelNumber,
          unitNumber,
        } = response.answer.addressSubFields
        answerArray = [
          blockNumber,
          streetName,
          buildingName,
          levelNumber,
          unitNumber,
          postalCode,
        ] // move postal code to end of array
        questionAnswerPair.push({
          question: `${questionTitle}`,
          answer: handleAddressResponseDisplay(Object.values(answerArray)).join(
            ', ',
          ),
        })
        continue
      }
      case BasicField.Email:
      case BasicField.Mobile:
        answer = response.answer.value
        break
      case BasicField.Table:
        if (formField.fieldType !== BasicField.Table || !response.answer)
          continue
        // eslint-disable-next-line no-case-declarations
        const idToColTitleMap = formField.columns.reduce(
          (acc, col) => {
            acc[col._id] = col.title
            return acc
          },
          {} as Record<string, string>,
        )

        for (const row of response.answer) {
          const validColumns = Object.entries(row).filter(
            ([colId]) => colId in idToColTitleMap,
          )

          const delimitedColumnTitles = validColumns
            .map(([colId]) => {
              const colTitle = idToColTitleMap[colId]
              return `${colTitle}`
            })
            .join('; ')

          const delimitedColumnAnswers = validColumns
            .map(([, colAns]) => colAns ?? '')
            .join('; ')

          const question = `[Table] ${formField.title} (${delimitedColumnTitles})`
          const answer = delimitedColumnAnswers

          questionAnswerPair.push({
            question,
            answer,
          })
        }
        continue
      case BasicField.Radio:
        answer =
          'value' in response.answer
            ? response.answer.value
            : 'othersInput' in response.answer
              ? response.answer.othersInput
              : ''
        break
      case BasicField.Checkbox:
        // eslint-disable-next-line no-case-declarations
        const selectedAnswers =
          (response.answer.othersInput
            ? [...response.answer.value, response.answer.othersInput]
            : [...response.answer.value]
          ).filter((val) => val !== CLIENT_CHECKBOX_OTHERS_INPUT_VALUE) ?? []

        answer = selectedAnswers.toString()
        break
      case BasicField.Signature:
        questionAnswerPair.push({
          question: `[signature] ${questionTitle}`,
          answer: SIGNATURE_CAPTURED_STRING,
        })
        continue
      case BasicField.Children:
        if (!response.answer.childFields || !response.answer.child) {
          continue
        }
        for (const [index, child] of response.answer.child.entries()) {
          questionAnswerPair.push({
            question: `Child ${index + 1}: ${response.answer.childFields.toString()}`,
            answer: child
              ? child.toString()
              : response.answer.childFields.map(() => '').toString(),
          })
        }
        continue
      default:
        answer = response.answer
    }

    questionAnswerPair.push({
      question: questionTitle,
      answer,
    })
  }

  // Add Ndi responses if they exist
  for (const key in responses) {
    if (startsWithSPCPFieldTitle(key)) {
      const value = responses[key] as NdiResponseV3
      questionAnswerPair.push({
        question: key,
        answer: value.answer,
      })
    }
  }
  return questionAnswerPair
}

export const convertToVerifiedContent = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  decryptedVerifiedContent: Record<string, any>,
): VerifiedContent | Error => {
  // CP case: both CpUen and CpUid must exist
  if (
    decryptedVerifiedContent[VerifiedKeys.CpUen] &&
    decryptedVerifiedContent[VerifiedKeys.CpUid]
  ) {
    const cpContent: CpVerifiedContent = {
      [VerifiedKeys.CpUen]: String(
        decryptedVerifiedContent[VerifiedKeys.CpUen],
      ),
      [VerifiedKeys.CpUid]: String(
        decryptedVerifiedContent[VerifiedKeys.CpUid],
      ),
    }

    return cpContent
  }

  // SP case: SpUinFin exists
  if (decryptedVerifiedContent[VerifiedKeys.SpUinFin]) {
    const spContent: SpVerifiedContent = {
      [VerifiedKeys.SpUinFin]: String(
        decryptedVerifiedContent[VerifiedKeys.SpUinFin],
      ),
    }
    return spContent
  }

  return new Error(
    'Cannot convert decrypted content: no known verified keys found',
  )
}

/**
 * Converts responses to webhook desired outputs before encryption (again)
 */
export const prepareWebhookResponseContentV3 = (
  input: Record<
    string,
    ParsedClearFormFieldResponseV3 | StrippedAttachmentResponseV3
  >,
): Record<
  string,
  | ParsedClearFormFieldResponseV3
  | StrippedAttachmentResponseV3
  | SignatureFieldWebhookResponseV3
> => {
  const result: Record<
    string,
    | ParsedClearFormFieldResponseV3
    | StrippedAttachmentResponseV3
    | SignatureFieldWebhookResponseV3
  > = {}

  for (const [key, value] of Object.entries(input)) {
    if (
      value.fieldType === BasicField.Signature &&
      value.answer.value.length > 0
    ) {
      result[key] = {
        ...value,
        answer: [SIGNATURE_CAPTURED_STRING],
      }
    } else {
      result[key] = value
    }
  }

  return result
}
