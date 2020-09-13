import axios from 'axios'
import crypto from 'crypto'
import { isEmpty } from 'lodash'
import mongoose from 'mongoose'

import {
  createCloudWatchLogger,
  createLoggerWithLabel,
} from '../../../config/logger'
import {
  IBounceNotification,
  IBounceSchema,
  IEmailNotification,
  ISnsNotification,
} from '../../../types'
import { EMAIL_HEADERS, EmailType } from '../../constants/mail'

import getBounceModel from './bounce.model'
import { extractHeader, isBounceNotification } from './bounce.util'

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
const logCriticalBounce = (
  bounceDoc: IBounceSchema,
  submissionId: string,
  bounceInfo: IBounceNotification['bounce'] | undefined,
): void => {
  if (bounceDoc.isCriticalBounce()) {
    logger.warn({
      message: 'Critical bounce',
      meta: {
        action: 'updateBounces',
        hasAlarmed: bounceDoc.hasAlarmed,
        formId: String(bounceDoc.formId),
        submissionId,
        recipients: bounceDoc.bounces.map((emailInfo) => emailInfo.email),
        // We know for sure that critical bounces can only happen because of bounce
        // notifications, so we don't expect this to be undefined
        bounceInfo: bounceInfo,
      },
    })
    // TODO (private #31): autoemail and set hasAlarmed to true. Currently
    // hasAlarmed is a dangling key.
    bounceDoc.hasAlarmed = true
    // TODO (private #31): convert bounceType to enum.
  }
}

/**
 * Logs the raw notification to the relevant log group.
 * @param notification The parsed SNS notification
 */
const logEmailNotification = (notification: IEmailNotification): void => {
  if (
    extractHeader(notification, EMAIL_HEADERS.emailType) ===
    EmailType.EmailConfirmation
  ) {
    shortTermLogger.info(notification)
  } else {
    logger.info({
      message: 'Email notification',
      meta: {
        action: 'updateBounces',
        ...notification,
      },
    })
  }
}

/**
 * Parses an SNS notification and updates the Bounce collection.
 * @param body The request body of the notification
 */
export const updateBounces = async (body: ISnsNotification): Promise<void> => {
  const notification: IEmailNotification = JSON.parse(body.Message)
  // This is the crucial log statement which allows us to debug bounce-related
  // issues, as it logs all the details about deliveries and bounces. Email
  // confirmation info goes to the short-term log group so we do not store
  // form fillers' information for too long, and everything else goes into the
  // main log group.
  logEmailNotification(notification)
  const latestBounces = Bounce.fromSnsNotification(notification)
  if (!latestBounces) return
  const formId = latestBounces.formId
  const submissionId = extractHeader(notification, EMAIL_HEADERS.submissionId)
  const bounceInfo = isBounceNotification(notification) && notification.bounce
  const oldBounces = await Bounce.findOne({ formId })
  if (oldBounces) {
    oldBounces.merge(latestBounces, notification)
  }
  const bounce = oldBounces ?? latestBounces
  logCriticalBounce(bounce, submissionId, bounceInfo)
  await bounce.save()
}
