import { ObjectId } from 'bson-ext'
import { isEmpty } from 'lodash'
import moment from 'moment-timezone'
import mongoose, { Cursor as QueryCursor, QueryOptions } from 'mongoose'
import { errAsync, okAsync, ResultAsync } from 'neverthrow'

import {
  FormIssueStreamData,
  IFormIssueSchema,
  IPopulatedForm,
} from 'src/types'

import { FormIssueMetaDto, ProcessedIssueMeta } from '../../../../shared/types'
import { createLoggerWithLabel } from '../../config/logger'
import getFormIssueModel from '../../models/form_issue.server.model'
import {
  MailGenerationError,
  MailSendError,
} from '../../services/mail/mail.errors'
import MailService from '../../services/mail/mail.service'
import { getStartOfDay } from '../../utils/date'
import { getMongoErrorMessage } from '../../utils/handle-mongo-error'
import { DatabaseError } from '../core/core.errors'
import { FormNotFoundError } from '../form/form.errors'

const logger = createLoggerWithLabel(module)

const FormIssueModel = getFormIssueModel(mongoose)

/**
 * Inserts given form issue to the database.
 * @param formId the formId to insert the feedback for
 * @param issue the description of the issue reported
 * @param email the contact info for form creator to follow up the issue with
 * @returns ok(true) if successfully inserted
 * @returns err(DatabaseError) on database error
 */
export const insertFormIssue = ({
  formId,
  issue,
  email,
}: {
  formId: string
  issue: string
  email?: string
}): ResultAsync<IFormIssueSchema, FormNotFoundError | DatabaseError> => {
  if (!mongoose.Types.ObjectId.isValid(formId)) {
    return errAsync(new FormNotFoundError())
  }
  return ResultAsync.fromPromise(
    FormIssueModel.create({
      formId: formId,
      issue: issue,
      ...(email && { email }),
    }),
    (error) => {
      logger.error({
        message: 'Database error when creating form issue document',
        meta: {
          action: 'insertFormIssue',
          formId,
        },
        error,
      })

      return new DatabaseError('Form issue could not be created')
    },
  )
}

/**
 * Checks if there are any prior issues reported today given a formId.
 * The `_id` field of the form is used to check for prior issues, even though
 * mongo objectId is accurate only up to seconds, it should be fine, as we do
 * not expect more than 1 issue complain per form per second. `created` field is
 * not used for now as the column is not being indexed (to reduce additional
 * write overhead).
 * In the unlikely chance of this happening, form admin and collaborators may
 * receive up to the number of issues reported per second per form.
 * @param formIssue the formIssue object that was just inserted
 * @returns ok(true) if successfully inserted
 * @returns err(DatabaseError) on database error
 */
const getIsFirstIssueForFormToday = ({
  formIssue,
}: {
  formIssue: IFormIssueSchema
}): ResultAsync<boolean, DatabaseError> => {
  const startOfDay =
    formIssue._id instanceof ObjectId
      ? getStartOfDay({ date: formIssue._id.getTimestamp() })
      : getStartOfDay()

  const issueId = formIssue._id as ObjectId
  const queryFilter = {
    formId: formIssue.formId,
    _id: {
      $gte: ObjectId.createFromTime(startOfDay.getTime() / 1000),
      $lt: issueId,
    },
  }
  return ResultAsync.fromPromise(
    FormIssueModel.countDocuments(queryFilter).limit(1).exec(),
    (error) => {
      logger.error({
        message: 'Database error when creating form issue document',
        meta: {
          formId: formIssue.formId,
          action: 'insertFormIssue',
        },
        error,
      })
      return new DatabaseError(
        'Failed to count the document in the formIssue collection',
      )
    },
  ).andThen((count) => {
    return okAsync(count === 0)
  })
}

export const getIsFirstIssueForFormTodayForTesting = getIsFirstIssueForFormToday

/**
 * Notifies form admin and collaborators whenever public reports an issue for a
 * form first time of any day.
 * Since the current logic will only send email at most once a day per form, if
 * the email sending fails for whatever reason, we will only print a log for
 * now, and will not throw the error to the caller.
 * @param form the form object where public reports an issue
 * @param formIssue the form issue object where the issue is recorded
 */
export const notifyFormAdmin = ({
  form,
  formIssue,
}: {
  form: IPopulatedForm
  formIssue: IFormIssueSchema
}): ResultAsync<boolean, never> => {
  if (form.admin && form.admin.email !== '') {
    const logMeta = {
      action: 'notifyFormAdmin',
      formIssue,
    }

    return getIsFirstIssueForFormToday({ formIssue: formIssue })
      .andThen((isFirstIssueForFormToday) => {
        return isFirstIssueForFormToday
          ? MailService.sendFormIssueReportedNotificationToAdmin({ form })
          : okAsync(false)
      })
      .map((ret) => {
        return ret
      })
      .orElse((error) => {
        switch (error.constructor) {
          case MailGenerationError:
          case MailSendError:
            logger.warn({
              message: 'Failed to send mail to form admin and collaborators',
              meta: logMeta,
              error,
            })
            break
          case DatabaseError:
            logger.warn({
              message:
                'Failed to identify if notification to form admin and collaborators are needed',
              meta: logMeta,
              error,
            })
            break
        }
        return okAsync(false)
      })
  }
  logger.warn({
    message:
      'Unable to find email address of form admin. Skip sending email. ' +
      'Please check why email address is not found',
    meta: {
      action: 'notifyFormAdmin',
    },
  })
  return okAsync(false)
}

/**
 * Returned processed object containing count of issues, and
 * list of issue.
 * @param formId the form to retrieve issue for
 * @returns ok(issue response object) on success
 * @returns err(DatabaseError) if database error occurs during query
 */
export const getFormIssues = (
  formId: string,
): ResultAsync<FormIssueMetaDto, DatabaseError> => {
  return ResultAsync.fromPromise(
    FormIssueModel.find({ formId }).sort({ _id: 1 }).exec(),
    (error) => {
      logger.error({
        message: 'Error retrieving issue documents from database',
        meta: {
          action: 'getFormIssues',
        },
        error,
      })
      return new DatabaseError(getMongoErrorMessage(error))
    },
  ).map((issues) => {
    if (isEmpty(issues)) {
      return {
        issues: [],
        count: 0,
      }
    }

    const metadata = issues.map((data, idx) => {
      const metadataEntry: ProcessedIssueMeta = {
        timestamp: moment(data.created).valueOf(),
        issue: data.issue,
        email: data.email ?? '',
        index: idx + 1,
      }
      return metadataEntry
    })
    return {
      issues: metadata,
      count: issues.length,
    }
  })
}

/**
 * Retrieves form issue stream.
 * @param formId the formId of form to retrieve issue for
 * @returns form issue stream
 */
export const getFormIssueStream = (
  formId: string,
): QueryCursor<FormIssueStreamData, QueryOptions<IFormIssueSchema>> => {
  return FormIssueModel.getIssueCursorByFormId(formId, [
    'issue',
    'email',
    'created',
  ])
}
