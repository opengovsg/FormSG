import omit from 'lodash/omit'
import mongoose from 'mongoose'
import { errAsync, okAsync, ResultAsync } from 'neverthrow'

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
import { getMongoErrorMessage } from '../../utils/handle-mongo-error'
import { DatabaseError, MalformedParametersError } from '../core/core.errors'
import { InvalidSubmissionIdError } from '../feedback/feedback.errors'

import {
  PendingSubmissionNotFoundError,
  SendEmailConfirmationError,
  SubmissionNotFoundError,
} from './submission.errors'

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
 * Moves a pending submission by ID to the submission collection. For correctness,
 * this should always be done within a transaction, thus a session must be provided.
 *
 * @param pendingSubmissionId the id of the pending submission to confirm
 * @param session the mongoose transaction session to be used, if any
 *
 * @returns ok(submission document) if a submission document is successfully created
 * @returns err(PendingSubmissionNotFoundError) if pending submission does not exist in the database
 * @returns err(DatabaseError) if database errors occurs while copying the document over
 */
export const movePendingSubmissionToSubmissions = (
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
    PendingSubmissionModel.findById(pendingSubmissionId).session(session),
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
      const submission = new SubmissionModel(
        omit(pendingSubmission, ['_id', 'created', 'lastModified']),
      )

      return ResultAsync.fromPromise(submission.save({ session }), (error) => {
        logger.error({
          message: 'Database save submission error',
          meta: logMeta,
          error,
        })
        return new DatabaseError(getMongoErrorMessage(error))
      })
    })
}
