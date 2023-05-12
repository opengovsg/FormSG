import Twilio, { RequestClient } from 'twilio'

import { useMockTwilio } from '../../config/config'
import { ISms, smsConfig } from '../../config/features/sms.config'

import { PrismClient } from './sms.dev.prismclient'
import {
  sendAdminContactOtp,
  sendBouncedSubmissionSms,
  sendFormDeactivatedSms,
  sendVerificationOtp,
} from './sms.service'
import { BounceNotificationSmsParams, TwilioConfig } from './sms.types'

interface ISmsFactory {
  sendVerificationOtp: (
    recipient: string,
    otp: string,
    otpPrefix: string,
    formId: string,
    senderIp: string,
  ) => ReturnType<typeof sendVerificationOtp>
  sendAdminContactOtp: (
    recipient: string,
    otp: string,
    userId: string,
    senderIp: string,
  ) => ReturnType<typeof sendAdminContactOtp>
  /**
   * Informs recipient that the given form was deactivated. Rejects if SMS feature
   * not activated in app.
   * @param params Data for SMS to be sent
   * @param params.recipient Mobile number to be SMSed
   * @param params.recipientEmail The email address of the recipient being SMSed
   * @param params.adminId User ID of the admin of the deactivated form
   * @param params.adminEmail Email of the admin of the deactivated form
   * @param params.formId Form ID of deactivated form
   * @param params.formTitle Title of deactivated form
   */
  sendFormDeactivatedSms: (
    params: BounceNotificationSmsParams,
  ) => ReturnType<typeof sendFormDeactivatedSms>
  /**
   * Informs recipient that a response for the given form was lost due to email bounces.
   * Rejects if SMS feature not activated in app.
   * @param params Data for SMS to be sent
   * @param params.recipient Mobile number to be SMSed
   * @param params.recipientEmail The email address of the recipient being SMSed
   * @param params.adminId User ID of the admin of the form
   * @param params.adminEmail Email of the admin of the form
   * @param params.formId Form ID of form
   * @param params.formTitle Title of form
   */
  sendBouncedSubmissionSms: (
    params: BounceNotificationSmsParams,
  ) => ReturnType<typeof sendBouncedSubmissionSms>
}

// Exported for testing.
export const createSmsFactory = (smsConfig: ISms): ISmsFactory => {
  const { twilioAccountSid, twilioApiKey, twilioApiSecret, twilioMsgSrvcSid } =
    smsConfig

  const twilioClient = Twilio(twilioApiKey, twilioApiSecret, {
    accountSid: twilioAccountSid,
    httpClient: useMockTwilio
      ? new PrismClient('http://127.0.0.1:4010', new RequestClient())
      : undefined,
  })
  const twilioConfig: TwilioConfig = {
    msgSrvcSid: twilioMsgSrvcSid,
    client: twilioClient,
  }

  return {
    sendVerificationOtp: (recipient, otp, otpPrefix, formId, senderIp) =>
      sendVerificationOtp(
        recipient,
        otp,
        otpPrefix,
        formId,
        senderIp,
        twilioConfig,
      ),
    sendAdminContactOtp: (recipient, otp, userId, senderIp) =>
      sendAdminContactOtp(recipient, otp, userId, senderIp, twilioConfig),
    sendFormDeactivatedSms: (params) =>
      sendFormDeactivatedSms(params, twilioConfig),
    sendBouncedSubmissionSms: (params) =>
      sendBouncedSubmissionSms(params, twilioConfig),
  }
}

export const SmsFactory = createSmsFactory(smsConfig)
