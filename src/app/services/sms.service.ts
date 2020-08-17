import { SecretsManager } from 'aws-sdk'
import mongoose from 'mongoose'
import NodeCache from 'node-cache'
import Twilio from 'twilio'

import config from '../../config/config'
import { createLoggerWithLabel } from '../../config/logger'
import { isPhoneNumber } from '../../shared/util/phone-num-validation'
import { VfnErrors } from '../../shared/util/verification'
import {
  AdminContactOtpData,
  FormOtpData,
  LogSmsParams,
  LogType,
  SmsType,
} from '../../types'
import getFormModel from '../models/form.server.model'
import getSmsCountModel from '../models/sms_count.server.model'

const logger = createLoggerWithLabel('sms')
const SmsCount = getSmsCountModel(mongoose)
const Form = getFormModel(mongoose)
const secretsManager = new SecretsManager({ region: config.aws.region })
// The twilioClientCache is only initialized once even when sms.service.js is
// required by different files.
// Given that it is held in memory, when credentials are modified on
// secretsManager, the app will need to be redeployed to retrieve new
// credentials, or wait 10 seconds before.
const twilioClientCache = new NodeCache({ deleteOnExpire: true, stdTTL: 10 })

type TwilioCredentials = {
  accountSid: string
  apiKey: string
  apiSecret: string
  messagingServiceSid: string
}

/**
 * Retrieves credentials from secrets manager
 * @param msgSrvcName The name of credential stored in the secret manager.
 * @returns The credentials if available, null if secret does not exist or is malformed.
 */
const getCredentials = async (
  msgSrvcName: string,
): Promise<TwilioCredentials | null> => {
  try {
    const data = await secretsManager
      .getSecretValue({ SecretId: msgSrvcName })
      .promise()
    if (data.SecretString) {
      const credentials = JSON.parse(data.SecretString)
      if (
        credentials.accountSid &&
        credentials.apiKey &&
        credentials.apiSecret &&
        credentials.messagingServiceSid
      ) {
        return credentials
      }
    }
  } catch (err) {
    logger.error(
      `getCredentials: msgSrvcName="${msgSrvcName}" error="${err.stack}"`,
    )
  }
  return null
}

type TwilioConfig = {
  client: Twilio.Twilio
  msgSrvcSid: string
}

/**
 *
 * @param msgSrvcName The name of credential stored in the secret manager
 * @returns A TwilioConfig containing the client and the sid linked to the msgSrvcName if defined, or the defaultConfig if not.
 */
const getTwilio = async (
  msgSrvcName: string,
  defaultConfig: TwilioConfig,
): Promise<TwilioConfig> => {
  if (msgSrvcName) {
    // Retrieve client and msgSrvcSid from cache
    const cached = twilioClientCache.get<TwilioConfig>(msgSrvcName)
    if (cached !== undefined) {
      return cached
    }
    // If not found in cache, retrieve credentials from AWS secret manager.
    // Even if the msgSrvcName exists and a secret is returned, if the secret is
    // malformed (missing required keys), null will still be returned.
    // If null is returned, fallback to default Twilio config.
    try {
      const credentials = await getCredentials(msgSrvcName)
      if (credentials !== null) {
        const {
          accountSid,
          apiKey,
          apiSecret,
          messagingServiceSid,
        } = credentials
        // Create twilioClient
        const result: TwilioConfig = {
          client: Twilio(apiKey, apiSecret, { accountSid }),
          msgSrvcSid: messagingServiceSid,
        }
        // Add it to the cache
        twilioClientCache.set(msgSrvcName, result)
        logger.info(`getTwilio: added msgSrvcName="${msgSrvcName}" to cache`)
        return result
      }
    } catch (err) {
      logger.error(
        `getTwilio: Defaulting to central twilio client. msgSrvcName="${msgSrvcName}" error="${err.stack}"`,
      )
    }
  }
  return defaultConfig
}

/**
 * Retrieve the relevant data required to send an OTP from given formId
 * @param formId The form to retrieve data from
 * @returns Relevant OTP data containing the linked messaging service name (if available), and form details such as its id and the admin.
 *
 */
const getOtpDataFromForm = async (formId: string) => {
  const otpData = await Form.getOtpData(formId)
  return otpData
}

/**
 * Sends a message to a valid phone number
 * @param twilioConfig The configuration used to send OTPs with
 * @param twilioData.client The client to use
 * @param twilioData.msgSrvcSid The message service sid to send from with.
 * @param otpData The data for logging smsCount
 * @param recipient The mobile number of the recipient
 * @param message The message to send
 */
const send = async (
  twilioConfig: TwilioConfig,
  otpData: FormOtpData | AdminContactOtpData,
  recipient: string,
  message: string,
  smsType: SmsType,
) => {
  if (!isPhoneNumber(recipient)) {
    throw new Error(`${recipient} is not a valid phone number`)
  }

  const { client, msgSrvcSid } = twilioConfig

  return client.messages
    .create({ to: recipient, body: message, from: msgSrvcSid })
    .then(({ status, sid, errorCode, errorMessage }) => {
      // Sent but with error code.
      // Throw error to be caught in catch block.
      if (!sid || errorCode) {
        throw new TwilioError(errorMessage, errorCode, status)
      }

      // Log success
      const logParams: LogSmsParams = {
        otpData,
        smsType,
        msgSrvcSid,
        logType: LogType.success,
      }
      SmsCount.logSms(logParams).catch((err) => {
        logger.error('Error adding smsCount to database: ', err, logParams)
      })

      return true
    })
    .catch((err) => {
      logger.warn(
        `send: SMS Message error with errorCode=${err.code} message=${err.message} status=${err.status}`,
      )

      // Log failure
      const logParams: LogSmsParams = {
        otpData,
        smsType,
        msgSrvcSid,
        logType: LogType.failure,
      }
      SmsCount.logSms(logParams).catch((err) => {
        logger.error('Error adding smsCount to database: ', err, logParams)
      })

      // Invalid number error code, throw a more reasonable error for error
      // handling.
      // See https://www.twilio.com/docs/api/errors/21211
      if (err.code === 21211) {
        const invalidOtpError = new Error(VfnErrors.InvalidMobileNumber)
        invalidOtpError.name = VfnErrors.SendOtpFailed
        throw invalidOtpError
      } else {
        throw err
      }
    })
}

/**
 * Gets the correct twilio client for the form and sends an otp to a valid phonenumber
 * @param recipient The phone number to send to.
 * @param otp The OTP to send.
 * @param formId Form id for logging.
 *
 */
const sendVerificationOtp = async (
  recipient: string,
  otp: string,
  formId: string,
  defaultConfig: TwilioConfig,
) => {
  logger.info(`sendVerificationOtp: formId="${formId}"`)
  const otpData = await getOtpDataFromForm(formId)

  if (!otpData) {
    const errMsg = `sendVerificationOtp: Unable to retrieve otpData from formId="${formId}`
    logger.error(errMsg)
    throw new Error(errMsg)
  }
  const twilioData = await getTwilio(otpData.msgSrvcName, defaultConfig)

  const message = `Use the OTP ${otp} to complete your submission on ${config.app.title}.`

  return send(twilioData, otpData, recipient, message, SmsType.verification)
}

const sendAdminContactOtp = async (
  recipient: string,
  otp: string,
  userId: string,
  defaultConfig: TwilioConfig,
) => {
  logger.info(`sendAdminContactOtp: userId="${userId}"`)

  const message = `Use the OTP ${otp} to verify your emergency contact number.`

  const otpData: AdminContactOtpData = {
    admin: userId,
  }

  return send(defaultConfig, otpData, recipient, message, SmsType.adminContact)
}

class TwilioError extends Error {
  code: number
  status: string

  constructor(message: string, code: number, status: string) {
    super(message)
    this.code = code
    this.status = status
    this.name = this.constructor.name

    // Set the prototype explicitly.
    // See https://github.com/facebook/jest/issues/8279
    Object.setPrototypeOf(this, TwilioError.prototype)
  }
}

module.exports = {
  sendVerificationOtp,
  sendAdminContactOtp,
}
