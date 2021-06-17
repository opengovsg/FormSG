import axios from 'axios'
import { errAsync, okAsync, ResultAsync } from 'neverthrow'

import { captchaConfig } from '../../config/feature-manager/captcha.config'
import { createLoggerWithLabel } from '../../config/logger'

import { GOOGLE_RECAPTCHA_URL } from './captcha.constants'
import {
  CaptchaConnectionError,
  MissingCaptchaError,
  VerifyCaptchaError,
} from './captcha.errors'

const logger = createLoggerWithLabel(module)

export const verifyCaptchaResponse = (
  response?: unknown,
  remoteip?: string,
): ResultAsync<
  true,
  CaptchaConnectionError | VerifyCaptchaError | MissingCaptchaError
> => {
  if (!response || typeof response !== 'string') {
    return errAsync(new MissingCaptchaError())
  }
  const verifyCaptchaPromise = axios.get<{ success: boolean }>(
    GOOGLE_RECAPTCHA_URL,
    {
      params: {
        secret: captchaConfig.captchaPrivateKey,
        response,
        remoteip,
      },
    },
  )
  return ResultAsync.fromPromise(verifyCaptchaPromise, (error) => {
    logger.error({
      message: 'Error verifying captcha',
      meta: {
        action: 'verifyCaptchaResponse',
      },
      error,
    })
    return new CaptchaConnectionError()
  }).andThen(({ data }) => {
    if (!data.success) {
      logger.warn({
        message: 'Incorrect captcha response',
        meta: {
          action: 'verifyCaptchaResponse',
        },
      })
      return errAsync(new VerifyCaptchaError())
    }
    return okAsync(true)
  })
}
