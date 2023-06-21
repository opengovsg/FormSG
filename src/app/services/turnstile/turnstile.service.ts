import axios from 'axios'
import { errAsync, okAsync, ResultAsync } from 'neverthrow'

import { createLoggerWithLabel } from '../../config/logger'

import { TURNSTILE_VERIFY_URL } from './turnstile.constants'
import {
  MissingTurnstileError,
  TurnstileConnectionError,
  VerifyTurnstileError,
} from './turnstile.errors'

const logger = createLoggerWithLabel(module)

export const verifyTurnstileResponse = (
  response?: unknown,
  remoteip?: string,
): ResultAsync<
  true,
  TurnstileConnectionError | VerifyTurnstileError | MissingTurnstileError
> => {
  // console.log('verifying turnstile response')
  if (!response || typeof response !== 'string') {
    return errAsync(new MissingTurnstileError())
  }
  const verifyTurnstilePromise = axios.post<{ success: boolean }>(
    TURNSTILE_VERIFY_URL,
    {
      params: {
        secret: 'replace',
        response,
        remoteip,
      },
    },
  )
  return ResultAsync.fromPromise(verifyTurnstilePromise, (error) => {
    logger.error({
      message: 'Error verifying turnstile',
      meta: {
        action: 'verifyTurnstileResponse',
      },
      error,
    })
    return new TurnstileConnectionError()
  }).andThen(({ data }) => {
    if (!data.success) {
      logger.warn({
        message: 'Incorrect turnstile response',
        meta: {
          action: 'verifyTurnstileResponse',
        },
      })
      return errAsync(new VerifyTurnstileError())
    }
    return okAsync(true as const)
  })
}

// try {
//   const res = await verifyTurnstilePromise
//   if (!res.data.success) {
//     logger.warn({
//       message: 'Incorrect turnstile captcha response',
//       meta: {
//         action: 'verifyTurnstileResponse',
//       },
//     })
//     return errAsync(new VerifyTurnstileError())
//   }
//   return okAsync(true as const)
// } catch (error) {
//   logger.error({
//     message: 'Error verifying turnstile captcha',
//     meta: {
//       action: 'verifyTurnstileResponse',
//     },
//   })
// }
