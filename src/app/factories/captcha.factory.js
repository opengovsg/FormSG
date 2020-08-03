const featureManager = require('../../config/feature-manager').default
const submissions = require('../controllers/submissions.server.controller')
const { celebrate, Joi } = require('celebrate')

const captchaFactory = ({ isEnabled, props }) => {
  if (isEnabled && props && props.captchaPrivateKey) {
    return {
      captchaCheck: submissions.captchaCheck(props.captchaPrivateKey),
      validateCaptcha: celebrate({
        query: Joi.object({
          captchaResponse: Joi.string().allow(null).required(),
        }),
      }),
    }
  } else {
    return {
      captchaCheck: (req, res, next) => next(),
      validateCaptcha: (req, res, next) => next(),
    }
  }
}

module.exports = captchaFactory(featureManager.get('captcha'))
