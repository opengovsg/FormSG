import { Request, RequestHandler } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'

import { createLoggerWithLabel } from '../../../config/logger'
import { WithForm } from '../../../types'
import { createReqMeta } from '../../utils/request'

import { CaptchaFactory } from './captcha.factory'
import { mapRouteError } from './captcha.util'

const logger = createLoggerWithLabel(module)

export const checkCaptchaResponse: RequestHandler<
  ParamsDictionary,
  { message: string },
  unknown,
  { captchaResponse: string | null }
> = (req, res, next) => {
  const { form } = req as WithForm<typeof req>
  if (!form.hasCaptcha) {
    return next()
  }
  return CaptchaFactory.verifyCaptchaResponse(
    req.query.captchaResponse,
    req.connection.remoteAddress,
  )
    .map(next)
    .mapErr((error) => {
      logger.error({
        message: 'Error while verifying captcha',
        meta: {
          action: 'checkCaptchaResponse',
          formId: form._id,
          ...createReqMeta(req as Request),
        },
        error,
      })
      const { statusCode, errorMessage } = mapRouteError(error)
      return res.status(statusCode).json({ message: errorMessage })
    })
}
