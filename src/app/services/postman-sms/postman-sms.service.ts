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
import { SmsType } from './postman-sms.types'
import { renderVerificationSms } from './postman-sms.util'

const logger = createLoggerWithLabel(module)
const Form = getFormModel(mongoose)
class PostmanSmsService {
  /**
   * Send SMS using Postman API to Member of public
   *
   * SMSes will be sent using govsg sender id.
   * Messages to any member of public MUST be sent using this method.
   */
  sendMopSms(
    smsData: FormOtpData | AdminContactOtpData,
    recipient: string,
    message: string,
    smsType: SmsType,
    senderIp?: string,
  ): ResultAsync<true, SmsSendError | InvalidNumberError> {
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
  private sendInternalSms() {
    // stub
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
      return this.sendMopSms(
        otpData,
        recipient,
        message,
        SmsType.Verification,
        senderIp,
      )
    })
  }
}

export default new PostmanSmsService()
