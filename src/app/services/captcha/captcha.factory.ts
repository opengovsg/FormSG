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
import { CaptchaService } from './captcha.service'

interface ICaptchaFactory {
  verifyCaptchaResponse: (
    response: string | null | undefined,
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
    const captchaService = new CaptchaService(props.captchaPrivateKey)
    return {
      // Need to bind so this keyword works properly
      verifyCaptchaResponse: captchaService.verifyCaptchaResponse.bind(
        captchaService,
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
    verifyCaptchaResponse: () => okAsync(true),
    validateCaptchaParams: (_req, _res, next) => next(),
  }
}

const captchaFeature = FeatureManager.get(FeatureNames.Captcha)
export const CaptchaFactory = createCaptchaFactory(captchaFeature)
