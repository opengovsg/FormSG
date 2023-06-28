import axios from 'axios'
import { errAsync, okAsync, ResultAsync } from 'neverthrow'

import { turnstileConfig } from '../../config/features/turnstile.config'
import { createLoggerWithLabel } from '../../config/logger'

import { TURNSTILE_CAPTCHA_VERIFY_URL } from './turnstile.constants'
import {
  MissingTurnstileError,
  TurnstileConnectionError,
  VerifyTurnstileError,
} from './turnstile.errors'

const logger = createLoggerWithLabel(module)

type TurnstileResponse = {
  success: boolean
  'error-codes': string
  challenge: string
  hostname: string
}

export const verifyTurnstileResponse = (
  response?: unknown,
  remoteip?: string,
): ResultAsync<
  true,
  TurnstileConnectionError | MissingTurnstileError | VerifyTurnstileError
> => {
  if (!response) {
    return errAsync(new MissingTurnstileError())
  }
  const verifyTurnstilePromise = axios.post<TurnstileResponse>(
    TURNSTILE_CAPTCHA_VERIFY_URL,
    {
      secret: turnstileConfig.turnstilePrivateKey,
      response,
      remoteip,
    },
    // headers are required due to an issue with axios version
    // https://stackoverflow.com/questions/74713476/getting-unexpected-end-of-file-axios-error-while-making-a-get-request-in-this
    { headers: { 'Accept-Encoding': 'gzip,deflate,compress' } },
  )
  return ResultAsync.fromPromise(verifyTurnstilePromise, (error) => {
    logger.error({
      message: 'Error reaching Cloudflare Turnstile',
      meta: {
        action: 'verifyTurnstileResponse',
      },
      error,
    })
    return new TurnstileConnectionError()
  }).andThen(({ data }) => {
    if (!data.success) {
      logger.warn({
        message:
          'Incorrect turnstile parameters, Error:' +
          data['error-codes'].toString(),
        meta: {
          action: 'verifyTurnstileResponse',
        },
      })
      return errAsync(new VerifyTurnstileError())
    }
    return okAsync(true as const)
  })
}
