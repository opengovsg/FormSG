import axios from 'axios'
import crypto from 'crypto'
import { get, isEmpty } from 'lodash'
import mongoose from 'mongoose'

import { createCloudWatchLogger } from '../../../config/logger'
import { IBounceSchema } from '../../../types'
import getBounceModel from '../../models/bounce.server.model'

import {
  IEmailNotification,
  isDeliveryNotification,
  ISnsNotification,
} from './sns.types'

const logger = createCloudWatchLogger('email')
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

// Updates an old bounce document with info from a new bounce document as well
// as an SNS notification. This function does 3 things:
// 1) If the old bounce document indicates that an email bounced, set hasBounced
// to true for that email.
// 2) If the new delivery notification indicates that an email was delivered
// successfully, set hasBounced to false for that email, even if the old bounce
// document indicates that that email previously bounced.
// 3) Update the old recipient list according to the newest bounce notification.
const updateBounceDoc = (
  oldBounces: IBounceSchema,
  latestBounces: IBounceSchema,
  snsInfo: IEmailNotification,
): void => {
  const isDelivery = isDeliveryNotification(snsInfo)
  oldBounces.bounces.forEach((oldBounce) => {
    // If we were previously notified that a given email has bounced,
    // we want to retain that information
    if (oldBounce.hasBounced) {
      // Check if the latest recipient list contains that email
      const matchedLatestBounce = latestBounces.bounces.find(
        (newBounce) => newBounce.email === oldBounce.email,
      )
      // Check if the latest notification indicates that this email
      // actually succeeded
      const hasSubsequentlySucceeded =
        isDelivery &&
        get(snsInfo, 'delivery.recipients').includes(oldBounce.email)
      if (matchedLatestBounce) {
        // Set the latest bounce status based on the latest notification
        matchedLatestBounce.hasBounced = !hasSubsequentlySucceeded
      }
    }
  })
  oldBounces.bounces = latestBounces.bounces
}

// Writes a log message if all recipients have bounced
const logCriticalBounce = (bounceInfo: IBounceSchema, formId: string): void => {
  if (
    !bounceInfo.hasAlarmed &&
    bounceInfo.bounces.every((emailInfo) => emailInfo.hasBounced)
  ) {
    logger.warn({
      type: 'CRITICAL BOUNCE',
      formId,
      recipients: bounceInfo.bounces.map((emailInfo) => emailInfo.email),
    })
    // We don't want a flood of logs and alarms, so we use this to limit the rate of
    // critical bounce logs for each form ID
    bounceInfo.hasAlarmed = true
  }
}

/**
 * Parses an SNS notification and updates the Bounce collection.
 * @param body The request body of the notification
 */
export const updateBounces = async (body: ISnsNotification): Promise<void> => {
  const notification: IEmailNotification = JSON.parse(body.Message)
  // This is the crucial log statement which allows us to debug bounce-related
  // issues, as it logs all the details about deliveries and bounces
  logger.info(notification)
  const latestBounces = Bounce.fromSnsNotification(notification)
  if (!latestBounces) return
  const formId = latestBounces.formId
  const oldBounces = await Bounce.findOne({ formId })
  if (oldBounces) {
    updateBounceDoc(oldBounces, latestBounces, notification)
    logCriticalBounce(oldBounces, formId)
    await oldBounces.save()
  } else {
    logCriticalBounce(latestBounces, formId)
    await latestBounces.save()
  }
}
