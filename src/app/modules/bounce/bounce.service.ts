import axios from 'axios'
import crypto from 'crypto'
import { difference, isEmpty } from 'lodash'
import mongoose from 'mongoose'

import {
  createCloudWatchLogger,
  createLoggerWithLabel,
} from '../../../config/logger'
import {
  BounceType,
  IBounceSchema,
  IEmailNotification,
  IPopulatedForm,
  ISnsNotification,
} from '../../../types'
import { EMAIL_HEADERS, EmailType } from '../../services/mail/mail.constants'
import MailService from '../../services/mail/mail.service'
import { SmsFactory } from '../../services/sms/sms.factory'
import { getCollabEmailsWithPermission } from '../form/form.utils'
import * as UserService from '../user/user.service'

import getBounceModel from './bounce.model'
import { AdminNotificationResult, UserWithContactNumber } from './bounce.types'
import {
  extractHeader,
  extractSmsErrors,
  extractSuccessfulSmsRecipients,
  isBounceNotification,
} from './bounce.util'

const logger = createLoggerWithLabel(module)
const shortTermLogger = createCloudWatchLogger('email')
const Bounce = getBounceModel(mongoose)

// Note that these need to be ordered in order to generate
// the correct string to sign
const snsKeys: { key: keyof ISnsNotification; toSign: boolean }[] = [
  { key: 'Message', toSign: true },
  { key: 'MessageId', toSign: true },
  { key: 'Timestamp', toSign: true },
  { key: 'TopicArn', toSign: true },
  { key: 'Type', toSign: true },
  { key: 'Signature', toSign: false },
  { key: 'SigningCertURL', toSign: false },
  { key: 'SignatureVersion', toSign: false },
]

// Hostname for AWS URLs
const AWS_HOSTNAME = '.amazonaws.com'

/**
 * Checks that a request body has all the required keys for a message from SNS.
 * @param body body from Express request object
 * @returns true if all required keys are present
 */
const hasRequiredKeys = (body: any): body is ISnsNotification => {
  return !isEmpty(body) && snsKeys.every((keyObj) => body[keyObj.key])
}

/**
 * Validates that a URL points to a certificate belonging to AWS.
 * @param url URL to check
 * @returns true if URL is valid
 */
const isValidCertUrl = (certUrl: string): boolean => {
  const parsed = new URL(certUrl)
  return (
    parsed.protocol === 'https:' &&
    parsed.pathname.endsWith('.pem') &&
    parsed.hostname.endsWith(AWS_HOSTNAME)
  )
}

/**
 * Returns an ordered list of keys to include in SNS signing string.
 * @returns array of keys
 */
const getSnsKeysToSign = (): (keyof ISnsNotification)[] => {
  return snsKeys.filter((keyObj) => keyObj.toSign).map((keyObj) => keyObj.key)
}

/**
 * Generates the string to sign.
 * @param body body from Express request object
 * @returns the basestring to be signed
 */
const getSnsBasestring = (body: ISnsNotification): string => {
  return getSnsKeysToSign().reduce((result, key) => {
    return result + key + '\n' + body[key] + '\n'
  }, '')
}

/**
 * Verify signature for SNS request
 * @param body body from Express request object
 * @returns true if signature is valid
 */
const isValidSnsSignature = async (
  body: ISnsNotification,
): Promise<boolean> => {
  const { data: cert } = await axios.get(body.SigningCertURL)
  const verifier = crypto.createVerify('RSA-SHA1')
  verifier.update(getSnsBasestring(body), 'utf8')
  return verifier.verify(cert, body.Signature, 'base64')
}

/**
 * Verifies if a request object is correctly signed by Amazon SNS. More info:
 * https://docs.aws.amazon.com/sns/latest/dg/sns-verify-signature-of-message.html
 * @param body Body of Express request object
 * @returns true if request shape and signature are valid
 */
export const isValidSnsRequest = async (
  body: ISnsNotification,
): Promise<boolean> => {
  const isValid =
    hasRequiredKeys(body) &&
    body.SignatureVersion === '1' && // We only check for SHA1-RSA signatures
    isValidCertUrl(body.SigningCertURL) &&
    (await isValidSnsSignature(body))
  return isValid
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
 * Notifies admin and collaborators via email and SMS that response was lost.
 * @param bounceDoc Document from Bounce collection
 * @param form Form corresponding to the formId from bounceDoc
 * @param possibleSmsRecipients Contact details of recipients to attempt to SMS
 * @returns contact details for email and SMSes which were successfully sent. Note that
 * this doesn't mean the emails and SMSes were received, only that they were delivered
 * to the mail server/carrier.
 */
export const notifyAdminsOfBounce = async (
  bounceDoc: IBounceSchema,
  form: IPopulatedForm,
  possibleSmsRecipients: UserWithContactNumber[],
): Promise<AdminNotificationResult> => {
  // Email all collaborators
  const emailRecipients = computeValidEmails(form, bounceDoc)
  if (emailRecipients.length > 0) {
    await MailService.sendBounceNotification({
      emailRecipients,
      bouncedRecipients: bounceDoc.getEmails(),
      bounceType: bounceDoc.areAllPermanentBounces()
        ? BounceType.Permanent
        : BounceType.Transient,
      formTitle: form.title,
      formId: bounceDoc.formId,
    })
  }

  // Sms given recipients
  const smsPromises = possibleSmsRecipients.map((recipient) =>
    SmsFactory.sendBouncedSubmissionSms({
      adminEmail: form.admin.email,
      adminId: form.admin._id,
      formId: form._id,
      formTitle: form.title,
      recipient: recipient.contact,
      recipientEmail: recipient.email,
    }),
  )

  // neverthrow#combine is not used since we do not want to short circuit on the first error.
  const smsResults = await Promise.all(smsPromises)
  const successfulSmsRecipients = extractSuccessfulSmsRecipients(
    smsResults,
    possibleSmsRecipients,
  )
  if (successfulSmsRecipients.length < possibleSmsRecipients.length) {
    logger.warn({
      message: 'Failed to send some bounce notification SMSes',
      meta: {
        action: 'notifyAdminOfBounce',
        formId: form._id,
        reasons: extractSmsErrors(smsResults),
      },
    })
  }
  return { emailRecipients, smsRecipients: successfulSmsRecipients }
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
export const getUpdatedBounceDoc = async (
  notification: IEmailNotification,
): Promise<IBounceSchema | null> => {
  const formId = extractHeader(notification, EMAIL_HEADERS.formId)
  if (!formId) return null
  const oldBounces = await Bounce.findOne({ formId })
  return oldBounces
    ? oldBounces.updateBounceInfo(notification)
    : Bounce.fromSnsNotification(notification, formId)
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
export const getEditorsWithContactNumbers = async (
  form: IPopulatedForm,
): Promise<UserWithContactNumber[]> => {
  const possibleEditors = [
    form.admin.email,
    ...getCollabEmailsWithPermission(form.permissionList, true),
  ]
  const smsRecipientsResult = await UserService.findContactsForEmails(
    possibleEditors,
  )
  if (smsRecipientsResult.isOk()) {
    return smsRecipientsResult.value.filter(
      (r) => !!r.contact,
    ) as UserWithContactNumber[]
  } else {
    logger.warn({
      message: 'Failed to retrieve contact numbers for form editors',
      meta: {
        action: 'getEditorsWithContactNumbers',
        formId: form._id,
      },
    })
    return []
  }
}

/**
 * Sends SMS to the given recipients informing them that the given form
 * was deactivated.
 * @param form Form which was deactivated
 * @param possibleSmsRecipients Recipients to attempt to notify
 * @returns true regardless of the outcome
 */
export const notifyAdminsOfDeactivation = async (
  form: IPopulatedForm,
  possibleSmsRecipients: UserWithContactNumber[],
): Promise<true> => {
  const smsPromises = possibleSmsRecipients.map((recipient) =>
    SmsFactory.sendFormDeactivatedSms({
      adminEmail: form.admin.email,
      adminId: form.admin._id,
      formId: form._id,
      formTitle: form.title,
      recipient: recipient.contact,
      recipientEmail: recipient.email,
    }),
  )

  // neverthrow#combine is not used since we do not want to short circuit on the first error.
  const smsResults = await Promise.all(smsPromises)
  const smsErrors = extractSmsErrors(smsResults)
  if (smsErrors.length > 0) {
    logger.warn({
      message: 'Failed to send some form deactivation notification SMSes',
      meta: {
        action: 'notifyAdminsOfDeactivation',
        formId: form._id,
        reasons: smsErrors,
      },
    })
  }
  return true
}
