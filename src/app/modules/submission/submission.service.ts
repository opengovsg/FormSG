import omit from 'lodash/omit'
import mongoose from 'mongoose'
import { errAsync, okAsync, ResultAsync } from 'neverthrow'

import { ParsedClearFormFieldResponse } from 'src/types/api'

import {
  EmailRespondentConfirmationField,
  IAttachmentInfo,
  IPopulatedForm,
  ISubmissionSchema,
} from '../../../types'
import { createLoggerWithLabel } from '../../config/logger'
import getPendingSubmissionModel from '../../models/pending_submission.server.model'
import getSubmissionModel from '../../models/submission.server.model'
import MailService from '../../services/mail/mail.service'
import { AutoReplyMailData } from '../../services/mail/mail.types'
import { createQueryWithDateParam, isMalformedDate } from '../../utils/date'
import {
  getMongoErrorMessage,
  transformMongoError,
} from '../../utils/handle-mongo-error'
import {
  DatabaseDuplicateKeyError,
  DatabaseError,
  MalformedParametersError,
} from '../core/core.errors'
import { InvalidSubmissionIdError } from '../feedback/feedback.errors'

import {
  AttachmentTooLargeError,
  InvalidFileExtensionError,
  PendingSubmissionNotFoundError,
  SendEmailConfirmationError,
  SubmissionNotFoundError,
} from './submission.errors'
import {
  areAttachmentsMoreThan7MB,
  getInvalidFileExtensions,
  mapAttachmentsFromResponses,
} from './submission.utils'

const logger = createLoggerWithLabel(module)
const SubmissionModel = getSubmissionModel(mongoose)
const PendingSubmissionModel = getPendingSubmissionModel(mongoose)

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
 * @param param0.responsesData Subset of responses to be included in email confirmation
 * @param param0.attachments Attachments to be included in email
 * @param recipientData Array of objects that contains autoreply mail data to override with defaults
 * @returns ok(true) if all emails were sent successfully
 * @returns err(SendEmailConfirmationError) if any email failed to be sent
 */
export const sendEmailConfirmations = <S extends ISubmissionSchema>({
  form,
  submission,
  responsesData = [],
  attachments,
  recipientData,
}: {
  form: IPopulatedForm
  submission: S
  responsesData?: EmailRespondentConfirmationField[]
  attachments?: IAttachmentInfo[]
  recipientData: AutoReplyMailData[]
}): ResultAsync<true, SendEmailConfirmationError> => {
  const logMeta = {
    action: 'sendEmailConfirmations',
    formId: form._id,
    submissionid: submission._id,
  }
  if (recipientData.length === 0) {
    return okAsync(true)
  }
  const sentEmailsPromise = MailService.sendAutoReplyEmails({
    form,
    submission,
    attachments,
    responsesData,
    autoReplyMailDatas: recipientData,
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
    return okAsync(true as const)
  })
}

/**
 * Checks if submissionId exists amongst all the form submissions.
 *
 * @param submissionId the submission id to find amongst all the form submissions
 *
 * @returns ok(true) if submission id exists amongst all the form submissions
 * @returns err(InvalidSubmissionIdError) if submissionId does not exist amongst all the form submissions
 * @returns err(DatabaseError) if database query errors
 */
export const doesSubmissionIdExist = (
  submissionId: string,
): ResultAsync<true, InvalidSubmissionIdError | DatabaseError> =>
  ResultAsync.fromPromise(
    SubmissionModel.exists({
      _id: submissionId,
    }),
    (error) => {
      logger.error({
        message: 'Error finding _id from submissions collection in database',
        meta: {
          action: 'doesSubmissionIdExist',
          submissionId,
        },
        error,
      })

      return new DatabaseError(getMongoErrorMessage(error))
    },
  ).andThen((hasSubmissionId) => {
    if (!hasSubmissionId) {
      return errAsync(new InvalidSubmissionIdError())
    }
    return okAsync(true as const)
  })

/**
 * @param submissionId the submission id to find amongst all the form submissions
 *
 * @returns ok(submission document) if retrieval is successful
 * @returns err(SubmissionNotFoundError) if submission does not exist in the database
 * @returns err(DatabaseError) if database errors occurs whilst retrieving user
 */
export const findSubmissionById = (
  submissionId: string,
): ResultAsync<ISubmissionSchema, DatabaseError | SubmissionNotFoundError> => {
  return ResultAsync.fromPromise(
    SubmissionModel.findById(submissionId).exec(),
    (error) => {
      logger.error({
        message: 'Database find submission error',
        meta: {
          action: 'findSubmissionById',
          submissionId,
        },
        error,
      })
      return new DatabaseError(getMongoErrorMessage(error))
    },
  ).andThen((submission) => {
    if (!submission) {
      return errAsync(new SubmissionNotFoundError())
    }
    return okAsync(submission)
  })
}

/**
 * Copies a pending submission by ID to the submission collection. For correctness,
 * this should always be done within a transaction, thus a session must be provided.
 *
 * @param pendingSubmissionId the id of the pending submission to confirm
 * @param session the mongoose transaction session to be used, if any
 *
 * @returns ok(submission document) if a submission document is successfully created
 * @returns err(PendingSubmissionNotFoundError) if pending submission does not exist in the database
 * @returns err(DatabaseError) if database errors occurs while copying the document over
 */
export const copyPendingSubmissionToSubmissions = (
  pendingSubmissionId: string,
  session: mongoose.ClientSession,
): ResultAsync<
  ISubmissionSchema,
  DatabaseError | PendingSubmissionNotFoundError
> => {
  const logMeta = {
    action: 'confirmPendingSubmission',
    pendingSubmissionId,
  }
  return ResultAsync.fromPromise(
    PendingSubmissionModel.findById(pendingSubmissionId, null, {
      // readPreference from transaction isn't respected, thus we are setting it on operation
      readPreference: 'primary',
    }).session(session),
    (error) => {
      logger.error({
        message: 'Database find pending submission error',
        meta: logMeta,
        error,
      })
      return new DatabaseError(getMongoErrorMessage(error))
    },
  )
    .andThen((submission) => {
      if (!submission) {
        return errAsync(new PendingSubmissionNotFoundError())
      }
      return okAsync(submission)
    })
    .andThen((pendingSubmission) => {
      const submissionContent = omit(pendingSubmission, [
        '_id',
        'created',
        'lastModified',
      ])
      const submission = new SubmissionModel({
        // Explicitly copy over the pending submission's _id
        ...submissionContent,
        _id: pendingSubmissionId,
      })

      return ResultAsync.fromPromise(submission.save({ session }), (error) => {
        logger.error({
          message: 'Database save submission error',
          meta: logMeta,
          error,
        })
        return transformMongoError(error)
      }).orElse((error) => {
        const isDuplicateKeyError = error instanceof DatabaseDuplicateKeyError

        if (!isDuplicateKeyError) {
          return errAsync(new DatabaseError(getMongoErrorMessage(error)))
        }

        // Failed to save due to duplicate keys.
        logger.error({
          message:
            'Failed to move pending submission to submission: duplicate key error in submission collection',
          meta: logMeta,
          error,
        })

        // Recover by attempting to save with a different id.
        const recoverySubmission = new SubmissionModel(submissionContent)
        // TODO: Set alarms for both branches
        return ResultAsync.fromPromise(
          recoverySubmission.save({ session }),
          (error) => {
            logger.error({
              message: 'Failed to recover from duplicate key error',
              meta: logMeta,
              error,
            })
            return new DatabaseError(getMongoErrorMessage(error))
          },
        ).andThen((recoverySubmission) => {
          logger.warn({
            message: `Successfully recovered from duplicate key error`,
            meta: {
              submissionId: recoverySubmission._id,
              ...logMeta,
            },
            error,
          })
          return okAsync(recoverySubmission)
        })
      })
    })
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
  parsedResponses: ParsedClearFormFieldResponse[],
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
    return okAsync(true as const)
  })
}
