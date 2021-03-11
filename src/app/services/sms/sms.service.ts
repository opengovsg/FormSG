import { SecretsManager } from 'aws-sdk'
import dedent from 'dedent-js'
import mongoose from 'mongoose'
import { errAsync, okAsync, ResultAsync } from 'neverthrow'
import NodeCache from 'node-cache'
import Twilio from 'twilio'

import config from '../../../config/config'
import { createLoggerWithLabel } from '../../../config/logger'
import { isPhoneNumber } from '../../../shared/util/phone-num-validation'
import { AdminContactOtpData, FormOtpData } from '../../../types'
import getFormModel from '../../models/form.server.model'
import {
  DatabaseError,
  MalformedParametersError,
} from '../../modules/core/core.errors'

import { InvalidNumberError, SmsSendError } from './sms.errors'
import {
  BouncedSubmissionSmsData,
  BounceNotificationSmsParams,
  FormDeactivatedSmsData,
  LogSmsParams,
  LogType,
  SmsType,
  TwilioConfig,
  TwilioCredentials,
} from './sms.types'
import {
  renderBouncedSubmissionSms,
  renderFormDeactivatedSms,
} from './sms.util'
import getSmsCountModel from './sms_count.server.model'

const logger = createLoggerWithLabel(module)
const SmsCount = getSmsCountModel(mongoose)
const Form = getFormModel(mongoose)
const secretsManager = new SecretsManager({ region: config.aws.region })
// The twilioClientCache is only initialized once even when sms.service.js is
// required by different files.
// Given that it is held in memory, when credentials are modified on
// secretsManager, the app will need to be redeployed to retrieve new
// credentials, or wait 10 seconds before.
const twilioClientCache = new NodeCache({ deleteOnExpire: true, stdTTL: 10 })

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
    logger.error({
      message: 'Error retrieving credentials',
      meta: {
        action: 'getCredentials',
        msgSrvcName,
      },
      error: err,
    })
  }
  return null
}

/**
 *
 * @param msgSrvcName The name of credential stored in the secret manager
 * @returns A TwilioConfig containing the client and the sid linked to the msgSrvcName if defined, or the defaultConfig if not.
 */
const getTwilio = async (
  msgSrvcName: string | undefined,
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
        logger.info({
          message: `Added ${msgSrvcName} to cache`,
          meta: {
            action: 'getTwilio',
            msgSrvcName,
          },
        })
        return result
      }
    } catch (err) {
      logger.warn({
        message:
          'Failed to retrieve from cache. Defaulting to central Twilio client',
        meta: {
          action: 'getTwilio',
          msgSrvcName,
        },
        error: err,
      })
    }
  }
  return defaultConfig
}

const logSmsSend = (logParams: LogSmsParams) => {
  return SmsCount.logSms(logParams).catch((error) => {
    logger.error({
      message: 'Error logging sms count to database',
      meta: {
        action: 'logSmsSend',
        ...logParams,
      },
      error,
    })
  })
}

/**
 * Sends a message to a valid phone number
 * @param twilioConfig The configuration used to send OTPs with
 * @param twilioData.client The client to use
 * @param twilioData.msgSrvcSid The message service sid to send from with.
 * @param smsData The data for logging smsCount
 * @param recipient The mobile number of the recipient
 * @param message The message to send
 */
const send = (
  twilioConfig: TwilioConfig,
  smsData: FormOtpData | AdminContactOtpData,
  recipient: string,
  message: string,
  smsType: SmsType,
): ResultAsync<true, SmsSendError | InvalidNumberError> => {
  if (!isPhoneNumber(recipient)) {
    logger.warn({
      message: `${recipient} is not a valid phone number`,
      meta: {
        action: 'send',
      },
    })
    return errAsync(new InvalidNumberError())
  }

  const { client, msgSrvcSid } = twilioConfig

  const logMeta = {
    action: 'send',
    smsData,
    smsType,
  }

  return ResultAsync.fromPromise(
    client.messages.create({
      to: recipient,
      body: message,
      from: msgSrvcSid,
      forceDelivery: true,
    }),
    (error) => {
      logger.error({
        message: 'SMS send error',
        meta: logMeta,
        error,
      })

      return new SmsSendError('Error sending SMS to given number', {
        originalError: error,
      })
    },
  )
    .andThen<true, SmsSendError | InvalidNumberError>(
      ({ status, sid, errorCode, errorMessage }) => {
        if (!sid || errorCode) {
          logger.error({
            message: 'Encountered error code or missing sid after sending SMS',
            meta: {
              ...logMeta,
              status,
              errorCode,
              errorMessage,
            },
          })

          // Invalid number error code, throw a more reasonable error for error
          // handling.
          // See https://www.twilio.com/docs/api/errors/21211
          return errAsync(
            errorCode === 21211
              ? new InvalidNumberError()
              : new SmsSendError('Error sending SMS to given number', {
                  status,
                  errorCode,
                  errorMessage,
                }),
          )
        }

        // No errors.
        logger.info({
          message: 'Successfully sent sms',
          meta: logMeta,
        })

        return okAsync(true)
      },
    )
    .map((result) => {
      // Fire log sms success promise without waiting.
      void logSmsSend({
        smsData,
        smsType,
        msgSrvcSid,
        logType: LogType.success,
      })

      return result
    })
    .mapErr((error) => {
      // Fire log sms failure promise without waiting.
      void logSmsSend({
        smsData,
        smsType,
        msgSrvcSid,
        logType: LogType.failure,
      })

      return error
    })
}
/**
 * Gets the correct twilio client for the form and sends an otp to a valid phonenumber
 * @param recipient The phone number to send to
 * @param otp The OTP to send
 * @param formId Form id for retrieving otp data.
 *
 */
export const sendVerificationOtp = (
  recipient: string,
  otp: string,
  formId: string,
  defaultConfig: TwilioConfig,
): ResultAsync<
  true,
  DatabaseError | MalformedParametersError | SmsSendError | InvalidNumberError
> => {
  logger.info({
    message: `Sending verification OTP for ${formId}`,
    meta: {
      action: 'sendVerificationOtp',
      formId,
    },
  })
  return ResultAsync.fromPromise(Form.getOtpData(formId), (error) => {
    logger.error({
      message: `Database error occurred whilst retrieving form otp data`,
      meta: {
        action: 'sendVerificationOtp',
        formId,
      },
      error,
    })

    return new DatabaseError()
  }).andThen((otpData) => {
    if (!otpData) {
      const errMsg = `Unable to retrieve otpData from ${formId}`
      logger.error({
        message: errMsg,
        meta: {
          action: 'sendVerificationOtp',
          formId,
        },
      })

      return errAsync(new MalformedParametersError(errMsg))
    }

    return ResultAsync.fromSafePromise<
      TwilioConfig,
      SmsSendError | InvalidNumberError
    >(getTwilio(otpData.msgSrvcName, defaultConfig)).andThen<
      true,
      SmsSendError | InvalidNumberError
    >((twilioConfig) => {
      const message = dedent`Use the OTP ${otp} to complete your submission on ${
        new URL(config.app.appUrl).host
      }.

  If you did not request this OTP, do not share the OTP with anyone else. You can safely ignore this message.`

      return send(
        twilioConfig,
        otpData,
        recipient,
        message,
        SmsType.Verification,
      )
    })
  })
}

export const sendAdminContactOtp = (
  recipient: string,
  otp: string,
  userId: string,
  defaultConfig: TwilioConfig,
): ResultAsync<true, SmsSendError | InvalidNumberError> => {
  logger.info({
    message: `Sending admin contact verification OTP for ${userId}`,
    meta: {
      action: 'sendAdminContactOtp',
      userId,
    },
  })

  const message = `Use the OTP ${otp} to verify your emergency contact number.`

  const otpData: AdminContactOtpData = {
    admin: userId,
  }

  return send(defaultConfig, otpData, recipient, message, SmsType.AdminContact)
}

/**
 * Informs recipient that the given form was deactivated.
 * @param params Data for SMS to be sent
 * @param params.recipient Mobile number to be SMSed
 * @param params.recipientEmail The email address of the recipient being SMSed
 * @param params.adminId User ID of the admin of the deactivated form
 * @param params.adminEmail Email of the admin of the deactivated form
 * @param params.formId Form ID of deactivated form
 * @param params.formTitle Title of deactivated form
 * @param defaultConfig Twilio configuration
 */
export const sendFormDeactivatedSms = (
  {
    recipient,
    recipientEmail,
    adminId,
    adminEmail,
    formId,
    formTitle,
  }: BounceNotificationSmsParams,
  defaultConfig: TwilioConfig,
): ResultAsync<true, SmsSendError | InvalidNumberError> => {
  logger.info({
    message: `Sending form deactivation notification for ${recipientEmail}`,
    meta: {
      action: 'sendFormDeactivatedSms',
      formId,
    },
  })

  const message = renderFormDeactivatedSms(formTitle)

  const smsData: FormDeactivatedSmsData = {
    form: formId,
    collaboratorEmail: recipientEmail,
    recipientNumber: recipient,
    formAdmin: {
      email: adminEmail,
      userId: adminId,
    },
  }

  return send(
    defaultConfig,
    smsData,
    recipient,
    message,
    SmsType.DeactivatedForm,
  )
}

/**
 * Informs recipient that a response for the given form was lost due to email bounces.
 * @param params Data for SMS to be sent
 * @param params.recipient Mobile number to be SMSed
 * @param params.recipientEmail The email address of the recipient being SMSed
 * @param params.adminId User ID of the admin of the form
 * @param params.adminEmail Email of the admin of the form
 * @param params.formId Form ID of form
 * @param params.formTitle Title of form
 * @param defaultConfig Twilio configuration
 */
export const sendBouncedSubmissionSms = (
  {
    recipient,
    recipientEmail,
    adminId,
    adminEmail,
    formId,
    formTitle,
  }: BounceNotificationSmsParams,
  defaultConfig: TwilioConfig,
): ResultAsync<true, SmsSendError | InvalidNumberError> => {
  logger.info({
    message: `Sending bounced submission notification for ${recipientEmail}`,
    meta: {
      action: 'sendBouncedSubmissionSms',
      formId,
    },
  })

  const message = renderBouncedSubmissionSms(formTitle)

  const smsData: BouncedSubmissionSmsData = {
    form: formId,
    collaboratorEmail: recipientEmail,
    recipientNumber: recipient,
    formAdmin: {
      email: adminEmail,
      userId: adminId,
    },
  }

  return send(
    defaultConfig,
    smsData,
    recipient,
    message,
    SmsType.BouncedSubmission,
  )
}
