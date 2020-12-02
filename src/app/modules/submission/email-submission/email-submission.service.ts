import crypto from 'crypto'
import { sumBy } from 'lodash'
import mongoose from 'mongoose'
import { errAsync, okAsync, ResultAsync } from 'neverthrow'

import { createLoggerWithLabel } from '../../../../config/logger'
import {
  FieldResponse,
  IEmailFormSchema,
  IEmailSubmissionSchema,
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
import { SendAdminEmailError } from '../submission.errors'
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
import {
  EmailAutoReplyField,
  EmailData,
  EmailDataForOneField,
  EmailFormField,
  EmailJsonField,
  IAttachmentInfo,
  SubmissionHash,
} from './email-submission.types'
import {
  concatAttachmentsAndResponses,
  getAnswerForCheckbox,
  getAnswerRowsForTable,
  getFormattedResponse,
  getInvalidFileExtensions,
  mapAttachmentsFromResponses,
} from './email-submission.util'

const EmailSubmissionModel = getEmailSubmissionModel(mongoose)
const logger = createLoggerWithLabel(module)

/**
 * Creates response and autoreply email data for a single response.
 * Helper function for createEmailData.
 * @param response Processed and validated response for one field
 * @param hashedFields IDs of fields whose responses have been verified by MyInfo hashes
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
      .reduce(
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
          autoReplyData: [] as EmailAutoReplyField[],
          jsonData: [] as EmailJsonField[],
          formData: [] as EmailFormField[],
        },
      )
  )
}

/**
 * Validates that the attachments in a submission do not violate form-level
 * constraints e.g. form-wide attachment size limit.
 * @param parsedResponses Unprocessed responses
 */
export const validateAttachments = (
  parsedResponses: FieldResponse[],
): ResultAsync<true, InvalidFileExtensionError | AttachmentTooLargeError> => {
  const logMeta = { action: 'validateAttachments' }
  const attachments = mapAttachmentsFromResponses(parsedResponses)
  // Check if total attachments size is < 7mb
  const totalAttachmentSize = sumBy(attachments, (a) => a.content.byteLength)
  if (totalAttachmentSize > 7000000) {
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
 */
export const saveSubmissionMetadata = (
  form: IEmailFormSchema,
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

export const sendSubmissionToAdmin = (
  adminEmailParams: Parameters<typeof MailService['sendSubmissionToAdmin']>[0],
): ResultAsync<true, SendAdminEmailError> => {
  const errorLogParams = {
    message: 'Error sending submission to admin',
    meta: {
      action: 'sendSubmissionToAdmin',
      submissionId: adminEmailParams.submission.id,
      formId: adminEmailParams.form._id,
    },
  }
  return ResultAsync.fromPromise(
    MailService.sendSubmissionToAdmin(adminEmailParams),
    (error) => {
      logger.error({ ...errorLogParams, error })
      return new SendAdminEmailError()
    },
  ).andThen((result) => {
    if (!result) {
      logger.error(errorLogParams)
      return errAsync(new SendAdminEmailError())
    }
    return okAsync(true)
  })
}
