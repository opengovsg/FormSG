import axios from 'axios'
import { errAsync, okAsync, ResultAsync } from 'neverthrow'

import { createLoggerWithLabel } from '../../../config/logger'

import { GOOGLE_RECAPTCHA_URL } from './captcha.constants'
import {
  CaptchaConnectionError,
  MissingCaptchaError,
  VerifyCaptchaError,
} from './captcha.errors'

const logger = createLoggerWithLabel(module)

export class CaptchaService {
  #captchaPrivateKey: string

  constructor(privateKey: string) {
    this.#captchaPrivateKey = privateKey
  }

  verifyCaptchaResponse(
    response: string | null,
    remoteip: string,
  ): ResultAsync<
    true,
    CaptchaConnectionError | VerifyCaptchaError | MissingCaptchaError
  > {
    if (!response) {
      return errAsync(new MissingCaptchaError())
    }
    const verifyCaptchaPromise = axios.get(GOOGLE_RECAPTCHA_URL, {
      params: {
        secret: this.#captchaPrivateKey,
        response,
        remoteip,
      },
    })
    return ResultAsync.fromPromise(verifyCaptchaPromise, (error) => {
      logger.error({
        message: 'Error verifying captcha',
        meta: {
          action: 'captchaCheck',
        },
        error,
      })
      return new CaptchaConnectionError()
    }).andThen(({ data }) => {
      if (!data.success) {
        logger.error({
          message: 'Incorrect captcha response',
          meta: {
            action: 'captchaCheck',
          },
        })
        return errAsync(new VerifyCaptchaError())
      }
      return okAsync(true)
    })
  }
}
