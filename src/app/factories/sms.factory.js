const twilio = require('twilio')
const {
  sendVerificationOtp,
  sendAdminContactOtp,
} = require('../services/sms/sms.service')
const featureManager = require('../../config/feature-manager').default

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
        return sendVerificationOtp(recipient, otp, formId, twilioConfig)
      } else {
        throw new Error(
          `Verification OTP has not been configured to be sent for mobile fields`,
        )
      }
    },
    async sendAdminContactOtp(recipient, otp, userId) {
      if (isEnabled) {
        return sendAdminContactOtp(recipient, otp, userId, twilioConfig)
      } else {
        throw new Error(`Send Admin Contact OTP has not been enabled`)
      }
    },
  }
}

module.exports = smsFactory(featureManager.get('sms'))
