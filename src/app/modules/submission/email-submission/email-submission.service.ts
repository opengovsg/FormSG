import crypto from 'crypto'
import mongoose from 'mongoose'
import { err, errAsync, ok, okAsync, Result, ResultAsync } from 'neverthrow'

import { createLoggerWithLabel } from '../../../../config/logger'
import {
  BasicField,
  EmailData,
  EmailDataForOneField,
  EmailFormField,
  FieldResponse,
  IAttachmentInfo,
  IEmailSubmissionSchema,
  IPopulatedEmailForm,
  IPopulatedForm,
  ResponseMode,
  SubmissionType,
} from '../../../../types'
import { getEmailSubmissionModel } from '../../../models/submission.server.model'
import MailService from '../../../services/mail/mail.service'
import {
  isProcessedCheckboxResponse,
  isProcessedTableResponse,
} from '../../../utils/field-validation/field-validation.guards'
import { DatabaseError } from '../../core/core.errors'
import { transformEmails } from '../../form/form.util'
import { ResponseModeError, SendAdminEmailError } from '../submission.errors'
import { ProcessedFieldResponse } from '../submission.types'

import {
  DIGEST_TYPE,
  HASH_ITERATIONS,
  KEY_LENGTH,
  SALT_LENGTH,
} from './email-submission.constants'
import {
  AttachmentTooLargeError,
  ConcatSubmissionError,
  InvalidFileExtensionError,
  SubmissionHashError,
} from './email-submission.errors'
import { SubmissionHash } from './email-submission.types'
import {
  areAttachmentsMoreThan7MB,
  concatAttachmentsAndResponses,
  getAnswerForCheckbox,
  getAnswerRowsForTable,
  getFormattedResponse,
  getInvalidFileExtensions,
  isEmailModeForm,
  mapAttachmentsFromResponses,
} from './email-submission.util'

const EmailSubmissionModel = getEmailSubmissionModel(mongoose)
const logger = createLoggerWithLabel(module)

/**
 * Creates response and autoreply email data for a single response.
 * Helper function for createEmailData.
 * @param response Processed and validated response for one field
 * @param hashedFields IDs of fields whose responses have been verified by MyInfo hashes
 * @returns email data for one form field
 */
const createEmailDataForOneField = (
  response: ProcessedFieldResponse,
  hashedFields: Set<string>,
): EmailDataForOneField[] => {
  if (isProcessedTableResponse(response)) {
    return getAnswerRowsForTable(response).map((row) =>
      getFormattedResponse(row, hashedFields),
    )
  } else if (isProcessedCheckboxResponse(response)) {
    const checkbox = getAnswerForCheckbox(response)
    return [getFormattedResponse(checkbox, hashedFields)]
  } else {
    return [getFormattedResponse(response, hashedFields)]
  }
}

/**
 * Creates data to be included in the response and autoreply emails.
 * @param parsedResponses Processed and validated responses
 * @param hashedFields IDs of fields whose responses have been verified by MyInfo hashes
 * @returns email data for admin response and email confirmations
 */
export const createEmailData = (
  parsedResponses: ProcessedFieldResponse[],
  hashedFields: Set<string>,
): EmailData => {
  // First, get an array of email data for each response
  // Each field has an array of email data to accommodate table fields,
  // which have multiple rows of data per field. Hence flatten and maintain
  // the order of responses.
  return (
    parsedResponses
      .flatMap((response) => createEmailDataForOneField(response, hashedFields))
      // Then reshape such that autoReplyData, jsonData and formData are each arrays
      .reduce<EmailData>(
        (acc, dataForOneField) => {
          if (dataForOneField.autoReplyData) {
            acc.autoReplyData.push(dataForOneField.autoReplyData)
          }
          if (dataForOneField.jsonData) {
            acc.jsonData.push(dataForOneField.jsonData)
          }
          acc.formData.push(dataForOneField.formData)
          return acc
        },
        {
          autoReplyData: [],
          jsonData: [],
          formData: [],
        },
      )
  )
}

/**
 * Validates that the attachments in a submission do not violate form-level
 * constraints e.g. form-wide attachment size limit.
 * @param parsedResponses Unprocessed responses
 * @returns okAsync(true) if validation passes
 * @returns errAsync(InvalidFileExtensionError) if invalid file extensions are found
 * @returns errAsync(AttachmentTooLargeError) if total attachment size exceeds 7MB
 */
export const validateAttachments = (
  parsedResponses: FieldResponse[],
): ResultAsync<true, InvalidFileExtensionError | AttachmentTooLargeError> => {
  const logMeta = { action: 'validateAttachments' }
  const attachments = mapAttachmentsFromResponses(parsedResponses)
  if (areAttachmentsMoreThan7MB(attachments)) {
    logger.error({
      message: 'Attachment size is too large',
      meta: logMeta,
    })
    return errAsync(new AttachmentTooLargeError())
  }
  return ResultAsync.fromPromise(
    getInvalidFileExtensions(attachments),
    (error) => {
      logger.error({
        message: 'Error while validating attachment file extensions',
        meta: logMeta,
        error,
      })
      return new InvalidFileExtensionError()
    },
  ).andThen((invalidExtensions) => {
    if (invalidExtensions.length > 0) {
      logger.error({
        message: 'Invalid file extensions found',
        meta: {
          ...logMeta,
          invalidExtensions,
        },
      })
      return errAsync(new InvalidFileExtensionError())
    }
    return okAsync(true)
  })
}

/**
 * Creates hash of a submission
 * @param formData Responses sent to admin
 * @param attachments Attachments in response
 * @returns okAsync(hash and salt) if hashing was successful
 * @returns errAsync(SubmissionHashError) if error occurred while hashing
 * @returns errAsync(ConcatSubmissionError) if error occurred while concatenating attachments
 */
export const hashSubmission = (
  formData: EmailFormField[],
  attachments: IAttachmentInfo[],
): ResultAsync<SubmissionHash, SubmissionHashError | ConcatSubmissionError> => {
  // TODO (#847): remove this try-catch when we are sure that the shape of formData is correct
  let baseString: string
  try {
    baseString = concatAttachmentsAndResponses(formData, attachments)
  } catch (error) {
    logger.error({
      message:
        'Error while concatenating attachments and responses for hashing',
      meta: {
        action: 'hashSubmission',
        questions: formData.map((field) => field.question),
      },
    })
    return errAsync(new ConcatSubmissionError())
  }
  const salt = crypto.randomBytes(SALT_LENGTH).toString('base64')
  const hashPromise = new Promise<SubmissionHash>((resolve, reject) => {
    crypto.pbkdf2(
      baseString,
      salt,
      HASH_ITERATIONS,
      KEY_LENGTH,
      DIGEST_TYPE,
      (err, hash) => {
        if (err) {
          return reject(err)
        }
        return resolve({
          hash: hash.toString('base64'),
          salt,
        })
      },
    )
  })
  return ResultAsync.fromPromise(hashPromise, (error) => {
    logger.error({
      message: 'Error while hashing submission',
      meta: {
        action: 'hashSubmission',
      },
      error,
    })
    return new SubmissionHashError()
  })
}

/**
 * Saves an email submission to the database.
 * @param form
 * @param submissionHash Hash of submission and salt
 * @returns okAsync(the saved document) if submission was saved successfully
 * @returns errAsync(DatabaseError) if submission failed to be saved
 */
export const saveSubmissionMetadata = (
  form: IPopulatedEmailForm,
  submissionHash: SubmissionHash,
): ResultAsync<IEmailSubmissionSchema, DatabaseError> => {
  const params = {
    form: form._id,
    authType: form.authType,
    myInfoFields: form.getUniqueMyInfoAttrs(),
    recipientEmails: transformEmails(form.emails),
    responseHash: submissionHash.hash,
    responseSalt: submissionHash.salt,
    submissionType: SubmissionType.Email,
  }
  return ResultAsync.fromPromise(
    EmailSubmissionModel.create(params),
    (error) => {
      logger.error({
        message: 'Error while saving submission to database',
        meta: {
          action: 'saveSubmissionMetadata',
          formId: form._id,
        },
        error,
      })
      return new DatabaseError('Error while saving submission to database')
    },
  )
}

/**
 * Sends email mode response to admin
 * @param adminEmailParams Parameters to be passed on to mail service
 * @returns okAsync(true) if response was sent successfully to all recipients
 * @returns errAsync(SendAdminEmailError) if at least one email failed to be sent
 */
export const sendSubmissionToAdmin = (
  adminEmailParams: Parameters<typeof MailService['sendSubmissionToAdmin']>[0],
): ResultAsync<true, SendAdminEmailError> => {
  return ResultAsync.fromPromise(
    MailService.sendSubmissionToAdmin(adminEmailParams),
    (error) => {
      logger.error({
        message: 'Error sending submission to admin',
        meta: {
          action: 'sendSubmissionToAdmin',
          submissionId: adminEmailParams.submission.id,
          formId: adminEmailParams.form._id,
        },
        error,
      })
      return new SendAdminEmailError()
    },
  )
}

/**
 * Extracts an array of answers to email fields
 * @param parsedResponses All form responses
 * @returns an array of all email field responses
 */
export const extractEmailAnswers = (
  parsedResponses: ProcessedFieldResponse[],
): string[] => {
  return parsedResponses.reduce<string[]>((acc, response) => {
    if (response.fieldType === BasicField.Email && response.answer) {
      acc.push(response.answer)
    }
    return acc
  }, [])
}

export const checkFormIsEmailMode = (
  form: IPopulatedForm,
): Result<IPopulatedEmailForm, ResponseModeError> => {
  if (isEmailModeForm(form)) {
    return ok(form)
  }
  return err(new ResponseModeError(ResponseMode.Email, form.responseMode))
}
