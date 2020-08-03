import { FeatureNames, RegisterableFeature } from './types'

const captchaFeature: RegisterableFeature<FeatureNames.Captcha> = {
  name: FeatureNames.Captcha,
  schema: {
    captchaPrivateKey: {
      doc: 'Google Captcha private key',
      format: String,
      default: null,
      env: 'GOOGLE_CAPTCHA',
    },
    captchaPublicKey: {
      doc: 'Google Captcha public key.',
      format: String,
      default: '6Lchkl0UAAAAANw4DUdja4W6A5xFwuomkcaiqnkC',
      env: 'GOOGLE_CAPTCHA_PUBLIC',
    },
  },
}

export default captchaFeature
