import { celebrate, Joi, Segments } from 'celebrate'
import { RequestHandler } from 'express'
import { okAsync, ResultAsync } from 'neverthrow'

import FeatureManager, {
  FeatureNames,
  RegisteredFeature,
} from '../../../config/feature-manager'
import { MissingFeatureError } from '../../modules/core/core.errors'

import {
  CaptchaConnectionError,
  MissingCaptchaError,
  VerifyCaptchaError,
} from './captcha.errors'
import { makeCaptchaResponseVerifier } from './captcha.service'

interface ICaptchaFactory {
  verifyCaptchaResponse: (
    response: unknown,
    remoteip: string | undefined,
  ) => ResultAsync<
    true,
    | CaptchaConnectionError
    | VerifyCaptchaError
    | MissingCaptchaError
    | MissingFeatureError
  >
  validateCaptchaParams: RequestHandler
}

export const createCaptchaFactory = ({
  isEnabled,
  props,
}: RegisteredFeature<FeatureNames.Captcha>): ICaptchaFactory => {
  // Feature is enabled and valid.
  if (isEnabled && props?.captchaPrivateKey) {
    return {
      verifyCaptchaResponse: makeCaptchaResponseVerifier(
        props.captchaPrivateKey,
      ),
      validateCaptchaParams: celebrate({
        [Segments.QUERY]: Joi.object({
          captchaResponse: Joi.string().allow(null).required(),
        }),
      }),
    }
  }

  // Not enabled or invalid props.
  return {
    // hasCaptcha is true on every form by default even when captcha feature is not enabled.
    // Hence, allow the function to be called but don't take any action.
    verifyCaptchaResponse: () => okAsync(true),
    validateCaptchaParams: (_req, _res, next) => next(),
  }
}

const captchaFeature = FeatureManager.get(FeatureNames.Captcha)
export const CaptchaFactory = createCaptchaFactory(captchaFeature)
