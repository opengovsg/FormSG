import Twilio, { RequestClient } from 'twilio'

import { useMockTwilio } from '../../config/config'
import { ISms, smsConfig } from '../../config/features/sms.config'

import { PrismClient } from './sms.dev.prismclient'
import { sendVerificationOtp } from './sms.service'
import { TwilioConfig } from './sms.types'

interface ISmsFactory {
  sendVerificationOtp: (
    recipient: string,
    otp: string,
    otpPrefix: string,
    formId: string,
    senderIp: string,
  ) => ReturnType<typeof sendVerificationOtp>
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
  }
}

export const SmsFactory = createSmsFactory(smsConfig)
