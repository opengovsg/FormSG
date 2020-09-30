import { celebrate, Joi } from 'celebrate'
import { RequestHandler } from 'express'

import FeatureManager, {
  FeatureNames,
  RegisteredFeature,
} from '../../config/feature-manager'
import { captchaCheck } from '../controllers/submissions.server.controller'

// TODO(#144): Migrate middlewares and request handlers to the controller layer
interface ICaptchaFactory {
  captchaCheck: RequestHandler
  validateCaptcha: RequestHandler
}

const captchaFeature = FeatureManager.get(FeatureNames.Captcha)

const createCaptchaFactory = ({
  isEnabled,
  props,
}: RegisteredFeature<FeatureNames.Captcha>): ICaptchaFactory => {
  // Feature is enabled and valid.
  if (isEnabled && props?.captchaPrivateKey) {
    return {
      captchaCheck: captchaCheck(props.captchaPrivateKey) as RequestHandler,
      validateCaptcha: celebrate({
        query: Joi.object({
          captchaResponse: Joi.string().allow(null).required(),
        }),
      }),
    }
  }

  // Not enabled or invalid props.
  return {
    captchaCheck: (_req, _res, next) => next(),
    validateCaptcha: (_req, _res, next) => next(),
  }
}

export const CaptchaFactory = createCaptchaFactory(captchaFeature)
