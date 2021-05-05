import _ from 'lodash'
import mongoose from 'mongoose'
import { err, errAsync, ok, okAsync, Result, ResultAsync } from 'neverthrow'

import {
  EmailRespondentConfirmationField,
  FieldResponse,
  IAttachmentInfo,
  IFieldSchema,
  IFormDocument,
  IPopulatedForm,
  ISubmissionSchema,
  ResponseMode,
} from '@root/types'
import { createLoggerWithLabel } from '../../config/logger'
import getSubmissionModel from '../../models/submission.server.model'
import MailService from '../../services/mail/mail.service'
import { createQueryWithDateParam, isMalformedDate } from '../../utils/date'
import { validateField } from '../../utils/field-validation'
import { DatabaseError, MalformedParametersError } from '../core/core.errors'

import {
  ConflictError,
  ProcessingError,
  SendEmailConfirmationError,
  ValidateFieldError,
} from './submission.errors'
import { ProcessedFieldResponse } from './submission.types'
import {
  extractEmailConfirmationData,
  getLogicUnitPreventingSubmit,
  getModeFilter,
  getVisibleFieldIds,
} from './submission.utils'

const logger = createLoggerWithLabel(module)
const SubmissionModel = getSubmissionModel(mongoose)

/**
 * Filter allowed form field responses from given responses and return the
 * array of responses with duplicates removed.
 *
 * @param form The form document
 * @param responses the responses that corresponds to the given form
 * @returns neverthrow ok() filtered list of allowed responses with duplicates (if any) removed
 * @returns neverthrow err(ConflictError) if the given form's form field ids count do not match given responses'
 */
const getFilteredResponses = (
  form: IFormDocument,
  responses: FieldResponse[],
): Result<FieldResponse[], ConflictError> => {
  const modeFilter = getModeFilter(form.responseMode)

  if (!form.form_fields) {
    return err(new ConflictError('Form fields are missing'))
  }
  // _id must be transformed to string as form response is jsonified.
  const fieldIds = modeFilter(form.form_fields).map((field) => ({
    _id: String(field._id),
  }))
  const uniqueResponses = _.uniqBy(modeFilter(responses), '_id')
  const results = _.intersectionBy(uniqueResponses, fieldIds, '_id')

  if (results.length < fieldIds.length) {
    const onlyInForm = _.differenceBy(fieldIds, results, '_id').map(
      ({ _id }) => _id,
    )
    return err(
      new ConflictError('Some form fields are missing', {
        formId: form._id,
        onlyInForm,
      }),
    )
  }
  return ok(results)
}

/**
 * Injects response metadata such as the question, visibility state. In
 * addition, validation such as input validation or signature validation on
 * verified fields are also performed on the response.
 * @param form The form document corresponding to the responses
 * @param responses The responses to process and validate
 * @returns neverthrow ok() with field responses with additional metadata injected.
 * @returns neverthrow err() if response validation fails
 */
export const getProcessedResponses = (
  form: IFormDocument,
  originalResponses: FieldResponse[],
): Result<
  ProcessedFieldResponse[],
  ProcessingError | ConflictError | ValidateFieldError
> => {
  const filteredResponsesResult = getFilteredResponses(form, originalResponses)
  if (filteredResponsesResult.isErr()) {
    return err(filteredResponsesResult.error)
  }

  const filteredResponses = filteredResponsesResult.value

  // Set of all visible fields
  const visibleFieldIds = getVisibleFieldIds(filteredResponses, form)

  // Guard against invalid form submissions that should have been prevented by
  // logic.
  if (getLogicUnitPreventingSubmit(filteredResponses, form, visibleFieldIds)) {
    return err(new ProcessingError('Submission prevented by form logic'))
  }

  // Create a map keyed by field._id for easier access

  if (!form.form_fields) {
    return err(new ProcessingError('Form fields are undefined'))
  }

  const fieldMap = form.form_fields.reduce<{
    [fieldId: string]: IFieldSchema
  }>((acc, field) => {
    acc[field._id] = field
    return acc
  }, {})

  // Validate each field in the form and inject metadata into the responses.
  const processedResponses = []
  for (const response of filteredResponses) {
    const responseId = response._id
    const formField = fieldMap[responseId]
    if (!formField) {
      return err(
        new ProcessingError('Response ID does not match form field IDs'),
      )
    }

    const processingResponse: ProcessedFieldResponse = {
      ...response,
      isVisible:
        // Set isVisible as true for Encrypt mode if there is a response for mobile and email field
        // Because we cannot tell if the field is unhidden by logic
        // This prevents downstream validateField from incorrectly preventing
        // encrypt mode submissions with responses on unhidden fields
        // TODO(#780): Remove this once submission service is separated into
        // Email and Encrypted services
        form.responseMode === ResponseMode.Encrypt
          ? 'answer' in response &&
            typeof response.answer === 'string' &&
            response.answer.trim() !== ''
          : visibleFieldIds.has(responseId),
      question: formField.getQuestion(),
    }

    if (formField.isVerifiable) {
      processingResponse.isUserVerified = formField.isVerifiable
    }

    // Error will be returned if the processed response is not valid.
    const validateFieldResult = validateField(
      form._id,
      formField,
      processingResponse,
    )
    if (validateFieldResult.isErr()) {
      return err(validateFieldResult.error)
    }
    processedResponses.push(processingResponse)
  }

  return ok(processedResponses)
}

/**
 * Returns number of form submissions of given form id in the given date range.
 *
 * @param formId the form id to retrieve submission counts for
 * @param dateRange optional date range to narrow down submission count
 * @param dateRange.startDate the start date of the date range
 * @param dateRange.endDate the end date of the date range
 *
 * @returns ok(form submission count)
 * @returns err(MalformedParametersError) if date range provided is malformed
 * @returns err(DatabaseError) if database query errors
 * @
 */
export const getFormSubmissionsCount = (
  formId: string,
  dateRange: {
    startDate?: string
    endDate?: string
  } = {},
): ResultAsync<number, MalformedParametersError | DatabaseError> => {
  if (
    isMalformedDate(dateRange.startDate) ||
    isMalformedDate(dateRange.endDate)
  ) {
    return errAsync(new MalformedParametersError('Malformed date parameter'))
  }

  const countQuery = {
    form: formId,
    ...createQueryWithDateParam(dateRange?.startDate, dateRange?.endDate),
  }

  return ResultAsync.fromPromise(
    SubmissionModel.countDocuments(countQuery).exec(),
    (error) => {
      logger.error({
        message: 'Error counting submission documents from database',
        meta: {
          action: 'getFormSubmissionsCount',
          formId,
        },
        error,
      })

      return new DatabaseError()
    },
  )
}

/**
 * Sends email confirmation to form-fillers, for email fields with email confirmation
 * enabled.
 * @param param0 Data to include in email confirmations
 * @param param0.form Form object
 * @param param0.submission Submission object which was saved to database
 * @param param0.parsedResponses Responses for each field
 * @param param0.autoReplyData Subset of responses to be included in email confirmation
 * @param param0.attachments Attachments to be included in email
 * @returns ok(true) if all emails were sent successfully
 * @returns err(SendEmailConfirmationError) if any email failed to be sent
 */
export const sendEmailConfirmations = <S extends ISubmissionSchema>({
  form,
  submission,
  parsedResponses,
  autoReplyData,
  attachments,
}: {
  form: IPopulatedForm
  submission: S
  parsedResponses: ProcessedFieldResponse[]
  autoReplyData?: EmailRespondentConfirmationField[]
  attachments?: IAttachmentInfo[]
}): ResultAsync<true, SendEmailConfirmationError> => {
  const logMeta = {
    action: 'sendEmailConfirmations',
    formId: form._id,
    submissionid: submission._id,
  }
  const confirmationData = extractEmailConfirmationData(
    parsedResponses,
    form.form_fields,
  )
  if (confirmationData.length === 0) {
    return okAsync(true)
  }
  const sentEmailsPromise = MailService.sendAutoReplyEmails({
    form,
    submission,
    attachments,
    responsesData: autoReplyData ?? [],
    autoReplyMailDatas: confirmationData,
  })
  return ResultAsync.fromPromise(sentEmailsPromise, (error) => {
    logger.error({
      message: 'Error while attempting to send email confirmations',
      meta: logMeta,
      error,
    })
    return new SendEmailConfirmationError()
  }).andThen((emailResults) => {
    const errors = emailResults.reduce<string[]>((acc, singleEmail) => {
      if (singleEmail.status === 'rejected') {
        acc.push(singleEmail.reason)
      }
      return acc
    }, [])
    if (errors.length > 0) {
      logger.error({
        message: 'Some email confirmations could not be sent',
        meta: { ...logMeta, errors },
      })
      return errAsync(new SendEmailConfirmationError())
    }
    return okAsync(true)
  })
}
