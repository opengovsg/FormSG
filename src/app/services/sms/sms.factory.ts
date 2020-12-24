import Twilio from 'twilio'

import FeatureManager, {
  FeatureNames,
  RegisteredFeature,
} from '../../../config/feature-manager'

import { sendAdminContactOtp, sendVerificationOtp } from './sms.service'
import { TwilioConfig } from './sms.types'

interface ISmsFactory {
  sendVerificationOtp: (
    recipient: string,
    otp: string,
    formId: string,
  ) => ReturnType<typeof sendVerificationOtp>
  sendAdminContactOtp: (
    recipient: string,
    otp: string,
    userId: string,
  ) => ReturnType<typeof sendAdminContactOtp>
}

const smsFeature = FeatureManager.get(FeatureNames.Sms)

// Exported for testing.
export const createSmsFactory = (
  smsFeature: RegisteredFeature<FeatureNames.Sms>,
): ISmsFactory => {
  if (!smsFeature.isEnabled || !smsFeature.props) {
    const errorMessage = 'SMS feature must be enabled in Feature Manager first'
    return {
      sendAdminContactOtp: () => {
        //eslint-disable-next-line
        throw new Error(`sendAdminContactOtp: ${errorMessage}`)
      },
      sendVerificationOtp: () => {
        //eslint-disable-next-line
        throw new Error(`sendVerificationOtp: ${errorMessage}`)
      },
    }
  }

  const {
    twilioAccountSid,
    twilioApiKey,
    twilioApiSecret,
    twilioMsgSrvcSid,
  } = smsFeature.props

  const twilioClient = Twilio(twilioApiKey, twilioApiSecret, {
    accountSid: twilioAccountSid,
  })
  const twilioConfig: TwilioConfig = {
    msgSrvcSid: twilioMsgSrvcSid,
    client: twilioClient,
  }

  return {
    sendVerificationOtp: (recipient, otp, formId) =>
      sendVerificationOtp(recipient, otp, formId, twilioConfig),
    sendAdminContactOtp: (recipient, otp, userId) =>
      sendAdminContactOtp(recipient, otp, userId, twilioConfig),
  }
}

export const SmsFactory = createSmsFactory(smsFeature)
