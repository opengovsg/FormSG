const twilio = require('twilio')
const featureManager = require('../../config/feature-manager').default
const smsService = require('../services/sms.service')

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
    async sendVerificationOtp(recipient, otp, formId) {
      if (isEnabled) {
        return smsService.sendVerificationOtp(
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
  }
}

module.exports = smsFactory(featureManager.get('sms'))
