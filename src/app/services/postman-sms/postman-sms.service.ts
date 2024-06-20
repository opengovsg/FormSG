import axios, { AxiosError } from 'axios'
import mongoose from 'mongoose'
import { errAsync, okAsync, ResultAsync } from 'neverthrow'

import { isPhoneNumber } from '../../../../shared/utils/phone-num-validation'
import { AdminContactOtpData, FormOtpData } from '../../../types'
import { useMockPostmanSms } from '../../config/config'
import { postmanSmsConfig } from '../../config/features/postman-sms.config'
import { createLoggerWithLabel } from '../../config/logger'
import getFormModel from '../../models/form.server.model'
import {
  DatabaseError,
  MalformedParametersError,
} from '../../modules/core/core.errors'
import { getMongoErrorMessage } from '../../utils/handle-mongo-error'
import MailService from '../mail/mail.service'

import { InvalidNumberError, SmsSendError } from './postman-sms.errors'
import {
  BouncedSubmissionSmsData,
  FormDeactivatedSmsData,
  SmsType,
} from './postman-sms.types'
import {
  renderBouncedSubmissionSms,
  renderFormDeactivatedSms,
  renderVerificationSms,
} from './postman-sms.util'

const logger = createLoggerWithLabel(module)
const Form = getFormModel(mongoose)
class PostmanSmsService {
  /**
   * Send SMS using Postman API to Member of public
   *
   * SMSes will be sent using govsg sender id.
   * Messages to any member of public MUST be sent using this method.
   */
  _sendMopSms(
    smsData: FormOtpData,
    recipient: string,
    message: string,
    smsType: SmsType,
    senderIp?: string,
  ): ResultAsync<true, SmsSendError> {
    const logMeta = {
      action: 'sendMopSms',
      recipient,
      smsType,
      smsData,
      senderIp,
    }

    const body = {
      recipient: recipient.replace('+', ''),
      language: 'english',
      values: { body: message },
    }

    if (useMockPostmanSms) {
      return MailService.sendLocalDevMail(
        '[Mock Postman SMS] Captured SMS',
        message,
      )
    }

    const campaignUrl =
      postmanSmsConfig.postmanBaseUrl +
      `/campaigns/${postmanSmsConfig.mopCampaignId}/messages`

    return ResultAsync.fromPromise(
      axios.post(campaignUrl, body, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${postmanSmsConfig.mopCampaignApiKey}`,
        },
      }),
      (error) => {
        logger.warn({
          message: 'Error sending SMS using Postman API',
          meta: {
            ...logMeta,
            postmanError: (error as AxiosError).response?.data,
          },
        })

        return new SmsSendError()
      },
    ).andThen(() => {
      return okAsync(true as const)
    })
  }

  /**
   * Send SMS using Postman API to Internal users
   *
   * SMSes will be sent using FormSG sender id.
   */
  _sendInternalSms(
    smsData:
      | FormDeactivatedSmsData
      | BouncedSubmissionSmsData
      | AdminContactOtpData,
    recipient: string,
    message: string,
    smsType: SmsType,
    senderIp?: string,
  ): ResultAsync<true, SmsSendError | InvalidNumberError> {
    const logMeta = {
      action: '_sendInternalSms',
      recipient,
      smsType,
      smsData,
      senderIp,
    }

    const body = {
      recipient: recipient.replace('+', ''),
      language: 'english',
      values: { body: message },
    }

    if (useMockPostmanSms) {
      return MailService.sendLocalDevMail(
        '[Mock Postman SMS] Captured SMS',
        message,
      )
    }

    const campaignUrl =
      postmanSmsConfig.postmanBaseUrl +
      `/campaigns/${postmanSmsConfig.internalCampaignId}/messages`

    return ResultAsync.fromPromise(
      axios.post(campaignUrl, body, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${postmanSmsConfig.internalCampaignApiKey}`,
        },
      }),
      (error) => {
        logger.warn({
          message: 'Error sending SMS using Postman API',
          meta: {
            ...logMeta,
            postmanError: (error as AxiosError).response?.data,
          },
        })

        return new SmsSendError()
      },
    ).andThen(() => {
      return okAsync(true as const)
    })
  }

  /**
   * Sends an otp to a valid phonenumber through the MOP SMS flow
   * @param recipient The phone number to send to
   * @param otp The OTP to send
   * @param otpPrefix The OTP Prefix to send
   * @param formId Form id for retrieving otp data.
   * @param senderIp The ip address of the person triggering the SMS
   */
  public sendVerificationOtp(
    recipient: string,
    otp: string,
    otpPrefix: string,
    formId: string,
    senderIp: string,
  ): ResultAsync<
    true,
    DatabaseError | MalformedParametersError | SmsSendError | InvalidNumberError
  > {
    const logMeta = {
      action: 'sendVerificationOtp',
      formId,
    }
    logger.info({
      message: `Sending verification OTP for ${formId}`,
      meta: logMeta,
    })

    if (!isPhoneNumber(recipient)) {
      logger.warn({
        message: `${recipient} is not a valid phone number`,
        meta: logMeta,
      })
      return errAsync(new InvalidNumberError())
    }

    return ResultAsync.fromPromise(Form.getOtpData(formId), (error) => {
      logger.error({
        message: `Database error occurred whilst retrieving form otp data`,
        meta: logMeta,
        error,
      })

      return new DatabaseError(getMongoErrorMessage(error))
    }).andThen((otpData) => {
      if (!otpData) {
        const errMsg = `Unable to retrieve otpData from ${formId}`
        logger.error({
          message: errMsg,
          meta: logMeta,
        })

        return errAsync(new MalformedParametersError(errMsg))
      }

      const message = renderVerificationSms(otp, otpPrefix)
      return this._sendMopSms(
        otpData,
        recipient,
        message,
        SmsType.Verification,
        senderIp,
      )
    })
  }

  public sendBouncedSubmissionSms(
    recipient: string,
    recipientEmail: string,
    adminId: string,
    adminEmail: string,
    formId: string,
    formTitle: string,
  ): ResultAsync<true, SmsSendError | InvalidNumberError> {
    const logMeta = {
      action: 'sendBouncedSubmissionSms',
      formId,
    }

    logger.info({
      message: `Sending bounced submission notification for ${recipientEmail}`,
      meta: logMeta,
    })

    if (!isPhoneNumber(recipient)) {
      logger.warn({
        message: `${recipient} is not a valid phone number`,
        meta: logMeta,
      })
      return errAsync(new InvalidNumberError())
    }

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

    return this._sendInternalSms(
      smsData,
      recipient,
      message,
      SmsType.BouncedSubmission,
    )
  }

  public sendFormDeactivatedSms(
    recipient: string,
    recipientEmail: string,
    adminId: string,
    adminEmail: string,
    formId: string,
    formTitle: string,
  ): ResultAsync<true, SmsSendError | InvalidNumberError> {
    const logMeta = {
      action: 'sendFormDeactivatedSms',
      formId,
    }

    logger.info({
      message: `Sending form deactivation notification for ${recipientEmail}`,
      meta: logMeta,
    })

    if (!isPhoneNumber(recipient)) {
      logger.warn({
        message: `${recipient} is not a valid phone number`,
        meta: logMeta,
      })
      return errAsync(new InvalidNumberError())
    }

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

    return this._sendInternalSms(
      smsData,
      recipient,
      message,
      SmsType.DeactivatedForm,
    )
  }

  public sendAdminContactOtp(
    recipient: string,
    otp: string,
    userId: string,
    senderIp: string,
  ): ResultAsync<true, SmsSendError | InvalidNumberError> {
    const logMeta = {
      action: 'sendAdminContactOtp',
      userId,
    }

    logger.info({
      message: `Sending admin contact verification OTP for ${userId}`,
      meta: logMeta,
    })

    if (!isPhoneNumber(recipient)) {
      logger.warn({
        message: `${recipient} is not a valid phone number`,
        meta: logMeta,
      })
      return errAsync(new InvalidNumberError())
    }

    const message = `Use the OTP ${otp} to verify your emergency contact number.`

    const otpData: AdminContactOtpData = {
      admin: userId,
    }

    return this._sendInternalSms(
      otpData,
      recipient,
      message,
      SmsType.AdminContact,
      senderIp,
    )
  }
}

export default new PostmanSmsService()
