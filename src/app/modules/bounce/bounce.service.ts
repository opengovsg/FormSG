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
  // TODO (private #30): enable form deactivation
  // BounceType,
  IBounceSchema,
  IEmailNotification,
  IFormSchema,
  IPopulatedForm,
  ISnsNotification,
} from '../../../types'
import { EMAIL_HEADERS, EmailType } from '../../constants/mail'
import getFormModel from '../../models/form.server.model'
import MailService from '../../services/mail.service'

import getBounceModel from './bounce.model'
import { extractHeader, isBounceNotification } from './bounce.util'

const logger = createLoggerWithLabel(module)
const shortTermLogger = createCloudWatchLogger('email')
const Bounce = getBounceModel(mongoose)
const Form = getFormModel(mongoose)

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
 * @param {Object} body body from Express request object
 */
const hasRequiredKeys = (body: any): body is ISnsNotification => {
  return !isEmpty(body) && snsKeys.every((keyObj) => body[keyObj.key])
}

/**
 * Validates that a URL points to a certificate belonging to AWS.
 * @param {String} url URL to check
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
 */
const getSnsKeysToSign = (): (keyof ISnsNotification)[] => {
  return snsKeys.filter((keyObj) => keyObj.toSign).map((keyObj) => keyObj.key)
}

/**
 * Generates the string to sign.
 * @param {Object} body body from Express request object
 */
const getSnsBasestring = (body: ISnsNotification): string => {
  return getSnsKeysToSign().reduce((result, key) => {
    return result + key + '\n' + body[key] + '\n'
  }, '')
}

/**
 * Verify signature for SNS request
 * @param {Object} body body from Express request object
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
 * @param {Object} body Body of Express request object
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

// Writes a log message if all recipients have bounced
export const logCriticalBounce = (
  bounceDoc: IBounceSchema,
  notification: IEmailNotification,
  autoEmailRecipients: string[],
): void => {
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
    message: 'Critical bounce',
    meta: {
      action: 'logCriticalBounce',
      hasAutoEmailed: bounceDoc.hasAutoEmailed,
      formId: String(bounceDoc.formId),
      submissionId: submissionId,
      recipients: bounceDoc.getEmails(),
      numRecipients: bounceDoc.bounces.length,
      numTransient,
      // Assume that this function is correctly only called when all recipients bounced
      numPermanent: bounceDoc.bounces.length - numTransient,
      autoEmailRecipients,
      // We know for sure that critical bounces can only happen because of bounce
      // notifications, so we don't expect this to be undefined
      bounceInfo: bounceInfo,
    },
  })
}

export const deactivateFormFromBounce = async (
  bounceDoc: IBounceSchema,
): Promise<IFormSchema | null> => {
  return Form.deactivateById(bounceDoc.formId)
}

const computeValidEmails = (
  populatedForm: IPopulatedForm,
  bounceDoc: IBounceSchema,
): string[] => {
  const collabEmails = populatedForm.permissionList
    ? populatedForm.permissionList.map((collab) => collab.email)
    : []
  const possibleEmails = collabEmails.concat(populatedForm.admin.email)
  return difference(possibleEmails, bounceDoc.getEmails())
}

export const notifyAdminOfBounce = async (
  bounceDoc: IBounceSchema,
): Promise<string[]> => {
  // No further action required, no emails sent
  if (bounceDoc.hasAutoEmailed) return []
  const form = await Form.getFullFormById(bounceDoc.formId)
  if (!form) {
    logger.error({
      message: 'Unable to retrieve form',
      meta: {
        action: 'notifyAdminOfBounce',
        formId: bounceDoc.formId,
      },
    })
    return []
  }
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
  return emailRecipients
}

/**
 * Logs the raw notification to the relevant log group.
 * @param notification The parsed SNS notification
 */
export const logEmailNotification = (
  notification: IEmailNotification,
): void => {
  // This is the crucial log statement which allows us to debug bounce-related
  // issues, as it logs all the details about deliveries and bounces. Email
  // confirmation info goes to the short-term log group so we do not store
  // form fillers' information for too long, and everything else goes into the
  // main log group.
  if (
    extractHeader(notification, EMAIL_HEADERS.emailType) ===
    EmailType.EmailConfirmation
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
