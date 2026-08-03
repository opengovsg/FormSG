import type { FieldResponsesV4, FieldResponseV4 } from '@opengovsg/formsg-sdk'
import { CLIENT_CHECKBOX_OTHERS_INPUT_VALUE } from 'formsg-shared/constants'
import {
  BasicField,
  FormFieldDto,
  FormMetadata,
  FormWorkflowStepDto,
  MultirespondentSubmissionDto,
  PublicMultirespondentSubmissionDto,
  SubmissionType,
  WorkflowType,
} from 'formsg-shared/types'
import { handleAddressResponseDisplay } from 'formsg-shared/utils/address'
import { SIGNATURE_CAPTURED_STRING } from 'formsg-shared/utils/signature'
import { stripDropdownFieldOptionsToRecipientsMap } from 'formsg-shared/utils/strip-dropdown-field-optionsToRecipientsMap'
import { stripWorkflowEmails } from 'formsg-shared/utils/strip-workflow-emails'
import jwt from 'jsonwebtoken'
import moment from 'moment'
import { err, ok, Result } from 'neverthrow'

import {
  EmailRespondentConfirmationField,
  FormFieldSchema,
  IMultirespondentSubmissionSchema,
  MultirespondentSubmissionData,
} from '../../../../types'
import { ParsedClearFormFieldResponsesV4 } from '../../../../types/api'
import config from '../../../config/config'
import { spcpMyInfoConfig } from '../../../config/features/spcp-myinfo.config'
import { AutoReplyMailData } from '../../../services/mail/mail.types'
import { convertToSignaturePngDataUri } from '../../../utils/convert-vector-array-to-png'
import { validateFieldV4 } from '../../../utils/field-validation'
import { FieldIdSet } from '../../../utils/logic-adaptor'
import { startsWithSPCPFieldTitle } from '../../spcp/spcp.util'
import {
  InvalidWorkflowTypeError,
  ProcessingError,
  ValidateFieldErrorV4,
} from '../submission.errors'
import { buildMrfMetadata } from '../submission.utils'

import { MrfJwtPayload } from './multirespondent-submission.types'

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
    encryptedStepToken: submissionData.encryptedStepToken,
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
    encryptedStepToken: undefined,
  }
}

export const getEmailFromResponses = (
  fieldId: string,
  responses: FieldResponsesV4,
): string | null => {
  const field = responses[fieldId]
  if (!field || field.fieldType !== BasicField.Email) return null // Not an error, misconfigured or respondent has not filled.
  return (field.answer as { value: string }).value
}

export const extractEmailAnswersFromResponses = (
  responses: FieldResponsesV4,
): string[] => {
  if (!responses) return []
  return Object.values(responses)
    .filter((response) => response.fieldType === BasicField.Email)
    .map((response) => (response.answer as { value: string }).value)
    .filter(Boolean)
}

const getConditionalFieldEmailRecipient = (
  form_fields: FormFieldSchema[] | FormFieldDto[],
  fieldId: string,
  responses: FieldResponsesV4,
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

  const answerValue = (conditionalFieldResponse.answer as { value: string })
    .value
  const emailRecipients =
    conditionalField?.optionsToRecipientsMap?.[answerValue] ?? []

  return emailRecipients
}

export const retrieveWorkflowStepEmailAddresses = (
  form: { form_fields: FormFieldSchema[] | FormFieldDto[] },
  step: FormWorkflowStepDto,
  responses: FieldResponsesV4,
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
  responses: ParsedClearFormFieldResponsesV4
  previousResponses?: ParsedClearFormFieldResponsesV4
}): Result<
  ParsedClearFormFieldResponsesV4,
  ValidateFieldErrorV4 | ProcessingError
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
        new ValidateFieldErrorV4(
          'Children field type is not supported for MRF submisisons',
        ),
      )
    }

    const validateFieldV4Result = validateFieldV4({
      formId,
      formField,
      response,
      prevResponse: previousResponses?.[responseId],
      isVisible: visibleFieldIds.has(responseId),
    })
    if (validateFieldV4Result.isErr()) {
      return err(validateFieldV4Result.error)
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
  responses: FieldResponsesV4
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
      // checks if response has an answer (email) - V4 email answer is always { value: string }
      typeof response.answer === 'object' &&
      'value' in response.answer &&
      typeof (response.answer as { value: string }).value === 'string'
    ) {
      const {
        autoReplyMessage,
        autoReplySubject,
        autoReplySender,
        includeFormSummary,
      } = field.autoReplyOptions
      return [
        {
          email: (response.answer as { value: string }).value,
          subject: autoReplySubject,
          sender: autoReplySender,
          body: autoReplyMessage,
          includeFormSummary,
        },
      ]
    }
    return [] // no respondent copy emails found
  })
}

export type QuestionAnswerPair = {
  question: string
  answer: string
  signatureDataPngDataUri?: string
  fieldType: BasicField
}

/**
 * Given a single form field and its response (V4), extracts question-answer pairs.
 * Used for email body/pdf outputs and individualResponsePage displays
 * Returns an array since some fields (e.g. table, children) will have
 * multiple question-answer pairs per response
 * @param formField - Single form field schema. Does not include Ndi responses, @see getQuestionAnswerPairsForMultipleFields on how to include ndi responses.
 * @param response - V4 Response for the given form field
 * @returns An array of QuestionAnswer objects representing the extracted question-answer pairs for the given form field.
 */
const getQuestionAnswerPairsForOneField = ({
  formField,
  response,
  includeSignatureDataPngDataUri,
  includeVerifiedPrefix = true,
}: {
  formField: FormFieldSchema | FormFieldDto
  response: FieldResponseV4
  includeSignatureDataPngDataUri: boolean
  includeVerifiedPrefix?: boolean
}): QuestionAnswerPair[] => {
  // V4 responses embed question text in response.question
  let questionTitle = response.question || formField.title
  let answer = ''
  const questionAnswerPairs: QuestionAnswerPair[] = []

  const fieldType = response.fieldType as BasicField
  switch (response.fieldType) {
    case BasicField.Attachment: {
      const attachmentAnswer = response.answer as {
        value: string
        hasBeenScanned: boolean
        md5Hash?: string
      }
      return [
        {
          question: `[Attachment] ${questionTitle}`,
          answer: attachmentAnswer.value,
          fieldType,
        },
      ]
    }
    case BasicField.Address: {
      const addressAnswer = response.answer as {
        postalCode: { value: string }
        blockNumber: { value: string }
        streetName: { value: string }
        buildingName: { value: string }
        levelNumber: { value: string }
        unitNumber: { value: string }
      }
      const answerArray = [
        addressAnswer.blockNumber.value,
        addressAnswer.streetName.value,
        addressAnswer.buildingName.value,
        addressAnswer.levelNumber.value,
        addressAnswer.unitNumber.value,
        addressAnswer.postalCode.value,
      ] // move postal code to end of array
      answer = handleAddressResponseDisplay(answerArray).join(', ')
      break
    }
    case BasicField.Email:
    case BasicField.Mobile: {
      const verifiableAnswer = response.answer as {
        value: string
        signature?: string
      }
      if (includeVerifiedPrefix && verifiableAnswer.signature) {
        questionTitle = `[Verified] ${questionTitle}`
      }
      answer = verifiableAnswer.value
      break
    }
    case BasicField.Table: {
      if (formField.fieldType !== BasicField.Table) break
      const tableAnswer = response.answer as Record<
        string,
        { rowNum: number; value: Record<string, string | number> }
      >
      const idToColTitleMap = formField.columns.reduce(
        (acc, col) => {
          acc[col._id] = col.title
          return acc
        },
        {} as Record<string, string>,
      )

      // Sort rows by rowNum for consistent ordering
      const sortedRows = Object.values(tableAnswer).sort(
        (a, b) => a.rowNum - b.rowNum,
      )

      for (const row of sortedRows) {
        const validColumns = Object.entries(row.value).filter(
          ([colId]) => colId in idToColTitleMap,
        )

        const delimitedColumnTitles = validColumns
          .map(([colId]) => {
            const colTitle = idToColTitleMap[colId]
            return `${colTitle}`
          })
          .join('; ')

        const delimitedColumnAnswers = validColumns
          .map(([, colAns]) =>
            colAns !== null && colAns !== undefined ? String(colAns) : '',
          )
          .join('; ')

        const question = `[Table] ${formField.title} (${delimitedColumnTitles})`

        questionAnswerPairs.push({
          question,
          answer: delimitedColumnAnswers,
          fieldType,
        })
      }
      return questionAnswerPairs
    }
    case BasicField.Radio: {
      const radioAnswer = response.answer as {
        value: string
        isOthersInput: boolean
      }
      if (radioAnswer.isOthersInput) {
        answer = `Others: ${radioAnswer.value}`
      } else {
        answer = radioAnswer.value
      }
      break
    }
    case BasicField.Checkbox: {
      const checkboxAnswer = response.answer as {
        value: string[]
        othersInput?: string
      }
      const selectedAnswers = checkboxAnswer.value.filter(
        (val) => val !== CLIENT_CHECKBOX_OTHERS_INPUT_VALUE,
      )

      if (checkboxAnswer.othersInput) {
        selectedAnswers.push(checkboxAnswer.othersInput)
      }

      answer = selectedAnswers.join(', ')
      break
    }
    case BasicField.Signature: {
      const signatureAnswer = response.answer as {
        value: [number, number, number][][]
        type: string
      }
      const signatureQuestionAnswer: QuestionAnswerPair = {
        question: `[signature] ${questionTitle}`,
        answer: SIGNATURE_CAPTURED_STRING,
        signatureDataPngDataUri: includeSignatureDataPngDataUri
          ? convertToSignaturePngDataUri(signatureAnswer.value)
          : undefined,
        fieldType,
      }
      return [signatureQuestionAnswer]
    }
    default:
      // For all string-answer fields (number, decimal, text, homeNo, dropdown, rating, nric, uen, date, countryRegion, section, yesNo)
      answer = (response.answer as { value: string }).value ?? ''
  }

  questionAnswerPairs.push({
    question: questionTitle,
    answer,
    fieldType,
  })
  return questionAnswerPairs
}

/**
 * Given multiple form fields and their responses, extracts question-answer pairs.
 * @param formFields - List of form fields schemas
 * @param responses - Corresponding list of responses to the given form fields
 * @returns An array of QuestionAnswer pairs representing the extracted question-answer pairs for the all the given form fields.
 */
export const getQuestionAnswerPairsForMultipleFields = ({
  formFields,
  responses,
  includeSignatureDataPngDataUri = false,
  includeVerifiedPrefix = true,
}: {
  formFields: FormFieldSchema[] | FormFieldDto[]
  responses: FieldResponsesV4
  includeSignatureDataPngDataUri?: boolean
  includeVerifiedPrefix?: boolean
}): QuestionAnswerPair[] => {
  const questionAnswerPairs: QuestionAnswerPair[] = []
  if (!formFields || !responses) {
    return []
  }
  for (const currentFormField of formFields) {
    const questionTitle = currentFormField.title
    const response = responses[currentFormField._id]

    if (!response || !questionTitle) continue
    const questionAnswerPairsForCurrentFormField =
      getQuestionAnswerPairsForOneField({
        formField: currentFormField,
        response,
        includeSignatureDataPngDataUri,
        includeVerifiedPrefix,
      })

    questionAnswerPairs.push(...questionAnswerPairsForCurrentFormField)
  }

  // Add Ndi responses if they exist (keyed by SPCP field title in both V3 and V4)
  for (const key in responses) {
    if (startsWithSPCPFieldTitle(key)) {
      const ndiResponse = responses[key]
      const answerValue = (ndiResponse.answer as { value: string }).value
      questionAnswerPairs.push({
        question: key,
        answer: answerValue,
        fieldType: ndiResponse.fieldType as unknown as BasicField,
      })
    }
  }
  return questionAnswerPairs
}

export const getFormDelimiter = (metadata?: FormMetadata): string =>
  metadata?.delimiter ?? ', '

// Field types that don't carry respondent answers; excluded from JSON dump.
const NON_RESPONSE_FIELD_TYPES = new Set<string>([
  BasicField.Section,
  BasicField.Statement,
  BasicField.Image,
])

/**
 * Builds the JSON response payload attached to MRF completion emails.
 *
 * Unlike getQuestionAnswerPairsForMultipleFields (which targets human-facing
 * email/PDF output), this dump targets machine consumers and so:
 *   - emits an empty-string entry for every form field without a response
 *     (schema-complete output), and
 *   - flattens address answers to one entry per sub-field
 *     (e.g. "Home Address - blockNumber") so each sub-field is individually
 *     addressable downstream.
 *
 * Note: the `delimiter` param is accepted for caller compatibility but is
 * currently unused post-V4 migration. See follow-up to restore admin
 * `metadata.delimiter` customisation if needed.
 */
export const buildMrfResponseJson = ({
  formFields,
  responses,
  formId,
  responseId,
  timestamp,
}: {
  formFields: FormFieldSchema[] | FormFieldDto[]
  responses: FieldResponsesV4
  formId?: string
  responseId: string
  timestamp: string
  delimiter?: string
}): string => {
  const entries: { question: string; answer: string }[] = [
    ...(formId !== undefined ? [{ question: 'Form ID', answer: formId }] : []),
    { question: 'Response ID', answer: responseId },
    { question: 'Timestamp', answer: timestamp },
  ]

  if (!formFields || !responses) {
    return JSON.stringify(entries)
  }

  for (const field of formFields) {
    if (NON_RESPONSE_FIELD_TYPES.has(field.fieldType)) continue

    const response = responses[field._id.toString()]

    if (!response) {
      entries.push({ question: field.title, answer: '' })
      continue
    }

    if (response.fieldType === BasicField.Address) {
      const addressAnswer = response.answer as Record<string, { value: string }>
      for (const subField of Object.keys(addressAnswer)) {
        entries.push({
          question: `${field.title} - ${subField}`,
          answer: addressAnswer[subField]?.value ?? '',
        })
      }
      continue
    }

    const pairs = getQuestionAnswerPairsForMultipleFields({
      formFields: [field] as unknown as FormFieldDto[],
      responses: {
        [field._id.toString()]: response,
      } as unknown as FieldResponsesV4,
      includeSignatureDataPngDataUri: false,
      // [Verified] prefix is a UX hint for the email body; the JSON dump is
      // for machine consumers and should carry the raw question text.
      includeVerifiedPrefix: false,
    })
    for (const p of pairs) {
      entries.push({ question: p.question, answer: p.answer })
    }
  }

  for (const key of Object.keys(responses)) {
    if (!startsWithSPCPFieldTitle(key)) continue
    const ndi = responses[key]
    entries.push({
      question: key,
      answer: (ndi.answer as { value: string }).value,
    })
  }

  return JSON.stringify(entries)
}

/**
 * Prepares responses data from MRF responses to PDF html format
 * @param formFields - The form fields schema
 * @param responses - The mrf responses to the form fields
 * @returns list of EmailRespondentConfirmationField used for email & pdf generation
 */
export const getResponsesDataFromMrfResponses = ({
  formFields,
  responses,
}: {
  formFields: FormFieldSchema[] | FormFieldDto[]
  responses: FieldResponsesV4
}): EmailRespondentConfirmationField[] => {
  if (!formFields || !responses) return []

  const questionAnswerPairs = getQuestionAnswerPairsForMultipleFields({
    formFields,
    responses,
    includeSignatureDataPngDataUri: true,
  })

  return questionAnswerPairs.map((questionAnswerPair) => {
    return {
      question: questionAnswerPair.question,
      answerTemplate: [questionAnswerPair.answer],
      answer: questionAnswerPair.signatureDataPngDataUri,
      fieldType: questionAnswerPair.fieldType,
    }
  })
}

/**
 * Creates a MRF cookie signed by FormSG
 * @param prevSubmissionId of the submission (same across all steps)
 * @param currentWorkflowStep of the workflow
 * @returns JWT signed by FormSG
 */
export const createMrfCookie = ({
  prevSubmissionId,
  currentWorkflowStep,
}: MrfJwtPayload): string => {
  const payload: MrfJwtPayload = {
    prevSubmissionId,
    currentWorkflowStep,
  }

  return jwt.sign(payload, config.sessionSecret, {
    // this arg must be supplied in seconds
    expiresIn: spcpMyInfoConfig.spCookieMaxAge / 1000,
  })
}

export const getMrfCookieName = ({
  formId,
  previousSubmissionId,
}: {
  formId: string
  previousSubmissionId: string
}): string => {
  return `Mrf_${formId}_${previousSubmissionId}`
}

export type MrfVersion = 1 | 2

export const getMrfVersion = ({
  webhookType,
  isStepWriteTokenEnabled,
}: {
  webhookType?: 'zapier' | 'plumber' | 'generic'
  isStepWriteTokenEnabled: boolean
}): MrfVersion => {
  switch (webhookType) {
    case 'plumber':
      return isStepWriteTokenEnabled ? 2 : 1
    case undefined:
    case 'zapier':
    case 'generic':
      return 2
  }
}

export const formatSubmittedStepTimestamp = ({
  submittedSteps,
  stepIndex,
}: {
  submittedSteps: IMultirespondentSubmissionSchema['submittedSteps']
  stepIndex: number
}): string => {
  if (!submittedSteps?.[stepIndex]?.submittedAt) return ''
  return moment(submittedSteps[stepIndex].submittedAt)
    .tz('Asia/Singapore')
    .format('ddd, DD MMM YYYY hh:mm:ss A')
}
