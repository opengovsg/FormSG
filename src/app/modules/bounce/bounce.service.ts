import { difference } from 'lodash'
import mongoose from 'mongoose'
import { errAsync, okAsync, Result, ResultAsync } from 'neverthrow'
import SNSMessageValidator from 'sns-validator'

import {
  BounceType,
  IBounceSchema,
  IEmailNotification,
  IPopulatedForm,
  ISnsNotification,
} from '../../../types'
import {
  createCloudWatchLogger,
  createLoggerWithLabel,
} from '../../config/logger'
import { EMAIL_HEADERS, EmailType } from '../../services/mail/mail.constants'
import MailService from '../../services/mail/mail.service'
import { SmsFactory } from '../../services/sms/sms.factory'
import { transformMongoError } from '../../utils/handle-mongo-error'
import { PossibleDatabaseError } from '../core/core.errors'
import { getCollabEmailsWithPermission } from '../form/form.utils'
import * as UserService from '../user/user.service'
import { UserWithContactNumber } from '../user/user.types'
import { isUserWithContactNumber } from '../user/user.utils'

import {
  InvalidNotificationError,
  MissingEmailHeadersError,
  ParseNotificationError,
  SendBounceSmsNotificationError,
} from './bounce.errors'
import getBounceModel from './bounce.model'
import {
  extractHeader,
  extractSuccessfulSmsRecipients,
  isBounceNotification,
} from './bounce.util'

const logger = createLoggerWithLabel(module)
const shortTermLogger = createCloudWatchLogger('email')
const Bounce = getBounceModel(mongoose)

// Hostname for AWS SNS URLs.
// Using this over sns-validator's default hostname because the latter
// does not adequately validate that requests only come from SNS.
const AWS_SNS_HOSTNAME = /^sns\.[a-z]{2}-[a-z]+-\d+\.amazonaws.com$/

/**
 * Verifies if a request object is correctly signed by Amazon SNS. More info:
 * https://docs.aws.amazon.com/sns/latest/dg/sns-verify-signature-of-message.html
 * Uses AWS provided https://github.com/aws/aws-js-sns-message-validator
 * @param body Body of Express request object
 * @returns true if request shape and signature are valid
 */
export const validateSnsRequest = (
  body: ISnsNotification,
): ResultAsync<true, InvalidNotificationError> => {
  return ResultAsync.fromPromise(
    new Promise((resolve, reject) => {
      const snsValidator = new SNSMessageValidator(AWS_SNS_HOSTNAME)

      snsValidator.validate(
        body as unknown as Record<string, unknown>,
        (err) => {
          if (err) {
            reject(err)
            return
          }

          resolve(true)
        },
      )
    }),
    (error) => {
      logger.error({
        message: 'Invalid Email Bounce SNS notification',
        meta: {
          action: 'validateSnsRequest',
          body,
        },
        error,
      })

      return new InvalidNotificationError()
    },
  )
}

/**
 * Logs all details of lost submission.
 * @param bounceDoc Document from the Bounce collection
 * @param notification Notification received from SNS
 * @param autoEmailRecipients Recipients who were emailed
 * @param autoSmsRecipients Recipients who were SMSed
 * @param hasDeactivated Whether the form was deactivated
 * @returns void
 */
export const logCriticalBounce = ({
  bounceDoc,
  notification,
  autoEmailRecipients,
  autoSmsRecipients,
  hasDeactivated,
}: {
  bounceDoc: IBounceSchema
  notification: IEmailNotification
  autoEmailRecipients: string[]
  autoSmsRecipients: UserWithContactNumber[]
  hasDeactivated: boolean
}): void => {
  const submissionId = extractHeader(notification, EMAIL_HEADERS.submissionId)
  const bounceInfo = isBounceNotification(notification)
    ? notification.bounce
    : undefined
  // Out of all bounces, how many were transient
  const numTransient = bounceDoc.bounces.reduce(
    (total, bounce) =>
      total +
      Number(bounce.hasBounced && bounce.bounceType === BounceType.Transient),
    0,
  )
  logger.warn({
    message: 'Bounced submission',
    meta: {
      action: 'logCriticalBounce',
      hasAutoEmailed: bounceDoc.hasAutoEmailed,
      hasAutoSmsed: bounceDoc.hasAutoSmsed,
      hasDeactivated,
      formId: String(bounceDoc.formId),
      submissionId: submissionId,
      recipients: bounceDoc.getEmails(),
      numRecipients: bounceDoc.bounces.length,
      numTransient,
      // Assume that this function is correctly only called when all recipients bounced
      numPermanent: bounceDoc.bounces.length - numTransient,
      autoEmailRecipients,
      autoSmsRecipients,
      // We know for sure that critical bounces can only happen because of bounce
      // notifications, so we don't expect this to be undefined
      bounceInfo: bounceInfo,
    },
  })
}

/**
 * Gets the emails of form admin and collaborators who do not appear in the
 * given Bounce document
 * @param populatedForm Form whose admin and collaborators should be included
 * @param bounceDoc Bounce document indicating which emails bounced
 * @returns array of emails
 */
const computeValidEmails = (
  populatedForm: IPopulatedForm,
  bounceDoc: IBounceSchema,
): string[] => {
  const collabEmails = getCollabEmailsWithPermission(
    populatedForm.permissionList,
  )
  const possibleEmails = collabEmails.concat(populatedForm.admin.email)
  return difference(possibleEmails, bounceDoc.getEmails())
}

/**
 * Notifies admin and collaborators via email that response was lost.
 * @param bounceDoc Document from Bounce collection
 * @param form Form corresponding to the formId from bounceDoc
 * @returns contact details for emails which were successfully sent. Note that
 * this doesn't mean the emails were received, only that they were delivered
 * to the mail server/carrier.
 */
export const sendEmailBounceNotification = (
  bounceDoc: IBounceSchema,
  form: IPopulatedForm,
  // Returns no errors. If emails fail, returns
  // empty array as list of recipients.
): ResultAsync<string[], never> => {
  // Email all collaborators
  const emailRecipients = computeValidEmails(form, bounceDoc)
  if (emailRecipients.length === 0) return okAsync([])
  return MailService.sendBounceNotification({
    emailRecipients,
    bouncedRecipients: bounceDoc.getEmails(),
    bounceType: bounceDoc.areAllPermanentBounces()
      ? BounceType.Permanent
      : BounceType.Transient,
    formTitle: form.title,
    formId: bounceDoc.formId,
  })
    .map(() => emailRecipients)
    .orElse((error) => {
      // Log error, then return empty array as email was sent
      logger.warn({
        message: 'Failed to send some bounce notification emails',
        meta: {
          action: 'notifyAdminOfBounce',
          formId: form._id,
        },
        error,
      })
      return okAsync([])
    })
}

/**
 * Notifies admin and collaborators via SMS that response was lost.
 * @param bounceDoc Document from Bounce collection
 * @param form Form corresponding to the formId from bounceDoc
 * @param possibleSmsRecipients Contact details of recipients to attempt to SMS
 * @returns contact details for SMSes which were successfully sent. Note that
 * this doesn't mean and SMSes were received, only that they were delivered
 * to the carrier.
 */
export const sendSmsBounceNotification = (
  bounceDoc: IBounceSchema,
  form: IPopulatedForm,
  possibleSmsRecipients: UserWithContactNumber[],
  // Returns no errors. If SMSes fail, returns
  // empty array as list of recipients.
): ResultAsync<UserWithContactNumber[], never> => {
  const smsResults = possibleSmsRecipients.map((recipient) =>
    SmsFactory.sendBouncedSubmissionSms({
      adminEmail: form.admin.email,
      adminId: String(form.admin._id),
      formId: form._id,
      formTitle: form.title,
      recipient: recipient.contact,
      recipientEmail: recipient.email,
    })
      .map(() => recipient)
      .mapErr(
        (error) => new SendBounceSmsNotificationError(error, recipient.contact),
      ),
  )
  return (
    ResultAsync.combineWithAllErrors(smsResults)
      // All succeeded
      .map(() => possibleSmsRecipients)
      .orElse((errors) => {
        logger.warn({
          message: 'Failed to send some bounce notification SMSes',
          meta: {
            action: 'notifyAdminOfBounce',
            formId: form._id,
            errors,
          },
        })
        return okAsync(
          extractSuccessfulSmsRecipients(errors, possibleSmsRecipients),
        )
      })
  )
}

/**
 * Logs the raw notification to the relevant log group.
 * @param notification The parsed SNS notification
 * @returns void
 */
export const logEmailNotification = (
  notification: IEmailNotification,
): void => {
  // This is the crucial log statement which allows us to debug bounce-related
  // issues, as it logs all the details about deliveries and bounces. Email
  // confirmation info goes to the short-term log group so we do not store
  // form fillers' information for too long, and everything else goes into the
  // main log group.
  const emailType = extractHeader(notification, EMAIL_HEADERS.emailType)
  if (
    emailType === EmailType.EmailConfirmation ||
    emailType === EmailType.VerificationOtp
  ) {
    shortTermLogger.info(notification)
  } else {
    logger.info({
      message: 'Email notification',
      meta: {
        action: 'logEmailNotification',
        ...notification,
      },
    })
  }
}

/**
 * Parses an SNS notification and updates the Bounce collection.
 * @param body The request body of the notification
 * @return the updated document from the Bounce collection or null if there are missing headers.
 */
export const getUpdatedBounceDoc = (
  notification: IEmailNotification,
): ResultAsync<
  IBounceSchema,
  MissingEmailHeadersError | PossibleDatabaseError
> => {
  const formId = extractHeader(notification, EMAIL_HEADERS.formId)
  if (!formId) return errAsync(new MissingEmailHeadersError())
  return ResultAsync.fromPromise(Bounce.findOne({ formId }).exec(), (error) => {
    logger.error({
      message: 'Error while retrieving Bounce document',
      meta: {
        action: 'getUpdatedBounceDoc',
        formId,
      },
    })
    return transformMongoError(error)
  }).map((bounceDoc) => {
    // Doc already exists for this form, so update it with latest info
    if (bounceDoc) {
      return bounceDoc.updateBounceInfo(notification)
    }
    // Create new doc from scratch
    return Bounce.fromSnsNotification(notification, formId)
  })
}

/**
 * Extracts the email type of a notification.
 * @param body The request body of the notification
 * @return the EmailType
 */
export const extractEmailType = (
  notification: IEmailNotification,
): string | undefined => {
  return extractHeader(notification, EMAIL_HEADERS.emailType)
}

/**
 * Retrieves contact details for admin and collaborators for whom
 * SMS notification should be attempted.
 * @param form The form whose editors should be found
 * @returns The contact details, filtered for the emails which have verified
 * contact numbers in the database
 */
export const getEditorsWithContactNumbers = (
  form: IPopulatedForm,
  // Never return an error. If database query fails, return empty array.
): ResultAsync<UserWithContactNumber[], never> => {
  const possibleEditors = [
    form.admin.email,
    ...getCollabEmailsWithPermission(form.permissionList, true),
  ]
  return UserService.findContactsForEmails(possibleEditors)
    .map((editors) => editors.filter(isUserWithContactNumber))
    .orElse((error) => {
      logger.warn({
        message: 'Failed to retrieve contact numbers for form editors',
        meta: {
          action: 'getEditorsWithContactNumbers',
          formId: form._id,
        },
        error,
      })
      return okAsync([])
    })
}

/**
 * Sends SMS to the given recipients informing them that the given form
 * was deactivated.
 * @param form Form which was deactivated
 * @param possibleSmsRecipients Recipients to attempt to notify
 * @returns true regardless of the outcome
 */
export const notifyAdminsOfDeactivation = (
  form: IPopulatedForm,
  possibleSmsRecipients: UserWithContactNumber[],
  // Best-effort attempt to send SMSes, don't propagate error upwards
): ResultAsync<true, never> => {
  const smsResults = possibleSmsRecipients.map((recipient) =>
    SmsFactory.sendFormDeactivatedSms({
      adminEmail: form.admin.email,
      adminId: String(form.admin._id),
      formId: form._id,
      formTitle: form.title,
      recipient: recipient.contact,
      recipientEmail: recipient.email,
    }),
  )
  return ResultAsync.combineWithAllErrors(smsResults)
    .map(() => true as const)
    .orElse((errors) => {
      logger.warn({
        message: 'Failed to send some form deactivation notification SMSes',
        meta: {
          action: 'notifyAdminsOfDeactivation',
          formId: form._id,
          errors,
        },
      })
      return okAsync(true as const)
    })
}

/**
 * Saves a document to the database.
 * @param bounceDoc Bounce document
 * @returns The saved document
 */
export const saveBounceDoc = (
  bounceDoc: IBounceSchema,
): ResultAsync<IBounceSchema, PossibleDatabaseError> => {
  return ResultAsync.fromPromise(bounceDoc.save(), (error) => {
    // Accept the risk that there might be concurrency problems
    // when multiple server instances try to access the same
    // document, due to notifications arriving asynchronously.
    // Hence avoid logging so logs do not get polluted
    if (!(error instanceof mongoose.Error.VersionError)) {
      logger.warn({
        message: 'Error while saving Bounce document',
        meta: {
          action: 'saveBounceDoc',
          formId: bounceDoc.formId,
        },
      })
    }
    return transformMongoError(error)
  })
}

/**
 * Safely parses an SNS notification.
 * @param message Content of notification
 */
export const safeParseNotification = (
  message: string,
): Result<IEmailNotification, ParseNotificationError> => {
  return Result.fromThrowable(
    () => JSON.parse(message),
    (error) => {
      logger.warn({
        message: 'Unable to parse SNS notification',
        meta: {
          action: 'safeParseNotification',
          message: message,
        },
        error,
      })
      return new ParseNotificationError()
    },
  )()
}
