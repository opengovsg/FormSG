const twilio = require('twilio')
const featureManager = require('../../config/feature-manager').default
const SmsService = require('../services/sms.service')

const smsFactory = ({ isEnabled, props }) => {
  let twilioClient
  if (isEnabled && props) {
    twilioClient = twilio(props.twilioApiKey, props.twilioApiSecret, {
      accountSid: props.twilioAccountSid,
    })
  }

  let twilioConfig = {
    msgSrvcSid: props && props.twilioMsgSrvcSid,
    client: twilioClient,
  }

  return {
    sendVerificationOtp(recipient, otp, formId) {
      if (isEnabled) {
        return SmsService.sendVerificationOtp(
          recipient,
          otp,
          formId,
          twilioConfig,
        )
      } else {
        throw new Error(
          `Verification OTP has not been configured to be sent for mobile fields`,
        )
      }
    },
    sendAdminContactOtp(recipient, otp, userId) {
      if (isEnabled) {
        return SmsService.sendAdminContactOtp(
          recipient,
          otp,
          userId,
          twilioConfig,
        )
      } else {
        throw new Error(`Send Admin Contact OTP has not been enabled`)
      }
    },
  }
}

module.exports = smsFactory(featureManager.get('sms'))
